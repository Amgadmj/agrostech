"""
Agrostech — Deal Memory (Reaprendizado do Conselho Financeiro)

Fecha o ciclo da calculadora: cotação → resposta do cliente → recalibração.

  1. Toda /cotacao é gravada aqui com um ID (mostrado no memo)
  2. O vendedor reporta a resposta do cliente:
       /resultado <id> ganhou [preço_fechado]
       /resultado <id> perdeu [motivo...]
       /resultado <id> negociando [contra-proposta]
  3. O motor recalibra cada plano com dados reais (win rate + preço de fechamento):
       - ganhando muito e fechando no preço cheio  -> âncora sobe (+5%)
       - perdendo por preço com win rate baixo     -> preço cede (−7%), NUNCA abaixo do piso
  4. /aprendizado mostra o painel de aprendizado ao Conselho

ENFORCEMENT: o aprendizado ajusta preços somente DENTRO dos limites — piso de
margem saudável (25%) e banda competitiva são invioláveis (deal_desk aplica o clamp).
"""

from __future__ import annotations

import sqlite3
import logging
from datetime import datetime, timedelta
from pathlib import Path

logger = logging.getLogger(__name__)

DB_PATH = Path(__file__).parent / "deals.db"

# Parâmetros de reaprendizado
MIN_DEALS_TO_LEARN = 3       # nº mínimo de resultados fechados para calibrar
LEARNING_WINDOW_DAYS = 90    # janela de aprendizado (safra corrente)
FACTOR_UP = 1.05             # mercado aceitando -> sobe 5%
FACTOR_DOWN = 0.93           # perdendo por preço -> cede 7% (clampado no piso)

VALID_STATUS = ("ganhou", "perdeu", "negociando")
PRICE_LOSS_KEYWORDS = ("preço", "preco", "caro", "concorrente", "barato", "desconto")


# ── Infra ─────────────────────────────────────────────────────────────────────
def _conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS quotes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ts TEXT NOT NULL,
            client TEXT,
            area_ha REAL,
            plan TEXT NOT NULL,
            price_recommended REAL,
            price_open REAL,
            price_never_below REAL,
            total REAL,
            rep TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS outcomes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quote_id INTEGER NOT NULL REFERENCES quotes(id),
            ts TEXT NOT NULL,
            status TEXT NOT NULL,
            final_price REAL,
            reason TEXT
        )
    """)
    return conn


def _brl(v: float) -> str:
    return f"R$ {v:,.0f}".replace(",", ".")


# ── Registro ──────────────────────────────────────────────────────────────────
def record_quote(client: str, area_ha: float, plan: str, price_recommended: float,
                 price_open: float, price_never_below: float, total: float,
                 rep: str = "") -> int:
    """Grava a cotação emitida e devolve o ID para rastreio do resultado."""
    with _conn() as conn:
        cur = conn.execute(
            "INSERT INTO quotes (ts, client, area_ha, plan, price_recommended, "
            "price_open, price_never_below, total, rep) VALUES (?,?,?,?,?,?,?,?,?)",
            (datetime.now().isoformat(), client, area_ha, plan, price_recommended,
             price_open, price_never_below, total, rep),
        )
        return cur.lastrowid


def record_outcome(quote_id: int, status: str, final_price: float | None = None,
                   reason: str = "") -> str:
    """Grava a resposta do cliente. Retorna confirmação formatada (HTML leve)."""
    status = status.lower().strip()
    if status not in VALID_STATUS:
        return ("⚠️ Status inválido. Use: <b>ganhou</b>, <b>perdeu</b> ou <b>negociando</b>.\n"
                "Ex.: /resultado 12 ganhou 75  |  /resultado 12 perdeu preço concorrente")

    with _conn() as conn:
        row = conn.execute(
            "SELECT client, plan, price_recommended, area_ha FROM quotes WHERE id=?",
            (quote_id,),
        ).fetchone()
        if not row:
            return f"⚠️ Cotação #{quote_id} não encontrada. Veja as últimas com /aprendizado."
        conn.execute(
            "INSERT INTO outcomes (quote_id, ts, status, final_price, reason) VALUES (?,?,?,?,?)",
            (quote_id, datetime.now().isoformat(), status, final_price, reason.strip()),
        )

    client, plan, rec, area = row
    emoji = {"ganhou": "🏆", "perdeu": "❌", "negociando": "🤝"}[status]
    area_fmt = f"{area:,.0f}".replace(",", ".")
    lines = [f"{emoji} Resultado registrado — Cotação #{quote_id} "
             f"({client or 'sem nome'}, {plan}, {area_fmt} ha)"]
    if status == "ganhou" and final_price:
        delta = (final_price / rec - 1) if rec else 0
        lines.append(f"Fechou em {_brl(final_price)}/ha (cotado {_brl(rec)}/ha, {delta:+.0%})")
    elif status == "perdeu" and reason:
        lines.append(f"Motivo: {reason}")
    elif status == "negociando" and final_price:
        lines.append(f"Contra-proposta do cliente: {_brl(final_price)}/ha")
    lines.append("<i>O Conselho aprende com isso na próxima cotação. Obrigado! 📈</i>")
    return "\n".join(lines)


# ── Estatísticas e calibração ────────────────────────────────────────────────
def plan_stats(plan: str, days: int = LEARNING_WINDOW_DAYS) -> dict:
    """Resposta dos clientes ao plano na janela: win rate, preço de fechamento, motivos."""
    since = (datetime.now() - timedelta(days=days)).isoformat()
    with _conn() as conn:
        # último resultado de cada cotação do plano
        rows = conn.execute("""
            SELECT q.price_recommended, o.status, o.final_price, o.reason
            FROM quotes q
            JOIN outcomes o ON o.quote_id = q.id
            WHERE q.plan = ? AND o.ts >= ?
              AND o.id = (SELECT MAX(o2.id) FROM outcomes o2 WHERE o2.quote_id = q.id)
        """, (plan, since)).fetchall()

    wins = [(rec, fp) for rec, s, fp, _ in rows if s == "ganhou"]
    losses = [(reason or "") for _, s, _, reason in rows if s == "perdeu"]
    negotiating = sum(1 for _, s, _, _ in rows if s == "negociando")
    closed = len(wins) + len(losses)

    close_ratios = [fp / rec for rec, fp in wins if fp and rec]
    price_losses = sum(
        1 for r in losses if any(k in r.lower() for k in PRICE_LOSS_KEYWORDS)
    )
    return {
        "closed": closed,
        "wins": len(wins),
        "losses": len(losses),
        "negotiating": negotiating,
        "win_rate": (len(wins) / closed) if closed else None,
        "avg_close_ratio": (sum(close_ratios) / len(close_ratios)) if close_ratios else None,
        "price_loss_share": (price_losses / len(losses)) if losses else None,
    }


def calibration(plan: str) -> tuple[float, str]:
    """
    Fator de reaprendizado do plano (aplicado pelo deal_desk DENTRO dos pisos).
    Retorna (fator, justificativa). 1.0 = sem ajuste.
    """
    s = plan_stats(plan)
    if s["closed"] < MIN_DEALS_TO_LEARN:
        return 1.0, ""

    win_rate = s["win_rate"] or 0.0
    close_ratio = s["avg_close_ratio"]
    price_loss = s["price_loss_share"] or 0.0

    if win_rate >= 0.60 and (close_ratio is None or close_ratio >= 0.95):
        return FACTOR_UP, (
            f"📈 Clientes estão aceitando bem ({s['wins']}/{s['closed']} fechados"
            f"{' no preço cheio' if close_ratio else ''}) — âncora subiu 5%"
        )
    if win_rate < 0.25 and price_loss >= 0.5:
        return FACTOR_DOWN, (
            f"📉 Perdendo por preço ({s['losses']}/{s['closed']}, "
            f"{price_loss:.0%} por preço) — preço cedeu 7% (respeitando o piso)"
        )
    return 1.0, ""


def predict_win_rate(plan: str, area_ha: float, research_context: dict) -> float:
    """
    Predicts the probability of closing a deal based on historical outcomes
    and real-time agricultural context (seasonality, urgency, competitor mentions).
    Returns a probability between 0.0 and 1.0.
    """
    stats = plan_stats(plan)
    base_prob = stats["win_rate"] if stats["win_rate"] is not None else 0.50

    # Volume penalty or bonus
    if area_ha > 10000:
        base_prob *= 0.90 # Huge deals take longer and are harder to close
    elif area_ha >= 1000:
        base_prob *= 1.10 # Sweet spot

    modifier = 1.0
    findings_text = " ".join(f["description"].lower() for f in research_context.get("findings", []))
    
    # 1. Seasonal / Urgency Matters
    if any(k in findings_text for k in ["plantio", "semeadura", "safra", "chuva"]):
        modifier += 0.15
    if any(k in findings_text for k in ["praga", "doença", "fungo", "ferrugem", "urgência"]):
        modifier += 0.25 # High urgency -> Higher win rate for drone mapping/spraying
        
    # 2. Competitor / Price pressure
    if any(k in findings_text for k in ["concorrente", "leilão", "cotação com terceiros"]):
        modifier -= 0.20
        
    final_prob = base_prob * modifier
    return min(max(final_prob, 0.05), 0.98) # Clamp between 5% and 98%

def learnings_block(plans: list[str]) -> str:
    """Bloco compacto de resposta dos clientes para o parecer LLM do Conselho."""
    lines = []
    for p in plans:
        s = plan_stats(p)
        if not s["closed"] and not s["negotiating"]:
            continue
        wr = f"{s['win_rate']:.0%}" if s["win_rate"] is not None else "—"
        cr = f"{s['avg_close_ratio']:.0%} do cotado" if s["avg_close_ratio"] else "—"
        lines.append(
            f"- {p}: {s['wins']} ganhos / {s['losses']} perdidos / "
            f"{s['negotiating']} negociando | win rate {wr} | fechamento médio {cr}"
        )
    return "\n".join(lines)


# ── Painel /aprendizado ──────────────────────────────────────────────────────
def learning_report(days: int = LEARNING_WINDOW_DAYS) -> str:
    """Painel de aprendizado do Conselho (HTML leve para o Telegram)."""
    since = (datetime.now() - timedelta(days=days)).isoformat()
    with _conn() as conn:
        total_quotes = conn.execute(
            "SELECT COUNT(*) FROM quotes WHERE ts >= ?", (since,)).fetchone()[0]
        plans = [r[0] for r in conn.execute(
            "SELECT DISTINCT plan FROM quotes WHERE ts >= ?", (since,)).fetchall()]
        pending = conn.execute("""
            SELECT q.id, q.client, q.plan, q.price_recommended, q.rep
            FROM quotes q
            LEFT JOIN outcomes o ON o.quote_id = q.id
            WHERE q.ts >= ? AND o.id IS NULL
            ORDER BY q.id DESC LIMIT 5
        """, (since,)).fetchall()
        recent_losses = conn.execute("""
            SELECT o.reason FROM outcomes o
            WHERE o.status = 'perdeu' AND o.ts >= ? AND o.reason != ''
            ORDER BY o.id DESC LIMIT 5
        """, (since,)).fetchall()

    out = [f"<b>🧠 APRENDIZADO DO CONSELHO</b> (últimos {days} dias)",
           f"📨 Cotações emitidas: <b>{total_quotes}</b>"]

    if not total_quotes:
        out.append("\nAinda não há cotações registradas. Use /cotacao e depois "
                   "reporte a resposta do cliente com /resultado.")
        return "\n".join(out)

    out.append("\n<b>📊 Resposta dos clientes por plano</b>")
    any_stats = False
    for p in sorted(plans):
        s = plan_stats(p, days)
        if not s["closed"] and not s["negotiating"]:
            continue
        any_stats = True
        wr = f"{s['win_rate']:.0%}" if s["win_rate"] is not None else "—"
        out.append(f"\n• <b>{p}</b>: 🏆 {s['wins']} | ❌ {s['losses']} | 🤝 {s['negotiating']} "
                   f"| win rate <b>{wr}</b>")
        if s["avg_close_ratio"]:
            out.append(f"  Fechamento médio: {s['avg_close_ratio']:.0%} do preço cotado")
        factor, why = calibration(p)
        if why:
            out.append(f"  🔧 Calibração ativa: {why}")
    if not any_stats:
        out.append("Nenhum resultado reportado ainda — peça ao time para usar /resultado.")

    if recent_losses:
        out.append("\n<b>❌ Motivos de perda recentes</b>")
        for (r,) in recent_losses:
            out.append(f"• {r[:80]}")

    if pending:
        out.append("\n<b>⏳ Cotações sem resposta (cobre o cliente!)</b>")
        for qid, client, plan, rec, rep in pending:
            out.append(f"• #{qid} {client or 'sem nome'} — {plan} {_brl(rec)}/ha"
                       f"{' (' + rep + ')' if rep else ''}")
        out.append("\n<i>Reporte com: /resultado &lt;id&gt; ganhou|perdeu|negociando [preço/motivo]</i>")

    return "\n".join(out)


# ── Entrada do comando /resultado ────────────────────────────────────────────
def handle_resultado(args: list[str]) -> str:
    """Parse de /resultado <id> <status> [preço] [motivo...]"""
    if len(args) < 2:
        return ("⚠️ Uso: /resultado &lt;id&gt; ganhou|perdeu|negociando [preço] [motivo]\n"
                "Ex.: /resultado 12 ganhou 75\n"
                "Ex.: /resultado 12 perdeu preço concorrente mais barato\n"
                "Ex.: /resultado 12 negociando 65")
    try:
        quote_id = int(args[0])
    except ValueError:
        return "⚠️ O primeiro argumento é o número da cotação. Ex.: /resultado 12 ganhou 75"

    status = args[1].lower()
    rest = args[2:]
    final_price = None
    if rest:
        try:
            final_price = float(rest[0].replace(",", "."))
            rest = rest[1:]
        except ValueError:
            pass
    reason = " ".join(rest)
    return record_outcome(quote_id, status, final_price, reason)


if __name__ == "__main__":
    import sys
    if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
        sys.stdout.reconfigure(encoding="utf-8")
    import re as _re
    args = sys.argv[1:]
    if args and args[0] == "resultado":
        print(_re.sub(r"</?(b|i|code)>", "", handle_resultado(args[1:])))
    else:
        print(_re.sub(r"</?(b|i|code)>", "", learning_report()))
