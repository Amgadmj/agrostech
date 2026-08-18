"""
Agrostech — Captura Inteligente de Evento (/event no Telegram)

Problema que resolve: num estande de feira, ninguém para pra preencher
formulário. A pessoa manda uma foto do crachá, dita "500 hectares de soja
em Rio Verde, WhatsApp tal", solta o cartão de visita — e segue andando.
Este módulo transforma esse fluxo bagunçado em uma ficha organizada por
lead, sem exigir nenhum passo extra do rep além de abrir o lead uma vez.

Fluxo no Telegram:
    /event novo Fazenda Progresso   -> abre (ou reabre) o lead "Fazenda Progresso" e a IA já
                                        responde com um gancho de conversa específico daquela
                                        empresa, pra puxar assunto com o representante na hora
    <qualquer texto/foto/documento> -> tudo vira ficha e log daquele lead, até:
    /event fechar                   -> fecha o lead ativo e mostra o resumo
    /event lista                    -> lista todos os leads já capturados no evento
    /event resumo                   -> mostra a ficha do lead ativo (ou do último fechado)
    /event followup                 -> a IA escreve o texto de WhatsApp de fechamento da noite

Armazenamento (local; ver drive_client.py para espelhar no Google Drive):
    runner/data/<EVENT_CODE>/<slug-do-lead>/
        _ficha.md   <- cartão estruturado (reescrito pela IA a cada mensagem nova)
        log.md      <- log cronológico bruto — nunca é sobrescrito, só cresce
        midia/      <- fotos, documentos e áudios enviados, nomeados por timestamp

    runner/data/<EVENT_CODE>/_state.json
        <- qual lead está "aberto" agora para cada usuário do Telegram

O `log.md` é a fonte da verdade (nunca se perde nada nele, mesmo se o LLM
falhar). O `_ficha.md` é um resumo best-effort por cima — se a extração
falhar, a ficha simplesmente não avança nesse turno, mas o log continua
completo.
"""
from __future__ import annotations

import csv
import json
import logging
import re
import unicodedata
from datetime import datetime
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

RUNNER_DIR = Path(__file__).parent
DATA_ROOT = RUNNER_DIR / "data"
CARTEIRA_CSV = RUNNER_DIR.parent / "data" / "clientes_cana.csv"

# Código do evento ativo — trocar aqui (ou tornar dinâmico) para reusar este
# módulo no próximo congresso/feira sem duplicar código.
EVENT_CODE = "AvAg2026"
EVENT_DIR = DATA_ROOT / EVENT_CODE
STATE_FILE = EVENT_DIR / "_state.json"

FICHA_FIELDS = [
    ("Nome", "Nome da pessoa de contato"),
    ("Empresa_Fazenda", "Empresa, fazenda ou usina"),
    ("Cargo", "Cargo/função (dono, gestor técnico, comprador...)"),
    ("WhatsApp", "Telefone/WhatsApp"),
    ("UF_Cidade", "Estado e cidade"),
    ("Area_ha", "Área em hectares, se mencionada"),
    ("Cultura", "Cultura (soja, cana, milho, café...)"),
    ("Perfil", "🔴 Operador aeroagrícola / 🔵 Drone-sensor-fabricante / 🟢 Usina-fazenda-cooperativa"),
    ("Interesse", "Oferta A (Piloto AvAg), Oferta B (Parceiro AvAg), ou outro"),
    ("Proximo_passo", "O que foi combinado como próximo passo"),
]

_FICHA_TEMPLATE = "\n".join(f"{label}: " for label, _ in FICHA_FIELDS)

# Resumo estático da doutrina comercial (knowledge-base/MARKET_INTELLIGENCE.md +
# as duas ofertas do evento) — mantido curto de propósito para o insight sair
# rápido. Atualizar aqui se a doutrina mudar de verdade, não a cada detalhe.
DOCTRINE_CHEATSHEET = """
- Reframe central: "não competimos com o avião — dizemos a ele onde voar."
  Nunca soar como substituição de aeronave.
- Oferta A (Piloto AvAg, R$ 3.500): voo de até 100ha, 5 produtos, 48h, credita
  100% em contrato de safra. Para produtor/usina/fazenda.
- Oferta B (Parceiro AvAg, 10% indicação + 5% recorrência, ou white-label a
  partir de R$ 30/ha): para operador aeroagrícola/piloto — ele continua
  vendendo hora de voo, a Agrostech entra como camada de dados por trás.
- Concorrência conhecida: ARPAC (8 bases SP/GO/MG, ~70 mil ha, forte em cana);
  XMobots (sócia Embraer, ~60% do sucroenergético via "Cana Solution").
  Se o prospect é usina/fornecedor de cana em SP/GO/MG, ele provavelmente já
  tem contrato de pulverização com um desses — não tentar desalojar, vender
  por cima (auditoria de produção, laudo bancável, MRV de carbono).
- Se o prospect usa NDVI grátis (satélite/SATVeg/FieldView), nunca competir
  direto — o satélite vigia, o drone comprova (conta planta, acha falha de
  plantio, MDE centimétrico).
- Diferencial sem concorrente publicado: laudo técnico com padrão aceito por
  banco e por certificadora de carbono (Verra/Gold Standard).
"""


def _norm(s: str) -> str:
    return unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().strip().lower()


# ─────────────────────────────────────────────
# Infraestrutura de arquivos
# ─────────────────────────────────────────────

def _slugify(name: str) -> str:
    norm = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    norm = re.sub(r"[^\w\s-]", "", norm).strip().lower()
    norm = re.sub(r"[\s_-]+", "_", norm)
    return norm[:60] or "lead_sem_nome"


def _lead_dir(slug: str) -> Path:
    d = EVENT_DIR / slug
    (d / "midia").mkdir(parents=True, exist_ok=True)
    return d


def _load_state() -> dict:
    if not STATE_FILE.exists():
        return {}
    try:
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        logger.warning("Estado de evento corrompido em %s — recriando.", STATE_FILE)
        return {}


def _save_state(state: dict) -> None:
    EVENT_DIR.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


def _now() -> str:
    return datetime.now().strftime("%d/%m %H:%M")


# ─────────────────────────────────────────────
# Ciclo de vida do lead ativo (por usuário do Telegram)
# ─────────────────────────────────────────────

def open_lead(user_id: int, rep_name: str, lead_name: str) -> dict:
    """Abre (ou reabre) um lead e marca como ativo para este usuário."""
    lead_name = lead_name.strip()
    slug = _slugify(lead_name)
    lead_dir = _lead_dir(slug)
    is_new = not (lead_dir / "_ficha.md").exists()

    if is_new:
        (lead_dir / "_ficha.md").write_text(
            f"# {lead_name}\n\n{_FICHA_TEMPLATE}\n", encoding="utf-8"
        )
        (lead_dir / "log.md").write_text(
            f"# Log — {lead_name}\n\n[{_now()}] Lead aberto por {rep_name}.\n", encoding="utf-8"
        )
    else:
        with (lead_dir / "log.md").open("a", encoding="utf-8") as f:
            f.write(f"\n[{_now()}] Lead reaberto por {rep_name}.\n")

    state = _load_state()
    state[str(user_id)] = {"slug": slug, "lead_name": lead_name, "rep_name": rep_name}
    _save_state(state)

    _drive_sync_lead(lead_dir)
    return {"slug": slug, "lead_name": lead_name, "path": lead_dir, "is_new": is_new}


def get_active(user_id: int) -> Optional[dict]:
    state = _load_state()
    entry = state.get(str(user_id))
    if not entry:
        return None
    return {**entry, "path": _lead_dir(entry["slug"])}


def close_active(user_id: int) -> Optional[dict]:
    active = get_active(user_id)
    if not active:
        return None
    with (active["path"] / "log.md").open("a", encoding="utf-8") as f:
        f.write(f"\n[{_now()}] Lead fechado por {active['rep_name']}.\n")
    state = _load_state()
    state.pop(str(user_id), None)
    _save_state(state)
    _drive_sync_lead(active["path"])
    return active


def list_leads() -> list[dict]:
    if not EVENT_DIR.exists():
        return []
    out = []
    for d in sorted(EVENT_DIR.iterdir()):
        if not d.is_dir() or not (d / "_ficha.md").exists():
            continue
        ficha = (d / "_ficha.md").read_text(encoding="utf-8")
        out.append({"slug": d.name, "ficha": ficha})
    return out


# ─────────────────────────────────────────────
# Captura de conteúdo
# ─────────────────────────────────────────────

def record_text(user_id: int, sender_label: str, text: str) -> Optional[Path]:
    """Anexa uma mensagem de texto ao log do lead ativo e atualiza a ficha."""
    active = get_active(user_id)
    if not active:
        return None
    lead_dir = active["path"]
    with (lead_dir / "log.md").open("a", encoding="utf-8") as f:
        f.write(f"\n[{_now()}] {sender_label}: {text}\n")
    _update_ficha(lead_dir, text)
    _drive_sync_lead(lead_dir)
    return lead_dir


def record_media(user_id: int, sender_label: str, kind: str, filename: str, data: bytes) -> Optional[Path]:
    """Salva uma foto/documento/áudio no lead ativo. `kind` é 'foto', 'documento' ou 'audio'."""
    active = get_active(user_id)
    if not active:
        return None
    lead_dir = active["path"]
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_name = re.sub(r"[^\w.\-]", "_", filename) or "arquivo"
    dest = lead_dir / "midia" / f"{ts}_{safe_name}"
    dest.write_bytes(data)
    with (lead_dir / "log.md").open("a", encoding="utf-8") as f:
        f.write(f"\n[{_now()}] {sender_label} enviou {kind}: midia/{dest.name}\n")
    _drive_sync_lead(lead_dir)
    return dest


def record_system_note(lead_dir: Path, note: str) -> None:
    """Anexa uma nota do sistema (ex.: o insight gerado ao abrir o lead) ao
    log.md — sem disparar re-extração de ficha, é só registro histórico."""
    with (lead_dir / "log.md").open("a", encoding="utf-8") as f:
        f.write(f"\n[{_now()}] [Agrostech IA] {note}\n")
    _drive_sync_lead(lead_dir)


# ─────────────────────────────────────────────
# Inteligência — extração de campos e follow-up
# ─────────────────────────────────────────────

def _lookup_carteira(lead_name: str) -> list[dict]:
    """Confere se o nome bate com algo já mapeado na carteira de cana GO/SP
    (data/clientes_cana.csv). Local, instantâneo — sem chamada de rede.
    Casa por substring nos dois sentidos (nome digitado <-> Grupo/Matriz),
    pra pegar tanto "ATVOS" quanto "Usina ATVOS Rio Claro"."""
    if not CARTEIRA_CSV.exists():
        return []
    alvo = _norm(lead_name)
    if not alvo:
        return []
    hits = []
    try:
        with CARTEIRA_CSV.open(encoding="utf-8") as f:
            for row in csv.DictReader(f):
                grupo = _norm(row.get("Grupo", ""))
                matriz = _norm(row.get("Matriz", ""))
                if not grupo and not matriz:
                    continue
                if grupo in alvo or alvo in grupo or matriz in alvo or alvo in matriz:
                    hits.append(row)
    except OSError as exc:
        logger.warning("Não consegui ler a carteira (%s): %s", CARTEIRA_CSV, exc)
        return []
    return hits[:6]


def compose_company_insight(lead_name: str) -> str:
    """Gera o gancho de conversa específico da empresa, pra mandar assim que
    o rep abre o lead — enquanto ele ainda está de pé na frente do
    representante. Cruza a carteira de cana (fato local, se houver match)
    com a doutrina comercial; nunca inventa dado que não veio de nenhuma
    das duas fontes."""
    import llm_config

    carteira_hits = _lookup_carteira(lead_name)
    if carteira_hits:
        cidades = ", ".join(sorted({h.get("Cidade", "") for h in carteira_hits if h.get("Cidade")}))
        territorio = carteira_hits[0].get("Territorio", "")
        pipeline = carteira_hits[0].get("Pipeline", "")
        contexto_carteira = (
            f"JÁ MAPEADO NA CARTEIRA DE CANA DA AGROSTECH: {len(carteira_hits)} unidade(s) "
            f"em {cidades or 'localização não registrada'} (território {territorio}, hoje na "
            f"fila de {pipeline}). Avise o rep que isso já é uma conta conhecida."
        )
    else:
        contexto_carteira = (
            "Não está na carteira de cana GO/SP já mapeada — é uma empresa nova para a Agrostech "
            "neste evento."
        )

    prompt = f"""Você é o copiloto de vendas da Agrostech (drones agrícolas + créditos de
carbono) no estande do Congresso AvAg 2026. Um rep acabou de abrir um lead
chamado "{lead_name}" — ele está de pé, agora, na frente do representante
dessa empresa, e precisa de um gancho de conversa bom nos próximos 10 segundos.

{contexto_carteira}

DOUTRINA COMERCIAL:
{DOCTRINE_CHEATSHEET}

Escreva uma mensagem curta (3-5 linhas) com:
1. Um insight ou fato específico sobre "{lead_name}" que puxe conversa —
   use o dado da carteira se houver; se não houver, infira com cautela pelo
   nome (é usina/fornecedor de cana? operador aeroagrícola? cooperativa?) e
   diga isso como hipótese a confirmar, nunca como fato inventado.
2. Uma pergunta de abertura pronta pra usar, natural, não robótica.
3. Se der pra saber o perfil, uma dica de 1 linha de qual oferta puxar
   (Piloto AvAg pra produtor/usina, Parceiro AvAg pra operador/piloto).

Nunca invente número, contrato ou nome de pessoa. Se não souber algo, diga
que não sabe e sugira o que perguntar pra descobrir. Responda só com a
mensagem, pronta pra ler no celular, sem título."""

    llm = llm_config.get_llm(temperature=0.5)
    return llm.call(prompt).strip()


def _update_ficha(lead_dir: Path, new_text: str) -> None:
    """Atualiza _ficha.md a partir da nova mensagem, via LLM. Best-effort — nunca
    lança exceção; se falhar, a ficha simplesmente não avança neste turno."""
    try:
        import llm_config

        ficha_atual = (lead_dir / "_ficha.md").read_text(encoding="utf-8")
        campos = "\n".join(f"- {label}: {desc}" for label, desc in FICHA_FIELDS)
        prompt = f"""Você mantém a ficha de um lead capturado no estande da Agrostech durante um evento.

FICHA ATUAL (formato "Campo: valor", uma linha por campo):
{ficha_atual}

CAMPOS POSSÍVEIS:
{campos}

NOVA MENSAGEM recebida agora do rep em campo:
"{new_text}"

Reescreva a ficha completa, mantendo cada campo já preenchido a menos que a nova
mensagem o contradiga explicitamente, e preenchendo os campos que a nova mensagem
esclarece. Nunca invente dado que não apareceu no texto. Se um campo continua
desconhecido, deixe-o vazio (só "Campo: "). Responda SOMENTE com as linhas
"Campo: valor", sem título, sem comentário, sem markdown extra — mesmo formato
da ficha atual, uma linha por campo, nesta ordem: {", ".join(l for l, _ in FICHA_FIELDS)}."""

        llm = llm_config.get_llm()
        resposta = llm.call(prompt).strip()

        # Sanity check leve: só aceita se parecer mesmo uma ficha de campos.
        if resposta.count(":") >= len(FICHA_FIELDS) - 2:
            titulo = ficha_atual.split("\n", 1)[0]
            (lead_dir / "_ficha.md").write_text(f"{titulo}\n\n{resposta}\n", encoding="utf-8")
    except Exception as exc:
        logger.warning("Extração de ficha falhou para %s (log preservado): %s", lead_dir.name, exc)


def compose_followup(lead_dir: Path) -> str:
    """Gera o texto de WhatsApp de fechamento da noite a partir da ficha do lead.
    Ver playbooks/PLANO_CONGRESSO_AVAG_2026.md §6 para a doutrina por trás disso."""
    import llm_config

    ficha = (lead_dir / "_ficha.md").read_text(encoding="utf-8")
    prompt = f"""Você escreve mensagens de WhatsApp de follow-up para a equipe comercial da
Agrostech (drones agrícolas + créditos de carbono) no Congresso AvAg 2026.

FICHA DO LEAD:
{ficha}

Escreva UMA mensagem curta (4-6 linhas), tom caloroso e direto, sem parecer robô nem
genérico. Regras:
- Use o nome da pessoa e da fazenda/empresa se estiverem na ficha.
- Se "Perfil" indicar operador aeroagrícola (🔴), fale de parceria de canal (Oferta
  Parceiro AvAg), nunca de venda de voo.
- Se indicar produtor/usina (🟢) ou não estiver claro, ofereça a checagem gratuita
  da área por satélite antes de qualquer proposta.
- Feche com uma pergunta simples de sim/não, nunca com "qualquer dúvida estou à
  disposição".
- Nunca invente número, preço ou dado que não esteja na ficha.
Responda apenas com o texto da mensagem, pronto para colar no WhatsApp."""

    llm = llm_config.get_llm(temperature=0.6)
    return llm.call(prompt).strip()


# ─────────────────────────────────────────────
# Sync opcional com Google Drive (best-effort, silencioso se não configurado)
# ─────────────────────────────────────────────

def _drive_sync_lead(lead_dir: Path) -> None:
    try:
        import drive_client

        if not drive_client.sync_enabled():
            return
        drive_client.sync_lead_folder(EVENT_CODE, lead_dir)
    except ImportError:
        pass
    except Exception as exc:
        logger.warning("Sync com Google Drive falhou para %s (dado local está seguro): %s", lead_dir.name, exc)
