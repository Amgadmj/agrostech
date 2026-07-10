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


# ── Modelo de custos (UNIT_ECONOMICS.md §1–2) ────────────────────────────────
@dataclass
class CostModel:
    """Custos reais por hectare. Valores padrão = piloto terceiro com drone dele."""
    pilot_per_ha: float = 11.50        # R$ 10–13, drone incluso
    logistics_per_ha: float = 4.00     # hotel + comida + combustível (ex. real: R$ 5,10 em 1k ha)
    processing_per_product: float = 1.90
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

    def cogs_per_ha(self, flights: int, products_per_flight: int) -> float:
        field_cost = (self.pilot_per_ha + self.logistics_per_ha) * flights
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


PLANS: dict[str, Plan] = {
    "essencial": Plan("essencial", "Essencial", 1, 1, 35.0, (25, 45),
                      "1 voo • mapa NDVI • relatório técnico • Portal Solis"),
    "ndvi": Plan("ndvi", "NDVI Multiespectral", 1, 2, 45.0, (30, 60),
                 "1 voo • RGB + multiespectral • relatório NDVI"),
    "pacote": Plan("pacote", "Pacote 5 Produtos", 1, 5, 80.0, (60, 110),
                   "1 voo • 5 mapas: NDVI, falha de plantio, paralelismo, pisoteio, área real"),
    "profissional": Plan("profissional", "Profissional", 3, 5, 110.0, (90, 140),
                         "3 voos/safra • 5 mapas por voo • zonas de manejo • Copiloto Ceres"),
    "enterprise": Plan("enterprise", "Enterprise", 3, 5, 120.0, (100, 150),
                       "Tudo do Profissional • auditoria de produção + laudo técnico • SLA prioritário",
                       audit_per_farm=25_000.0),
    "pulverizacao": Plan("pulverizacao", "Pulverização com Drone", 1, 0, 150.0, (120, 180),
                         "Aplicação com drone via pilotos parceiros • preço por aplicação"),
}


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
        m = cm.net_margin(p, cm.cogs_per_ha(plan.flights, plan.products))
        q.iterations.append(f"{step} -> R$ {p:.0f}/ha (margem {m:+.0%})")

    log("Iteração 1: âncora aprovada", price)

    # Iteração 2 — margem saudável? Se não, sobe o preço até o teto da banda.
    cogs = cm.cogs_per_ha(plan.flights, plan.products)
    if cm.net_margin(price, cogs) < MARGIN_HEALTHY:
        raised = min(band_hi, cm.price_for_margin(cogs, MARGIN_HEALTHY))
        if raised > price:
            price = raised
            log("Iteração 2: preço elevado para margem saudável (25%)", price)

    # Iteração 3 — ainda abaixo do saudável: aplicar alavancas de custo em volume.
    if cm.net_margin(price, cogs) < MARGIN_HEALTHY and cm.apply_volume_levers(area_ha):
        cogs = cm.cogs_per_ha(plan.flights, plan.products)
        log("Iteração 3: alavancas de custo aplicadas", price)
        # Com custo menor, tentar voltar para mais perto da âncora (competitividade)
        competitive = max(plan.anchor, cm.price_for_margin(cogs, MARGIN_HEALTHY))
        if competitive < price:
            price = competitive
            log("Iteração 4: preço reotimizado (competitivo + saudável)", price)

    # Volume: concessão máxima em mega-contratos, nunca abaixo do saudável pós-alavanca
    if area_ha >= 10_000:
        cm.apply_volume_levers(area_ha)
        cogs = cm.cogs_per_ha(plan.flights, plan.products)
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


def build_quote(area_ha: float, plan_key: str | None = None, farms: int = 1, research: dict = None) -> dict:
    """
    Cotação completa: âncora de 3 planos (doutrina de negociação) em volta do
    plano pedido. Retorna estrutura com iterações e recomendação de piloto.
    """
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


def research_client(client: str, region: str = "") -> dict:
    """Pesquisa web do cliente via Firecrawl Search (mesmo padrão do lead_agent)."""
    result = {"client": client, "findings": [], "note": ""}
    if not client:
        result["note"] = "Cliente não informado. " + RESEARCH_CHECKLIST
        return result
    if not FIRECRAWL_API_KEY or requests is None:
        result["note"] = RESEARCH_CHECKLIST
        return result
    try:
        resp = requests.post(
            "https://api.firecrawl.dev/v1/search",
            headers={
                "Authorization": f"Bearer {FIRECRAWL_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "query": f'"{client}" fazenda OR agropecuária OR sementes OR agronegócio {region}'.strip(),
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
        if not result["findings"]:
            result["note"] = "Busca web sem resultados úteis. " + RESEARCH_CHECKLIST
    except Exception as e:
        logger.warning(f"Firecrawl research error: {e}")
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
    """Mesma cadeia do agent_router: Groq (grátis) -> Gemini -> None."""
    try:
        if os.getenv("GROQ_API_KEY"):
            from langchain_groq import ChatGroq
            return ChatGroq(model="llama-3.3-70b-versatile",
                            api_key=os.getenv("GROQ_API_KEY"), temperature=0.3)
        if os.getenv("GEMINI_API_KEY"):
            from langchain_google_genai import ChatGoogleGenerativeAI
            return ChatGoogleGenerativeAI(model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
                                          google_api_key=os.getenv("GEMINI_API_KEY"),
                                          temperature=0.3)
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

    base_prompt = (
        f"{personas}\n\n"
        "As três personas acima formam o CONSELHO FINANCEIRO da Agrostech. "
        "Revisem juntas a cotação abaixo gerada pelo motor do Deal Desk.\n\n"
        f"CLIENTE: {research.get('client') or 'não informado'}\n"
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
        from langchain_core.messages import HumanMessage
        parecer = llm.invoke([HumanMessage(content=base_prompt)]).content
        if rounds >= 2:
            refine = (
                f"{base_prompt}\n\nPARECER DA RODADA 1:\n{parecer}\n\n"
                "Rodada 2 (final): desafiem o parecer acima e refinem os números finais. "
                "Mantenham os pisos. Máximo 12 linhas."
            )
            parecer = llm.invoke([HumanMessage(content=refine)]).content
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
    """Memo do Deal Desk — visual e direto para o time de vendas (HTML leve)."""
    feat = quote["featured"]
    client = research.get("client")

    out = [f"<b>💼 COTAÇÃO{' — ' + client if client else ''}</b>",
           f"📏 Área: <b>{_ha(quote['area_ha'])} ha</b>"]

    # Quem é o cliente (curto)
    findings = research.get("findings", [])
    if findings:
        out.append("\n<b>🔍 Quem é o cliente</b>")
        for f in findings[:3]:
            desc = f["description"][:90]
            out.append(f"• {desc}" if desc else f"• {f['title'][:90]}")
    elif research.get("note"):
        out.append(f"\n<i>ℹ️ {research['note']}</i>")

    # Planos — visual, um bloco por plano
    out.append(f"\n{DIVIDER}")
    multi = len(quote["quotes"]) > 1
    if multi:
        out.append("<b>📋 APRESENTE OS 3 PLANOS</b> (o do meio fecha)")
    for q in quote["quotes"]:
        emoji = PLAN_EMOJI.get(q.plan.key, "🔹")
        rec = "  ⬅️ <b>RECOMENDADO</b>" if multi and q.plan.key == feat.plan.key else ""
        out.append(f"\n{emoji} <b>{q.plan.label.upper()}</b> — <b>{_brl(q.price_recommended)}/ha</b>{rec}")
        out.append(f"{q.plan.scope}")
        total_line = f"💰 Total: <b>{_brl(q.total)}</b>"
        if q.plan.audit_per_farm:
            total_line += " <i>(inclui auditoria de produção)</i>"
        out.append(total_line)
        if q.calibration_note:
            out.append(f"🔧 <i>{q.calibration_note}</i>")
        if q.status == "VIÁVEL COM RESSALVA":
            out.append("⚠️ Antes de enviar este plano, peça OK do CFO")
        elif q.status == "REPROVADO":
            out.append("🚫 NÃO ENVIAR este plano — fale com o Deal Desk")
    out.append(f"{DIVIDER}")

    open_price, never_below = negotiation_prices(feat)
    out.append("\n<b>🤝 NA NEGOCIAÇÃO</b> (não mostrar ao cliente)")
    out.append(f"• Abra em <b>{_brl(open_price)}/ha</b> → feche em <b>{_brl(feat.price_recommended)}/ha</b>")
    out.append(f"• 🚫 Nunca abaixo de <b>{_brl(never_below)}/ha</b>")
    out.append("• Desconto: até 5% é seu | 5–10% Head of Sales | acima disso CFO/CEO")

    # Porta de entrada
    if quote["pilot_project"]:
        p = quote["pilot_project"]
        out.append(
            f"\n<b>🎯 COMECE PEQUENO (projeto piloto)</b>\n"
            f"• {_ha(p['area_ha'])} ha × {_brl(p['price_per_ha'])}/ha = <b>{_brl(p['total'])}</b>\n"
            f"• Bônus para fechar: preço travado 12 meses + prioridade de agenda"
        )

    # Argumento de venda (específico por serviço)
    if feat.plan.key == "pulverizacao":
        argumento = (
            "\"Sem pisoteio da lavoura, sem diesel de trator e até 90% menos água — "
            "e o produtor não precisa comprar drone nem contratar piloto.\""
        )
    else:
        argumento = (
            "\"O produtor economiza R$ 90–150 por hectare por safra em insumos e diesel — "
            "a cotação se paga na própria safra.\""
        )
    out.append(f"\n<b>💡 ARGUMENTO DE VENDA</b>\n{argumento}")

    if board_note:
        out.append(f"\n<b>🧠 DICA DO CONSELHO</b>\n{board_note}")

    # Detalhes técnicos só no modo debug (CLI --debug)
    if detailed:
        out.append(f"\n<b>🔧 Detalhes do motor</b>")
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
        out.append("<i>Pisos: walk-away 15% | saudável 25% | alvo 35% de margem líquida.</i>")

    return "\n".join(out)


# ── Entradas públicas ────────────────────────────────────────────────────────
def handle_cotacao(args: list[str], use_board: bool = True, rounds: int = 1,
                   detailed: bool = False, rep: str = "") -> str:
    """
    Entrada usada pelo agent_router (/cotacao) e pela CLI.
    Formato: <area_ha> [plano] [nome do cliente...]
    Ex.: 50000 profissional Bruno Luiz  |  1200 Menarim Sementes PR
    """
    if not args:
        return (
            "⚠️ Uso: /cotacao &lt;area_ha&gt; [plano] [cliente]\n"
            "Planos: essencial | ndvi | pacote | profissional | enterprise | pulverizacao\n"
            "Ex.: /cotacao 50000 profissional Bruno Luiz"
        )
    try:
        area = float(str(args[0]).replace(".", "").replace(",", "."))
    except ValueError:
        return "⚠️ A área deve ser o primeiro argumento (em hectares). Ex.: /cotacao 1200 pacote Menarim"

    rest = [a for a in args[1:]]
    plan_key = None
    if rest and rest[0].lower() in PLANS:
        plan_key = rest.pop(0).lower()
    client = " ".join(rest).strip()

    research = research_client(client)
    quote = build_quote(area, plan_key, research=research)
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
            f"\n\n📌 <b>Cotação #{qid} salva.</b> Quando o cliente responder, me conte:\n"
            f"<code>/resultado {qid} ganhou {feat.price_recommended:.0f}</code> | "
            f"<code>/resultado {qid} perdeu motivo</code> | "
            f"<code>/resultado {qid} negociando 65</code>"
        )
    except Exception as e:
        logger.warning(f"Deal memory indisponível: {e}")

    return memo


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
