"""
Agrostech — Deal Desk (Conselho Financeiro + Inteligência de Mercado)

Motor de cotação que alimenta a calculadora do time de vendas. Para cada pedido:
  1. Pesquisa o cliente (Firecrawl Search, se disponível) — nunca cotar no escuro
  2. Calcula unit economics reais (piloto, logística, processamento, imposto 15%)
  3. ITERA o preço até satisfazer: piso de margem + banda competitiva + valor percebido
  4. Convoca o Conselho (personas em agents/finance-board/) para o parecer final via LLM

Fontes de verdade:
  - knowledge-base/UNIT_ECONOMICS.md      (custos e pisos — espelhados em CostModel)
  - knowledge-base/MARKET_INTELLIGENCE.md (bandas competitivas e doutrina)

Uso no bot (via agent_router):  /cotacao <area_ha> [plano] [nome do cliente...]
Uso em CLI:                      python deal_desk.py 50000 profissional "Bruno Luiz"
"""

from __future__ import annotations

import os
import re
import sys
import logging
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path

try:
    import requests
except ImportError:
    requests = None

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent / ".env")
except ImportError:
    pass

logger = logging.getLogger(__name__)

AGENTS_ROOT = Path(__file__).parent.parent / "agents" / "finance-board"

# ── Política de margem (UNIT_ECONOMICS.md §3) ────────────────────────────────
TAX_RATE = 0.15          # imposto sobre receita
MARGIN_WALKAWAY = 0.15   # abaixo disso: só CEO
MARGIN_HEALTHY = 0.25    # padrão competitivo
MARGIN_TARGET = 0.35     # âncora de abertura
MIN_PROJECT_BRL = 3_500  # mínimo de projeto (PRICING_MODEL.md)


# ── Serviços de processamento terceirizado (UNIT_ECONOMICS.md §1) ────────────
# Tabela REAL do processador de imagens freelancer — custo por hectare, por voo.
@dataclass(frozen=True)
class ProcessingService:
    key: str
    label: str                 # nome na tabela do processador
    cost: float                # R$/ha por voo (o que ELE nos cobra)
    aliases: tuple[str, ...]   # gatilhos de detecção (minúsculas, sem acento)
    pain: str                  # dor do cliente que este mapa resolve
    pitch: str                 # valor em 1 linha, pronto para o vendedor


PROCESSING_SERVICES: dict[str, ProcessingService] = {
    "mdt": ProcessingService(
        "mdt", "Processamento de imagem + Modelos Digitais de Terreno", 1.90,
        ("processamento de imagem", "modelos digitais", "modelo digital", "mdt", "mds",
         "rgb", "ortofoto", "ortomosaico", "multiespectral", "ndre",
         "curvas de nivel", "curva de nivel", "relevo", "terreno", "imagem"),
        "precisa do mapa-base da fazenda (ortofoto, relevo, MDT)",
        "planejamento de plantio, drenagem e curvas de nível com precisão de centímetros",
    ),
    "colheita_falha": ProcessingService(
        "colheita_falha", "Linha de colheita + Falha de plantio", 2.99,
        ("falha de plantio", "falhas de plantio", "falha no plantio",
         "falha", "falhas", "replantio", "stand de plantas"),
        "falhas de plantio comendo produtividade",
        "cada 1% de falha pode custar 1 t/ha — o mapa mostra exatamente onde replantar "
        "(e a linha de colheita vai junto, sem custo extra)",
    ),
    "colheita": ProcessingService(
        "colheita", "Linha de colheita", 1.99,
        ("linhas de colheita", "linha de colheita", "colheita"),
        "perdas e desvio na colheita",
        "linhas de colheita otimizadas reduzem manobra, pisoteio de máquina e horas paradas",
    ),
    "paralelismo": ProcessingService(
        "paralelismo", "Paralelismo", 1.89,
        ("paralelismo", "desalinhamento", "fileiras tortas", "fileira"),
        "fileiras desalinhadas desperdiçando área útil",
        "paralelismo corrigido recupera área plantável e facilita todo o trato mecanizado",
    ),
    "pisoteio": ProcessingService(
        "pisoteio", "Pisoteio", 1.89,
        ("pisoteio", "compactacao", "compactado", "trafego de maquina", "esmagamento"),
        "compactação/pisoteio derrubando a produtividade",
        "mostra onde a máquina está esmagando a lavoura — dá para corrigir o tráfego ainda na safra",
    ),
    "area": ProcessingService(
        "area", "Área agricultável", 1.89,
        ("area agricultavel", "area real", "area util", "area plantada", "area cultivada"),
        "não sabe a área real plantada",
        "área agricultável medida de verdade — fim de pagar insumo e arrendamento por hectare que não existe",
    ),
}

# Composição do Pacote 5 Produtos (e dos planos Profissional/Enterprise, por voo)
PACOTE_SERVICES: tuple[str, ...] = ("mdt", "colheita_falha", "paralelismo", "pisoteio", "area")


# ── Modelo de custos (UNIT_ECONOMICS.md §1–2) ────────────────────────────────
@dataclass
class CostModel:
    """Custos reais por hectare. Valores padrão = piloto terceiro com drone dele."""
    pilot_per_ha: float = 11.50        # R$ 10–13, drone incluso
    logistics_per_ha: float = 4.00     # hotel + comida + combustível (ex. real: R$ 5,10 em 1k ha)
    processing_per_product: float = 1.90   # legado: usado só quando não há lista de serviços
    tax_rate: float = TAX_RATE
    levers: list[str] = field(default_factory=list)

    @classmethod
    def standard(cls) -> "CostModel":
        return cls()

    def apply_volume_levers(self, area_ha: float) -> bool:
        """Alavancas de custo negociáveis em escala. Retorna True se algo mudou."""
        changed = False
        if area_ha >= 10_000 and self.pilot_per_ha > 10.0:
            self.pilot_per_ha = 10.0
            self.levers.append("Piloto negociado a R$ 10/ha (volume >= 10.000 ha)")
            changed = True
        if area_ha >= 5_000 and self.logistics_per_ha > 3.0:
            self.logistics_per_ha = 3.0
            self.levers.append("Logística amortizada a R$ 3/ha (fazendas agrupadas, >= 5.000 ha)")
            changed = True
        return changed

    def processing_per_flight(self, services: tuple[str, ...] | list[str]) -> float:
        """Custo real de processamento por voo — soma da tabela do freelancer."""
        return sum(PROCESSING_SERVICES[s].cost for s in services)

    def cogs_per_ha(self, flights: int, products_per_flight: int,
                    services: tuple[str, ...] | list[str] | None = None) -> float:
        field_cost = (self.pilot_per_ha + self.logistics_per_ha) * flights
        if services is not None:
            processing = self.processing_per_flight(services) * flights
        else:  # legado (sales_calculator): estimativa por nº de produtos
            processing = self.processing_per_product * products_per_flight * flights
        return field_cost + processing

    def net_margin(self, price_per_ha: float, cogs: float) -> float:
        if price_per_ha <= 0:
            return -1.0
        return (price_per_ha * (1 - self.tax_rate) - cogs) / price_per_ha

    def price_for_margin(self, cogs: float, margin: float) -> float:
        """P >= COGS / (1 - imposto - margem)"""
        return cogs / (1 - self.tax_rate - margin)


# ── Planos e bandas competitivas (MARKET_INTELLIGENCE.md §2) ─────────────────
@dataclass
class Plan:
    key: str
    label: str
    flights: int
    products: int
    anchor: float            # âncora aprovada (BL-2026-001)
    band: tuple[float, float]  # banda competitiva de mercado (min, max)
    scope: str
    audit_per_farm: float = 0.0  # adder fixo Enterprise (auditoria de produção por fazenda)
    services: tuple[str, ...] = ()  # chaves de PROCESSING_SERVICES por voo (repetição permitida)


PLANS: dict[str, Plan] = {
    "essencial": Plan("essencial", "Essencial", 1, 1, 35.0, (25, 45),
                      "1 voo • mapa NDVI • relatório técnico • Portal Solis",
                      services=("mdt",)),
    "ndvi": Plan("ndvi", "NDVI Multiespectral", 1, 2, 45.0, (30, 60),
                 "1 voo • RGB + multiespectral • relatório NDVI",
                 services=("mdt", "mdt")),
    "pacote": Plan("pacote", "Pacote 5 Produtos", 1, 5, 80.0, (60, 110),
                   "1 voo • 6 mapas: NDVI, falha de plantio, linha de colheita (bônus), "
                   "paralelismo, pisoteio, área real",
                   services=PACOTE_SERVICES),
    "profissional": Plan("profissional", "Profissional", 3, 5, 110.0, (90, 140),
                         "3 voos/safra • 6 mapas por voo • zonas de manejo • Copiloto Ceres",
                         services=PACOTE_SERVICES),
    "enterprise": Plan("enterprise", "Enterprise", 3, 5, 120.0, (100, 150),
                       "Tudo do Profissional • auditoria de produção + laudo técnico • SLA prioritário",
                       audit_per_farm=25_000.0, services=PACOTE_SERVICES),
    "pulverizacao": Plan("pulverizacao", "Pulverização com Drone", 1, 0, 150.0, (120, 180),
                         "Aplicação com drone via pilotos parceiros • preço por aplicação"),
}


# ── Detecção consultiva: o que o vendedor/cliente pediu? ─────────────────────
def _norm_text(text: str) -> str:
    """Minúsculas e sem acento, preservando o tamanho (mapeamento 1:1 por caractere)."""
    out = []
    for ch in text.lower():
        base = "".join(c for c in unicodedata.normalize("NFD", ch)
                       if not unicodedata.combining(c))
        out.append(base if len(base) == 1 else ch)
    return "".join(out)


def detect_services(text: str) -> list[str]:
    """Mapeia texto livre (dores, produtos e derivados: RGB, ortofoto, multiespectral,
    MDT, compactação...) para as chaves de PROCESSING_SERVICES, na ordem citada."""
    norm = _norm_text(text or "")
    hits: dict[str, int] = {}
    for key, svc in PROCESSING_SERVICES.items():
        for alias in svc.aliases:
            idx = norm.find(alias)
            if idx >= 0 and (key not in hits or idx < hits[key]):
                hits[key] = idx
    # "falha de plantio" só existe em bundle com linha de colheita — não cobrar 2×
    if "colheita_falha" in hits and "colheita" in hits:
        del hits["colheita"]
    return [k for k, _ in sorted(hits.items(), key=lambda kv: kv[1])]


def _strip_service_mentions(text: str) -> str:
    """Apaga do texto as menções a serviços, sobrando o nome do cliente."""
    norm = _norm_text(text)
    chars = list(text)
    aliases = sorted((a for svc in PROCESSING_SERVICES.values() for a in svc.aliases),
                     key=len, reverse=True)
    for alias in aliases:
        start = 0
        while True:
            idx = norm.find(alias, start)
            if idx < 0:
                break
            blank = " " * len(alias)
            chars[idx:idx + len(alias)] = list(blank)
            norm = norm[:idx] + blank + norm[idx + len(alias):]
            start = idx + len(alias)
    return "".join(chars)


_FILLER_WORDS = {
    "e", "de", "do", "da", "dos", "das", "com", "para", "pra", "o", "a", "os", "as",
    "um", "uma", "na", "no", "em", "quer", "querem", "precisa", "precisam", "pediu",
    "pedindo", "cliente", "ele", "ela", "eles", "mapa", "mapas", "mapear", "servico",
    "servicos", "voo", "voos", "mais", "so", "apenas", "tambem", "problema", "dor",
}


def _clean_client(text: str) -> str:
    """Remove pontuação e palavras de ligação minúsculas — preserva nomes próprios."""
    tokens = re.split(r"[\s,;+/]+", text)
    kept = [t for t in tokens
            if t and not (_norm_text(t) in _FILLER_WORDS and not t[0].isupper())]
    return " ".join(kept).strip()


def _extract_request(text: str) -> tuple[str | None, list[str], str]:
    """Interpreta o texto do vendedor: (plano explícito, serviços detectados, cliente)."""
    plan_key = None
    kept_tokens = []
    for token in (text or "").split():
        tn = _norm_text(token).strip(".,;:!?")
        if plan_key is None and tn in PLANS:
            plan_key = tn
            continue
        kept_tokens.append(token)
    remainder = " ".join(kept_tokens)
    services = [] if plan_key else detect_services(remainder)
    client_text = _strip_service_mentions(remainder) if services else remainder
    return plan_key, services, _clean_client(client_text)


def build_custom_plan(service_keys: list[str]) -> Plan:
    """Plano Sob Medida (à la carte): custo real da tabela do freelancer + âncora
    interpolada nas âncoras aprovadas (1 serviço ≈ Essencial R$35, 5 ≈ Pacote R$80)."""
    keys = tuple(dict.fromkeys(service_keys))
    n = max(len(keys), 1)
    anchor = round((35 + 11.25 * (n - 1)) / 5) * 5
    band = (round(anchor * 0.75), round(anchor * 1.35))
    labels = [PROCESSING_SERVICES[k].label for k in keys]
    scope = "1 voo • " + " + ".join(labels) + " • relatório técnico • Portal Solis"
    return Plan("sob_medida", "Sob Medida", 1, n, float(anchor), band, scope,
                services=keys)


# ── Motor de iteração ─────────────────────────────────────────────────────────
@dataclass
class PlanQuote:
    plan: Plan
    area_ha: float
    cogs: float = 0.0
    price_recommended: float = 0.0
    price_walkaway: float = 0.0
    price_anchor: float = 0.0
    margin: float = 0.0
    status: str = ""
    approval: str = ""
    levers: list[str] = field(default_factory=list)
    iterations: list[str] = field(default_factory=list)
    calibration_note: str = ""  # reaprendizado aplicado (deal_memory)

    @property
    def total(self) -> float:
        return max(self.price_recommended * self.area_ha, MIN_PROJECT_BRL) + self.plan.audit_per_farm


def iterate_plan_quote(plan: Plan, area_ha: float, farms: int = 1, research: dict = None) -> PlanQuote:
    """
    Loop de iteração do Deal Desk: parte da âncora aprovada e ajusta preço e
    custos até satisfazer margem + banda competitiva. Cada passo fica registrado.
    """
    research = research or {}
    cm = CostModel.standard()
    q = PlanQuote(plan=plan, area_ha=area_ha)
    band_lo, band_hi = plan.band
    price = plan.anchor
    q.price_anchor = plan.anchor

    def log(step: str, p: float):
        m = cm.net_margin(p, cm.cogs_per_ha(plan.flights, plan.products, plan.services))
        q.iterations.append(f"{step} -> R$ {p:.0f}/ha (margem {m:+.0%})")

    log("Iteração 1: âncora aprovada", price)

    # Iteração 2 — margem saudável? Se não, sobe o preço até o teto da banda.
    cogs = cm.cogs_per_ha(plan.flights, plan.products, plan.services)
    if cm.net_margin(price, cogs) < MARGIN_HEALTHY:
        raised = min(band_hi, cm.price_for_margin(cogs, MARGIN_HEALTHY))
        if raised > price:
            price = raised
            log("Iteração 2: preço elevado para margem saudável (25%)", price)

    # Iteração 3 — ainda abaixo do saudável: aplicar alavancas de custo em volume.
    if cm.net_margin(price, cogs) < MARGIN_HEALTHY and cm.apply_volume_levers(area_ha):
        cogs = cm.cogs_per_ha(plan.flights, plan.products, plan.services)
        log("Iteração 3: alavancas de custo aplicadas", price)
        # Com custo menor, tentar voltar para mais perto da âncora (competitividade)
        competitive = max(plan.anchor, cm.price_for_margin(cogs, MARGIN_HEALTHY))
        if competitive < price:
            price = competitive
            log("Iteração 4: preço reotimizado (competitivo + saudável)", price)

    # Volume: concessão máxima em mega-contratos, nunca abaixo do saudável pós-alavanca
    if area_ha >= 10_000:
        cm.apply_volume_levers(area_ha)
        cogs = cm.cogs_per_ha(plan.flights, plan.products, plan.services)
        volume_floor = max(band_lo, cm.price_for_margin(cogs, MARGIN_HEALTHY))
        if volume_floor < price:
            q.iterations.append(
                f"Concessão máxima de volume: R$ {volume_floor:.0f}/ha (nunca abaixo)"
            )

    # Reaprendizado e Win-Rate Predictor
    prob_to_close = 0.5
    try:
        import deal_memory
        factor, why = deal_memory.calibration(plan.key)
        prob_to_close = deal_memory.predict_win_rate(plan.key, area_ha, research)
    except Exception:
        factor, why = 1.0, ""
        
    if factor != 1.0:
        adjusted = min(max(price * factor, cm.price_for_margin(cogs, MARGIN_HEALTHY)), band_hi)
        if round(adjusted) != round(price):
            price = adjusted
            q.calibration_note = why
            q.iterations.append(f"Reaprendizado: {why} -> R$ {price:.0f}/ha")

    q.cogs = cogs
    q.price_recommended = round(price, 0)
    q.price_walkaway = round(cm.price_for_margin(cogs, MARGIN_WALKAWAY), 0)
    q.margin = cm.net_margin(q.price_recommended, cogs)
    q.levers = list(cm.levers)

    if q.margin < MARGIN_WALKAWAY:
        q.status = "REPROVADO"
        q.approval = "NÃO COTAR — reestruturar escopo/custos ou escalar ao CEO"
    elif q.margin < MARGIN_HEALTHY:
        if prob_to_close >= 0.90:
            q.status = "APROVADO (DYNAMIC GATE)"
            q.approval = f"Bypass CFO: Probabilidade de fechamento altíssima ({prob_to_close:.0%}) com base em Inteligência de Mercado."
            q.iterations.append(f"Dynamic Gate: Margem {q.margin:.0%} permitida devido a {prob_to_close:.0%} Win Rate.")
        else:
            q.status = "VIÁVEL COM RESSALVA"
            q.approval = "Requer aprovação CFO (margem 15–24%) — só volume/recorrência"
    elif q.margin < MARGIN_TARGET:
        q.status = "APROVADO"
        q.approval = "Autônomo (Deal Desk) — margem saudável"
    else:
        q.status = "APROVADO ⭐"
        q.approval = "Autônomo — margem no alvo"
    return q


def build_quote(area_ha: float, plan_key: str | None = None, farms: int = 1,
                research: dict = None, custom_plan: Plan | None = None) -> dict:
    """
    Cotação completa: âncora de 3 planos (doutrina de negociação) em volta do
    plano pedido — ou de um plano Sob Medida (à la carte) montado a partir dos
    serviços que o cliente pediu. Retorna estrutura com iterações e piloto.
    """
    # Sob Medida com todos os serviços do Pacote = o próprio Pacote (âncora aprovada)
    if custom_plan is not None and set(custom_plan.services) >= set(PACOTE_SERVICES):
        custom_plan = None
        plan_key = "pacote"

    if custom_plan is not None:
        plan_key = custom_plan.key
        premium = PLANS["enterprise"] if area_ha >= 5_000 else PLANS["pacote"]
        plan_list = [PLANS["essencial"], custom_plan, premium]
        quotes = [iterate_plan_quote(p, area_ha, farms, research) for p in plan_list]
        featured = quotes[1]
        return _assemble_quote(area_ha, farms, plan_key, quotes, featured, research)

    plan_key = (plan_key or "pacote").lower()
    if plan_key not in PLANS:
        plan_key = "pacote"

    if plan_key == "pulverizacao":
        keys = ["pulverizacao"]
    else:
        # âncora de 3 planos: entrada / recomendado / premium
        keys = ["essencial", plan_key if plan_key not in ("essencial", "enterprise") else "pacote", "enterprise"]
        keys = list(dict.fromkeys(keys))  # dedupe preservando ordem

    quotes = [iterate_plan_quote(PLANS[k], area_ha, farms, research) for k in keys]
    featured = next((q for q in quotes if q.plan.key == plan_key), quotes[len(quotes) // 2])
    return _assemble_quote(area_ha, farms, plan_key, quotes, featured, research)


def _assemble_quote(area_ha: float, farms: int, plan_key: str,
                    quotes: list[PlanQuote], featured: PlanQuote,
                    research: dict = None) -> dict:

    # Projeto piloto: porta de entrada em contas grandes (10–15% da área)
    pilot = None
    if area_ha >= 5_000:
        pilot_area = max(300.0, min(area_ha * 0.13, 6_500.0))
        pilot = {
            "area_ha": round(pilot_area),
            "price_per_ha": featured.price_recommended,
            "total": round(pilot_area * featured.price_recommended),
        }

    # ROI escalado (MARKET_INTELLIGENCE.md §3): R$ 90–150/ha por safra
    roi_low, roi_high = 90 * area_ha, 150 * area_ha

    # ABM Content Trigger (Marketing Layer Phase 3)
    if area_ha >= 10_000:
        abm_queue_dir = Path(__file__).parent.parent / "data" / "generated"
        abm_queue_dir.mkdir(parents=True, exist_ok=True)
        import time
        client_name = research.get("client", f"Fazenda_Desconhecida_{int(time.time())}") if research else f"Fazenda_Desconhecida_{int(time.time())}"
        abm_file = abm_queue_dir / f"abm_trigger_{client_name.replace(' ', '_').lower()}.md"
        abm_content = f"URGENTE ABM (Account-Based Marketing)\nCliente: {client_name}\nÁrea: {area_ha} ha\nPlano: {plan_key}\nGere conteúdo hiper-personalizado focando em escala e economia massiva para esta conta."
        abm_file.write_text(abm_content, encoding="utf-8")

    return {
        "area_ha": area_ha,
        "farms": farms,
        "plan_key": plan_key,
        "quotes": quotes,
        "featured": featured,
        "pilot_project": pilot,
        "roi_range": (roi_low, roi_high),
    }


# ── Pesquisa de cliente (Market Intelligence) ────────────────────────────────
FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY", "")

RESEARCH_CHECKLIST = (
    "Pesquisa indisponível — qualificar manualmente antes de enviar:\n"
    "  1. Área total (ha), nº de fazendas e culturas\n"
    "  2. Região/UF e distância logística\n"
    "  3. Quem decide (dono / gestor técnico / comprador)\n"
    "  4. Momento da safra e urgência\n"
    "  5. Potencial estratégico (>5.000 ha, cooperativa, caso de referência, recorrência)"
)


def fetch_cnpj_info(cnpj: str) -> dict:
    """Consome a API pública ReceitaWS para obter dados cadastrais de CNPJ brasileiro."""
    cnpj_clean = re.sub(r"\D", "", cnpj)
    if len(cnpj_clean) != 14:
        return {}
    try:
        resp = requests.get(f"https://receitaws.com.br/v1/cnpj/{cnpj_clean}", timeout=8)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("status") == "ERROR":
                return {}
            return {
                "cnpj": cnpj_clean,
                "nome": data.get("nome"),
                "fantasia": data.get("fantasia"),
                "abertura": data.get("abertura"),
                "situacao": data.get("situacao"),
                "logradouro": data.get("logradouro"),
                "numero": data.get("numero"),
                "bairro": data.get("bairro"),
                "municipio": data.get("municipio"),
                "uf": data.get("uf"),
                "cep": data.get("cep"),
                "cnae_principal": data.get("atividade_principal", [{}])[0].get("text"),
                "capital_social": float(data.get("capital_social", 0)),
                "socios": [s.get("nome") for s in data.get("qsa", [])],
                "telefone": data.get("telefone"),
                "email": data.get("email"),
            }
    except Exception as e:
        logger.warning(f"Erro ao buscar CNPJ via ReceitaWS: {e}")
    return {}


def compile_osint_summary(cnpj_data: dict, findings: list) -> str:
    """Compila e consolida dados cadastrais do CNPJ e pesquisa web OSINT num dossiê premium."""
    llm_instance = _get_llm()
    if not llm_instance:
        return ""
    import json

    prompt = (
        "Você é o Analista de Inteligência de Mercado sênior da Agrostech (Special Ops Unit).\n"
        "Sua missão é compilar um dossiê corporativo consolidado com base nas seguintes fontes de inteligência:\n\n"
    )
    if cnpj_data:
        prompt += f"--- DADOS DO CNPJ (ReceitaWS) ---\n{json.dumps(cnpj_data, ensure_ascii=False, indent=2)}\n\n"
    if findings:
        prompt += f"--- PESQUISA WEB (OSINT) ---\n{json.dumps(findings, ensure_ascii=False, indent=2)}\n\n"

    prompt += (
        "Gere um dossiê premium resumido para equipar nosso time de vendas.\n"
        "REQUISITOS DE FORMATAÇÃO E UX (MUITO IMPORTANTE — DIRETRIZES DO PLAYBOOK):\n"
        "- TEXTO PURO SOMENTE. É PROIBIDO usar qualquer tag HTML (<b>, <i>, <code>, <p>, <br>, <ul>, <li>, <div> etc.).\n"
        "- É PROIBIDO usar blocos de código com crases (```) ou crases simples.\n"
        "- Use **texto** (markdown padrão) para negrito, apenas quando for realmente necessário dar ênfase.\n"
        "- Use apenas quebras de linha normais (\\n) para separar parágrafos e tópicos.\n"
        "- Use símbolos simples como '•' para marcadores e listas.\n"
        "- Use emojis com moderação e de forma estratégica, apenas para destacar seções-chave.\n"
        "- Separe seções com divisórias ASCII limpas: '──────────────────'.\n"
        "- Mantenha as mensagens curtas, parágrafos breves e limpos (mobile-first), com excelente contraste visual.\n\n"
        "Organize exatamente nos seguintes tópicos:\n"
        "1. 🏢 **EMPRESA & CADASTRO:**\n"
        "2. 📍 **LOCALIZAÇÃO & GEOGRAFIA:**\n"
        "3. 🌾 **OPERAÇÕES & CULTURAS:**\n"
        "4. ⚡ **ALERTA DE NEGOCIAÇÃO:**\n\n"
        "Seja extremamente estratégico, focado em alta margem e persuasivo. Responda em Português Brasileiro."
    )

    try:
        return llm_instance.call(prompt).strip()
    except Exception as e:
        logger.warning(f"Erro ao compilar sumário OSINT via LLM: {e}")
        return ""


def research_client(client: str, region: str = "") -> dict:
    """Pesquisa web e OSINT do cliente via ReceitaWS (CNPJ) e Firecrawl Search."""
    result = {
        "client": client,
        "findings": [],
        "note": "",
        "cnpj_data": {},
        "osint_summary": ""
    }
    if not client:
        result["note"] = "Cliente não informado. " + RESEARCH_CHECKLIST
        return result

    # Detecção e limpeza de CNPJ
    cnpj_match = re.search(r'\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}', client)
    cnpj_clean = None
    if cnpj_match:
        cnpj_clean = re.sub(r"\D", "", cnpj_match.group(0))
    else:
        # Verifica se o termo tem 14 dígitos contínuos
        digits = re.sub(r"\D", "", client)
        if len(digits) == 14:
            cnpj_clean = digits

    search_term = client

    if cnpj_clean:
        logger.info(f"CNPJ detectado no input: {cnpj_clean}. Buscando informações...")
        cnpj_info = fetch_cnpj_info(cnpj_clean)
        if cnpj_info:
            result["cnpj_data"] = cnpj_info
            search_term = cnpj_info.get("fantasia") or cnpj_info.get("nome") or client
            result["client"] = search_term

    if not FIRECRAWL_API_KEY or requests is None:
        if result["cnpj_data"]:
            result["osint_summary"] = compile_osint_summary(result["cnpj_data"], [])
        else:
            result["note"] = RESEARCH_CHECKLIST
        return result

    try:
        query = f'"{search_term}" fazenda OR agropecuária OR agronegócio OR sementes OR "área total" OR "hectares" {region}'.strip()
        resp = requests.post(
            "https://api.firecrawl.dev/v1/search",
            headers={
                "Authorization": f"Bearer {FIRECRAWL_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "query": query,
                "limit": 4,
            },
            timeout=25,
        )
        data = resp.json().get("data", []) if resp.status_code == 200 else []
        for item in data:
            result["findings"].append({
                "title": item.get("title", ""),
                "url": item.get("url", ""),
                "description": (item.get("description") or "")[:220],
            })

        if result["findings"] or result["cnpj_data"]:
            result["osint_summary"] = compile_osint_summary(result["cnpj_data"], result["findings"])

        if not result["findings"] and not result["cnpj_data"]:
            result["note"] = "Busca web sem resultados úteis. " + RESEARCH_CHECKLIST
    except Exception as e:
        logger.warning(f"Erro na pesquisa Firecrawl: {e}")
        if result["cnpj_data"]:
            result["osint_summary"] = compile_osint_summary(result["cnpj_data"], [])
        else:
            result["note"] = RESEARCH_CHECKLIST
    return result


# ── Conselho Financeiro (LLM sobre as personas) ──────────────────────────────
def _load_persona_prompt(filename: str) -> str:
    path = AGENTS_ROOT / filename
    if not path.exists():
        return ""
    content = path.read_text(encoding="utf-8")
    match = re.search(r"```\n(Você é .+?)```", content, re.DOTALL)
    return match.group(1).strip() if match else ""


def _get_llm():
    """LLM compartilhado (CrewAI/LiteLLM): Groq (grátis) -> Gemini -> None."""
    try:
        from llm_config import get_llm
        return get_llm()
    except Exception as e:
        logger.warning(f"LLM indisponível para o Conselho: {e}")
    return None


def convene_board(quote: dict, research: dict, rounds: int = 1) -> str:
    """
    Convoca o Conselho Financeiro: as 3 personas revisam os números do motor.
    Máximo 2 rodadas (economia de tokens). Sem LLM -> parecer determinístico já
    está no memo; retorna string vazia.
    """
    llm = _get_llm()
    if llm is None:
        return ""

    personas = "\n\n".join(filter(None, [
        _load_persona_prompt("unit_economics_analyst.md"),
        _load_persona_prompt("market_intelligence_analyst.md"),
        _load_persona_prompt("pricing_strategist.md"),
    ])) or "Você é o Conselho Financeiro da Agrostech (analista de custos, analista de mercado e estrategista de pricing)."

    numbers = _memo_numbers_block(quote)
    findings = "\n".join(
        f"- {f['title']}: {f['description']} ({f['url']})" for f in research.get("findings", [])
    ) or research.get("note", "Sem pesquisa disponível.")

    # Reaprendizado: como os clientes reais responderam a cotações recentes
    learnings = ""
    try:
        import deal_memory
        learnings = deal_memory.learnings_block([q.plan.key for q in quote["quotes"]])
    except Exception:
        pass
    learnings_section = (
        f"\nRESPOSTA REAL DOS CLIENTES (últimos 90 dias — use isto na dica):\n{learnings}\n"
        if learnings else ""
    )

    # Contexto consultivo: o que o vendedor relatou e quais serviços o cliente pediu
    rep_ctx = research.get("rep_context") or {}
    rep_section = ""
    if rep_ctx.get("message") or rep_ctx.get("services"):
        svc_labels = ", ".join(
            PROCESSING_SERVICES[k].label for k in rep_ctx.get("services", [])
            if k in PROCESSING_SERVICES
        )
        rep_section = "O QUE O VENDEDOR RELATOU: " + (rep_ctx.get("message") or "—") + "\n"
        if svc_labels:
            rep_section += f"SERVIÇOS QUE O CLIENTE PEDIU: {svc_labels}\n"
        rep_section += (
            "Venda consultiva (SPIN): a dica deve partir da dor relatada acima — "
            "confirmar a dor antes de falar preço.\n\n"
        )

    base_prompt = (
        f"{personas}\n\n"
        "As três personas acima formam o CONSELHO FINANCEIRO da Agrostech. "
        "Revisem juntas a cotação abaixo gerada pelo motor do Deal Desk.\n\n"
        f"CLIENTE: {research.get('client') or 'não informado'}\n"
        f"{rep_section}"
        f"PESQUISA DE MERCADO:\n{findings}\n\n"
        f"NÚMEROS DO MOTOR (custos e pisos já validados — NÃO recalcule, NÃO fure pisos):\n{numbers}\n"
        f"{learnings_section}\n"
        "Entreguem uma DICA DE VENDA para o vendedor, em Português BR simples (sem jargão "
        "financeiro, sem markdown de títulos, sem asteriscos duplos). Formato exato:\n"
        "🧑‍🌾 Cliente: [leitura do cliente em 1–2 linhas]\n"
        "🎯 Abordagem: [como abordar este cliente em 1–2 linhas]\n"
        "🗣️ Se ele reclamar do preço, diga: \"[frase pronta de 1 linha]\"\n"
        "⚠️ Cuidado: [1 risco a evitar nesta negociação]\n"
        "Máximo 8 linhas no total. Nada além disso."
    )

    try:
        parecer = llm.call(base_prompt)
        if rounds >= 2:
            refine = (
                f"{base_prompt}\n\nPARECER DA RODADA 1:\n{parecer}\n\n"
                "Rodada 2 (final): desafiem o parecer acima e refinem os números finais. "
                "Mantenham os pisos. Máximo 12 linhas."
            )
            parecer = llm.call(refine)
        return parecer.strip()
    except Exception as e:
        logger.warning(f"Erro no parecer do Conselho: {e}")
        return ""


# ── Formatação (Telegram HTML-safe / CLI) ────────────────────────────────────
def _brl(v: float) -> str:
    return f"R$ {v:,.0f}".replace(",", ".")


def _memo_numbers_block(quote: dict) -> str:
    lines = [f"Área: {quote['area_ha']:,.0f} ha | Fazendas: {quote['farms']}".replace(",", ".")]
    for q in quote["quotes"]:
        lines.append(
            f"- {q.plan.label}: COGS {q.cogs:.2f}/ha | recomendado {_brl(q.price_recommended)}/ha "
            f"(margem {q.margin:.0%}) | walk-away {_brl(q.price_walkaway)}/ha | "
            f"total {_brl(q.total)} | {q.status} — {q.approval}"
        )
    return "\n".join(lines)


PLAN_EMOJI = {
    "essencial": "🟢", "ndvi": "🌱", "pacote": "⭐",
    "profissional": "🚀", "enterprise": "💎", "pulverizacao": "🚁",
    "sob_medida": "🧩",
}

# Venda consultiva: quando oferecer cada plano (gatilho pela dor do cliente)
PLAN_OFFER_WHEN = {
    "essencial": "o cliente é novo em agricultura de precisão e quer começar simples",
    "ndvi": "a dor é saúde da lavoura (vigor, praga, adubação) — NDVI multiespectral",
    "pacote": "o cliente tem mais de uma dor — 6 mapas do MESMO voo "
              "(a linha de colheita vem de bônus no mapa de falha)",
    "profissional": "o cliente quer acompanhar a safra inteira (3 voos) com zonas de manejo",
    "enterprise": "conta estratégica: auditoria de produção + laudo técnico + SLA prioritário",
    "pulverizacao": "o cliente quer aplicação localizada sem pisoteio e sem comprar drone",
}

DIVIDER = "──────────────────"


def _ha(v: float) -> str:
    return f"{v:,.0f}".replace(",", ".")


def negotiation_prices(feat: PlanQuote) -> tuple[float, float]:
    """(abertura, nunca-abaixo) — abertura ~10% acima do fechamento em múltiplos
    de R$ 5, sem estourar a banda; piso exibido = maior entre margem e banda."""
    open_price = max(
        feat.price_recommended,
        round(feat.cogs / (1 - TAX_RATE - MARGIN_TARGET)),
        round(feat.price_recommended * 1.10 / 5) * 5,
    )
    open_price = min(open_price, feat.plan.band[1])
    never_below = max(feat.price_walkaway, feat.plan.band[0])
    return open_price, never_below


def format_memo(quote: dict, research: dict, board_note: str = "",
                detailed: bool = False) -> str:
    """Memo do Deal Desk — texto puro, visual e direto para o time de vendas."""
    feat = quote["featured"]
    client = research.get("client") or "Não Informado"

    out = [
        f"💼 **COTAÇÃO** — cliente \"{client}\" | serviço \"{feat.plan.label}\"",
        f"📏 Área: **{_ha(quote['area_ha'])} ha**"
    ]

    # Leitura consultiva do pedido: mostra que a cotação partiu do que o vendedor relatou
    rep_ctx = research.get("rep_context") or {}
    svc_keys = [k for k in rep_ctx.get("services", []) if k in PROCESSING_SERVICES]
    if svc_keys or rep_ctx.get("message"):
        out.append("\n🩺 **LEITURA DO PEDIDO**")
        msg = (rep_ctx.get("message") or "").strip()
        if msg:
            out.append(f"• Você relatou: \"{msg[:140]}\"")
        for k in svc_keys:
            svc = PROCESSING_SERVICES[k]
            out.append(f"• {svc.label} → resolve: {svc.pain}")

    # Dossiê OSINT de Alta Performance (ReceitaWS + Firecrawl)
    osint_summary = research.get("osint_summary")
    if osint_summary:
        out.append(f"\n=========================================\n"
                   f"⚡ **DOSSIÊ INTEL (OSINT SPECIAL OPS)**\n"
                   f"=========================================\n"
                   f"{osint_summary}\n"
                   f"=========================================")
    else:
        # Quem é o cliente (curto)
        findings = research.get("findings", [])
        if findings:
            out.append("\n🔍 **Quem é o cliente**")
            for f in findings[:3]:
                desc = f["description"][:90]
                out.append(f"• {desc}" if desc else f"• {f['title'][:90]}")
        elif research.get("note"):
            out.append(f"\nℹ️ {research['note']}")

    # Planos — visual, um bloco por plano
    out.append(f"\n{DIVIDER}")
    multi = len(quote["quotes"]) > 1
    if multi:
        out.append("📋 **APRESENTE OS 3 PLANOS** (o do meio fecha)")
        out.append("🗣️ Venda consultiva: confirme a dor primeiro, apresente valor antes do preço.")
    for q in quote["quotes"]:
        emoji = PLAN_EMOJI.get(q.plan.key, "🔹")
        rec = "  ⬅️ **RECOMENDADO**" if multi and q.plan.key == feat.plan.key else ""
        out.append(f"\n{emoji} **{q.plan.label.upper()}** — **{_brl(q.price_recommended)}/ha**{rec}")
        out.append(f"{q.plan.scope}")
        if q.plan.key == "sob_medida":
            offer = "é exatamente o que o cliente pediu — mostre que você ouviu a dor dele"
        else:
            offer = PLAN_OFFER_WHEN.get(q.plan.key, "")
        if multi and offer:
            out.append(f"💬 Ofereça se: {offer}")
        total_line = f"💰 Total: **{_brl(q.total)}**"
        if q.plan.audit_per_farm:
            total_line += " (inclui auditoria de produção)"
        out.append(total_line)
        if q.calibration_note:
            out.append(f"🔧 {q.calibration_note}")
        if q.status == "VIÁVEL COM RESSALVA":
            out.append("⚠️ Antes de enviar este plano, peça OK do CFO")
        elif q.status == "REPROVADO":
            out.append("🚫 NÃO ENVIAR este plano — fale com o Deal Desk")
    out.append(f"{DIVIDER}")

    # Upsell consultivo: do Sob Medida para o Pacote completo (6 mapas do mesmo voo)
    if feat.plan.key == "sob_medida":
        pacote_q = next((q for q in quote["quotes"] if q.plan.key == "pacote"), None)
        if pacote_q and pacote_q.price_recommended > feat.price_recommended:
            delta = pacote_q.price_recommended - feat.price_recommended
            out.append(
                f"\n💎 **UPGRADE FÁCIL**: por +{_brl(delta)}/ha o cliente leva o Pacote "
                f"completo — 6 mapas do mesmo voo (a linha de colheita vem de bônus)."
            )

    open_price, never_below = negotiation_prices(feat)
    out.append("\n🤝 **NA NEGOCIAÇÃO** (não mostrar ao cliente)")
    out.append(f"• Abra em **{_brl(open_price)}/ha** → feche em **{_brl(feat.price_recommended)}/ha**")
    out.append(f"• 🚫 Nunca abaixo de **{_brl(never_below)}/ha**")
    out.append("• Desconto: até 5% é seu | 5–10% Head of Sales | acima disso CFO/CEO")

    # Porta de entrada
    if quote["pilot_project"]:
        p = quote["pilot_project"]
        out.append(
            f"\n🎯 **COMECE PEQUENO (projeto piloto)**\n"
            f"• {_ha(p['area_ha'])} ha × {_brl(p['price_per_ha'])}/ha = **{_brl(p['total'])}**\n"
            f"• Bônus para fechar: preço travado 12 meses + prioridade de agenda"
        )

    # Argumento de venda (específico por serviço)
    if feat.plan.key == "pulverizacao":
        argumento = (
            "\"Sem pisoteio da lavoura, sem diesel de trator e até 90% menos água — "
            "e o produtor não precisa comprar drone nem contratar piloto.\""
        )
    elif feat.plan.key == "sob_medida" and feat.plan.services:
        pitch = PROCESSING_SERVICES[feat.plan.services[0]].pitch
        argumento = f"\"{pitch[0].upper() + pitch[1:]}.\""
    else:
        argumento = (
            "\"O produtor economiza R$ 90–150 por hectare por safra em insumos e diesel — "
            "a cotação se paga na própria safra.\""
        )
    out.append(f"\n💡 **ARGUMENTO DE VENDA**\n{argumento}")

    if board_note:
        out.append(f"\n🧠 **DICA DO CONSELHO**\n{board_note}")

    # Detalhes técnicos só no modo debug (CLI --debug)
    if detailed:
        out.append(f"\n🔧 **Detalhes do motor**")
        for q in quote["quotes"]:
            out.append(
                f"• {q.plan.label}: COGS R$ {q.cogs:.2f}/ha | margem {q.margin:.0%} | "
                f"{q.status} — {q.approval}"
            )
            if q.levers:
                out.append("  Alavancas: " + "; ".join(q.levers))
        out.append("Iterações (plano em foco):")
        for it in feat.iterations:
            out.append(f"  {it}")
        out.append("Pisos: walk-away 15% | saudável 25% | alvo 35% de margem líquida.")

    return "\n".join(out)


# ── Entradas públicas ────────────────────────────────────────────────────────
def _discovery_message(area: float, client: str) -> str:
    """Pergunta consultiva (SPIN) quando o vendedor não disse qual serviço o cliente quer."""
    header = f"📏 Área: **{_ha(area)} ha**"
    if client:
        header += f" | Cliente: **{client}**"
    return (
        "🧠 **ANTES DO PREÇO, A DOR.**\n"
        f"{header}\n\n"
        "Boa! Só me falta o principal para montar a cotação certa: "
        "**o que o cliente precisa resolver?**\n"
        f"{DIVIDER}\n"
        "🎯 **Qual é a dor dele?**\n"
        "• 🌱 Falhas no plantio / replantio → Linha de colheita + Falha de plantio\n"
        "• 🚜 Perdas na colheita → Linha de colheita\n"
        "• 📏 Fileiras desalinhadas → Paralelismo\n"
        "• 🐾 Compactação / pisoteio de máquina → Pisoteio\n"
        "• 📐 Saber a área real plantada → Área agricultável\n"
        "• 🗺️ Mapa-base + relevo (RGB, ortofoto, MDT) → Processamento de imagem + MDT\n"
        f"{DIVIDER}\n"
        "📦 Ou um plano fechado: essencial | ndvi | pacote | profissional | "
        "enterprise | pulverizacao\n"
        f"{DIVIDER}\n"
        "🗣️ **Pergunte ao cliente antes de cotar (venda consultiva):**\n"
        "1. Qual cultura e em que fase da safra ele está?\n"
        "2. Quanto está custando NÃO resolver isso hoje?\n"
        "3. Quantas fazendas/talhões entram no serviço?\n\n"
        "Responda aqui mesmo com o que ele precisa (ex.: \"falha de plantio e pisoteio\") "
        "que eu monto a cotação na hora. 👊"
    )


def _quote_and_memo(area: float, plan_key: str | None, services: list[str], client: str,
                    rep: str = "", rep_message: str = "", use_board: bool = True,
                    rounds: int = 1, detailed: bool = False) -> str:
    """Monta pesquisa + cotação + memo consultivo e grava no reaprendizado."""
    research = research_client(client)
    research["rep_context"] = {"message": rep_message, "services": services}
    custom = build_custom_plan(services) if services else None
    quote = build_quote(area, plan_key, research=research, custom_plan=custom)
    board_note = convene_board(quote, research, rounds=rounds) if use_board else ""
    memo = format_memo(quote, research, board_note, detailed=detailed)

    # Reaprendizado: grava a cotação e pede o resultado ao vendedor
    try:
        import deal_memory
        feat = quote["featured"]
        open_p, never = negotiation_prices(feat)
        qid = deal_memory.record_quote(
            client, area, feat.plan.key, feat.price_recommended,
            open_p, never, feat.total, rep,
        )
        memo += (
            f"\n\n📌 **Cotação #{qid} salva.** Quando o cliente responder, me conte:\n"
            f"/resultado {qid} ganhou {feat.price_recommended:.0f} | "
            f"/resultado {qid} perdeu motivo | "
            f"/resultado {qid} negociando 65"
        )
    except Exception as e:
        logger.warning(f"Deal memory indisponível: {e}")

    return memo


def handle_cotacao(args: list[str], use_board: bool = True, rounds: int = 1,
                   detailed: bool = False, rep: str = "", user_id: str | int | None = None) -> str:
    """
    Entrada usada pelo agent_router (/cotacao) e pela CLI.
    Formato: <area_ha> [plano ou serviços desejados] [nome do cliente...]
    Ex.: 50000 profissional Bruno Luiz  |  1200 falha de plantio e pisoteio Menarim

    Venda consultiva: se a mensagem não diz qual serviço o cliente quer, o Deal Desk
    pergunta primeiro (estado pendente) — o vendedor responde em texto livre e a
    cotação é concluída por complete_pending_quote().
    """
    if not args:
        return (
            "⚠️ Uso: /cotacao <area_ha> [plano ou serviço] [cliente]\n"
            "Planos: essencial | ndvi | pacote | profissional | enterprise | pulverizacao\n"
            "Serviços à la carte: falha de plantio, linha de colheita, paralelismo, "
            "pisoteio, área agricultável, MDT/ortofoto\n"
            "Ex.: /cotacao 50000 profissional Bruno Luiz\n"
            "Ex.: /cotacao 1200 falha de plantio e pisoteio Fazenda Boa Vista"
        )
    try:
        area = float(str(args[0]).replace(".", "").replace(",", "."))
    except ValueError:
        return "⚠️ A área deve ser o primeiro argumento (em hectares). Ex.: /cotacao 1200 pacote Menarim"

    raw_rest = " ".join(str(a) for a in args[1:]).strip()
    plan_key, services, client = _extract_request(raw_rest)

    # Nada de serviço/plano na mensagem -> descoberta consultiva (pergunta antes de cotar)
    if plan_key is None and not services:
        try:
            import deal_memory
            deal_memory.save_pending(user_id if user_id is not None else "cli",
                                     area, client, raw_rest)
        except Exception as e:
            logger.warning(f"Não foi possível salvar o contexto pendente: {e}")
        return _discovery_message(area, client)

    return _quote_and_memo(area, plan_key, services, client, rep=rep,
                           rep_message=raw_rest, use_board=use_board,
                           rounds=rounds, detailed=detailed)


def complete_pending_quote(user_id: str | int, text: str, rep: str = "",
                           use_board: bool = True) -> str | None:
    """
    Conclui a descoberta consultiva: o vendedor respondeu (texto livre) qual serviço
    o cliente quer. Retorna o memo — ou None se a resposta não menciona serviço nem
    plano (o chamador segue o fluxo normal de NLU sem sequestrar a conversa).
    """
    try:
        import deal_memory
        pending = deal_memory.get_pending(user_id)
    except Exception as e:
        logger.warning(f"Deal memory indisponível: {e}")
        return None
    if not pending:
        return None

    plan_key, services, extra_client = _extract_request(text)
    if plan_key is None and not services:
        return None

    deal_memory.clear_pending(user_id)
    client = pending["client"] or extra_client
    rep_message = (f"{pending['raw_text']} | " if pending["raw_text"] else "") + text
    return _quote_and_memo(pending["area_ha"], plan_key, services, client,
                           rep=rep, rep_message=rep_message, use_board=use_board)


def price_floor_per_ha(flights: int, products: int, area_ha: float = 0.0,
                       margin: float = MARGIN_HEALTHY) -> float:
    """Piso de preço para a sales_calculator — nunca cotar abaixo disso."""
    cm = CostModel.standard()
    if area_ha:
        cm.apply_volume_levers(area_ha)
    return cm.price_for_margin(cm.cogs_per_ha(flights, products), margin)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
        sys.stdout.reconfigure(encoding="utf-8")  # console Windows cp1252
    cli_args = sys.argv[1:] or ["50000", "profissional", "Bruno Luiz"]
    debug = "--debug" in cli_args
    cli_args = [a for a in cli_args if a != "--debug"]
    memo = handle_cotacao(cli_args, use_board=os.getenv("DEAL_DESK_BOARD", "1") == "1",
                          detailed=debug)
    # CLI: remove tags HTML para leitura no terminal
    print(re.sub(r"</?(b|i|code)>", "", memo))
