"use client";

/**
 * Shield-RJ phone experience.
 *
 * One job per screen (Airbnb-style): a verdict-first hero, three focused tabs,
 * evidence as tappable cards that open a bottom sheet, and one persistent
 * primary action. Desktop keeps the dense war-room layout in page.tsx.
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Copy,
  FileText,
  Gavel,
  Satellite,
  Scale,
  Truck,
  CloudSun,
  X,
} from "lucide-react";
import {
  EVIDENCE_EVENTS,
  type FraudVectorId,
  type TimelineEvent,
} from "./EvidenceAuditTable";
import {
  INITIAL_NODES,
  INITIAL_LINKS,
  type GraphNode,
} from "./GraphVisualizer";

type Tab = "resumo" | "evidencias" | "rastro";
type Severity = TimelineEvent["severity"];

const SEVERITY: Record<Severity, { label: string; chip: string; dot: string; rank: number }> = {
  critical: {
    label: "Crítico",
    chip: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
    dot: "bg-rose-500",
    rank: 3,
  },
  high: {
    label: "Alto",
    chip: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    dot: "bg-amber-500",
    rank: 2,
  },
  warning: {
    label: "Atenção",
    chip: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30",
    dot: "bg-sky-500",
    rank: 1,
  },
};

const CATEGORY_ICON: Record<TimelineEvent["category"], React.ElementType> = {
  sar: Satellite,
  fiscal: Truck,
  cartorio: FileText,
  judicial: Gavel,
};

const CATEGORY_LABEL: Record<TimelineEvent["category"], string> = {
  sar: "Radar orbital",
  fiscal: "Nota fiscal",
  cartorio: "Cartório",
  judicial: "Justiça",
};

const VECTORS: { id: FraudVectorId; name: string; summary: string }[] = [
  {
    id: "grain_diversion",
    name: "Fuga de safra",
    summary: "Grão sendo levado para fora da garantia.",
  },
  {
    id: "inflated_area",
    name: "Área inflada",
    summary: "Garantia declara 48% mais área do que existe de útil.",
  },
  {
    id: "phantom_harvest",
    name: "Safra fantasma",
    summary: "Crédito pedido para uma lavoura que nunca existiu.",
  },
  {
    id: "legal_restructuring",
    name: "Blindagem pré-RJ",
    summary: "Patrimônio sendo movido antes da recuperação judicial.",
  },
];

const SIGNALS = [
  {
    icon: Satellite,
    label: "Radar orbital",
    value: "−22,1 dB",
    note: "Solo exposto. Queda de 6,2 dB em um passe.",
    tone: "alert" as const,
  },
  {
    icon: CloudSun,
    label: "Clima",
    value: "S_clima 1,00",
    note: "A seca não explica a perda da lavoura.",
    tone: "alert" as const,
  },
  {
    icon: Truck,
    label: "Nota fiscal",
    value: "9.540 sc",
    note: "Em rota para a Moega 03, sob terceiro. Z = 27,5.",
    tone: "alert" as const,
  },
  {
    icon: Scale,
    label: "Justiça (STJ)",
    value: "Sem stay",
    note: "Grão é bem fungível: apreensão livre.",
    tone: "ok" as const,
  },
];

function worstSeverity(events: TimelineEvent[]): Severity {
  return events.reduce<Severity>(
    (acc, e) => (SEVERITY[e.severity].rank > SEVERITY[acc].rank ? e.severity : acc),
    "warning"
  );
}

interface ShieldMobileProps {
  onStrike: () => void;
}

export const ShieldMobile: React.FC<ShieldMobileProps> = ({ onStrike }) => {
  const [tab, setTab] = useState<Tab>("resumo");
  const [vectorFilter, setVectorFilter] = useState<FraudVectorId | "all">("all");
  const [openEvent, setOpenEvent] = useState<TimelineEvent | null>(null);
  const [openNode, setOpenNode] = useState<GraphNode | null>(null);

  const events = useMemo(
    () =>
      EVIDENCE_EVENTS.filter(
        (e) => vectorFilter === "all" || e.vectorId === vectorFilter
      ),
    [vectorFilter]
  );

  const goToVector = (id: FraudVectorId) => {
    setVectorFilter(id);
    setTab("evidencias");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "resumo", label: "Resumo" },
    { id: "evidencias", label: "Evidências", count: EVIDENCE_EVENTS.length },
    { id: "rastro", label: "Rota do grão" },
  ];

  return (
    <div className="lg:hidden pb-28">
      {/* Hero: the verdict first */}
      <section className="px-4 pt-4 pb-5">
        <p className="text-xs font-mono uppercase tracking-wider text-slate-muted">
          Caso BR-31-BURITIS · CPR-2025/BURITIS-99
        </p>
        <h1 className="mt-1.5 text-2xl font-bold text-foreground leading-tight font-display">
          Desvio de safra em curso
        </h1>
        <p className="mt-1 text-sm text-slate-muted">
          Fazenda Buritis · devedor Marcos Silveira
        </p>

        <div className="mt-4 flex items-center gap-3">
          <div
            className="flex gap-1"
            role="img"
            aria-label="Nível de alerta 5 de 5"
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="h-2 w-6 rounded-full bg-rose-500" />
            ))}
          </div>
          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
            Nível 5 de 5
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-surface-border bg-surface p-3.5">
            <dt className="text-xs text-slate-muted">Carga em risco</dt>
            <dd className="mt-0.5 text-lg font-bold text-foreground">9.540 sacas</dd>
          </div>
          <div className="rounded-2xl border border-surface-border bg-surface p-3.5">
            <dt className="text-xs text-slate-muted">Garantia da CPR</dt>
            <dd className="mt-0.5 text-lg font-bold text-foreground">R$ 1,19 mi</dd>
          </div>
        </dl>
      </section>

      {/* Sticky tabs */}
      <div
        role="tablist"
        aria-label="Seções do caso"
        className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-surface-border px-4 flex gap-6"
      >
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`relative h-12 text-sm font-semibold transition-colors ${
                active ? "text-foreground" : "text-slate-muted"
              }`}
            >
              {t.label}
              {t.count !== undefined && (
                <span className="ml-1.5 text-xs font-normal text-slate-muted">
                  {t.count}
                </span>
              )}
              {active && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-foreground" />
              )}
            </button>
          );
        })}
      </div>

      {/* RESUMO */}
      {tab === "resumo" && (
        <div role="tabpanel" className="pt-5 space-y-7">
          <section>
            <h2 className="px-4 text-base font-bold text-foreground">Sinais que acenderam</h2>
            <div className="mt-3 flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-px-4 px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {SIGNALS.map((s) => (
                <article
                  key={s.label}
                  className="snap-start shrink-0 w-[72%] max-w-[280px] rounded-2xl border border-surface-border bg-surface p-4"
                >
                  <div className="flex items-center gap-2 text-xs text-slate-muted">
                    <s.icon className="w-4 h-4" aria-hidden />
                    {s.label}
                  </div>
                  <p
                    className={`mt-2 text-xl font-bold ${
                      s.tone === "alert"
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {s.value}
                  </p>
                  <p className="mt-1 text-sm text-slate-muted leading-snug">{s.note}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="px-4">
            <h2 className="text-base font-bold text-foreground">Como o desvio acontece</h2>
            <p className="mt-0.5 text-sm text-slate-muted">
              Quatro padrões de fraude, ordenados por gravidade.
            </p>
            <ul className="mt-3 divide-y divide-surface-border rounded-2xl border border-surface-border bg-surface">
              {VECTORS.map((v) => {
                const related = EVIDENCE_EVENTS.filter((e) => e.vectorId === v.id);
                const sev = SEVERITY[worstSeverity(related)];
                return (
                  <li key={v.id}>
                    <button
                      onClick={() => goToVector(v.id)}
                      className="w-full min-h-16 px-4 py-3 flex items-center gap-3 text-left"
                    >
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${sev.dot}`} aria-hidden />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold text-foreground">
                          {v.name}
                        </span>
                        <span className="block text-sm text-slate-muted leading-snug">
                          {v.summary}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-slate-muted">
                        {related.length} {related.length === 1 ? "prova" : "provas"}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-muted shrink-0" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="px-4">
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4">
              <h2 className="text-base font-bold text-foreground">O que fazer agora</h2>
              <p className="mt-1 text-sm text-slate-muted leading-relaxed">
                A carga está entrando na Moega 03 do armazém. Um pedido cautelar
                antes da mistura dos grãos permite apreender a garantia.
              </p>
            </div>
          </section>
        </div>
      )}

      {/* EVIDÊNCIAS */}
      {tab === "evidencias" && (
        <div role="tabpanel" className="pt-4">
          <div className="flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[{ id: "all" as const, name: "Todas" }, ...VECTORS].map((v) => {
              const active = vectorFilter === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setVectorFilter(v.id)}
                  aria-pressed={active}
                  className={`shrink-0 h-10 px-4 rounded-full border text-sm font-medium transition-colors ${
                    active
                      ? "bg-foreground text-background border-foreground"
                      : "bg-surface text-foreground border-surface-border"
                  }`}
                >
                  {v.name}
                </button>
              );
            })}
          </div>

          <ul className="px-4 space-y-3">
            {events.map((e) => {
              const Icon = CATEGORY_ICON[e.category];
              const sev = SEVERITY[e.severity];
              return (
                <li key={e.id}>
                  <button
                    onClick={() => setOpenEvent(e)}
                    className="w-full text-left rounded-2xl border border-surface-border bg-surface p-4 active:scale-[0.99] transition-transform"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs text-slate-muted">
                        <Icon className="w-3.5 h-3.5" aria-hidden />
                        {CATEGORY_LABEL[e.category]}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${sev.chip}`}
                      >
                        {sev.label}
                      </span>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-foreground leading-snug">
                      {e.title.replace(/^Vetor \d: /, "")}
                    </h3>
                    <p className="mt-1 text-sm text-slate-muted line-clamp-2 leading-snug">
                      {e.description}
                    </p>
                    <p className="mt-2 text-xs text-slate-muted">{e.timestamp}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ROTA DO GRÃO */}
      {tab === "rastro" && (
        <div role="tabpanel" className="pt-5 px-4">
          <h2 className="text-base font-bold text-foreground">A rota do grão</h2>
          <p className="mt-0.5 text-sm text-slate-muted">
            Do penhor ao silo, em cinco passos. Toque numa parte para ver o risco.
          </p>
          <ol className="mt-5">
            {TRAIL.map((step, idx) => (
              <li key={step.stage} className="relative pl-10 pb-7 last:pb-0">
                {idx < TRAIL.length - 1 && (
                  <span
                    className="absolute left-[15px] top-8 bottom-0 w-px bg-surface-border"
                    aria-hidden
                  />
                )}
                <span
                  className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step.stage === 5
                      ? "bg-rose-600 text-white"
                      : "bg-surface border border-surface-border text-foreground"
                  }`}
                >
                  {step.stage}
                </span>
                <h3 className="text-sm font-bold text-foreground pt-1.5">{step.title}</h3>

                <ul className="mt-3 space-y-2.5">
                  {step.nodes.map((n) => (
                    <li key={n.id}>
                      <button
                        onClick={() => setOpenNode(n)}
                        className="w-full text-left rounded-2xl border border-surface-border bg-surface p-3.5 flex items-center gap-3 active:scale-[0.99] transition-transform"
                      >
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-semibold text-foreground truncate">
                            {n.label}
                          </span>
                          <span className="block text-xs text-slate-muted truncate">
                            {n.sublabel}
                          </span>
                          {n.keyMetric && (
                            <span
                              className={`mt-1.5 inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${
                                n.keyMetric.isHazard
                                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                                  : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                              }`}
                            >
                              {n.keyMetric.label}: {n.keyMetric.value}
                            </span>
                          )}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-muted shrink-0" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>

                {step.links.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {step.links.map((l) => (
                      <li
                        key={l.id}
                        className={`text-sm leading-snug flex gap-2 ${
                          l.isSuspicious
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-slate-muted"
                        }`}
                      >
                        <span aria-hidden>{l.isSuspicious ? "⚠" : "·"}</span>
                        <span>
                          <span className="font-medium">{l.from}</span> → {l.to}
                          <span className="block text-xs opacity-80">{l.label}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Persistent primary action */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-surface-border bg-background/95 backdrop-blur px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">Plantão judiciário ativo</p>
          <p className="text-xs text-slate-muted truncate">Apreensão da carga</p>
        </div>
        <button
          onClick={onStrike}
          className="shrink-0 h-12 px-5 rounded-xl bg-rose-600 active:bg-rose-700 text-white text-sm font-semibold flex items-center gap-2"
        >
          <Gavel className="w-4 h-4" aria-hidden />
          Emitir mandado
        </button>
      </div>

      <EvidenceSheet
        event={openEvent}
        onClose={() => setOpenEvent(null)}
        onStrike={() => {
          setOpenEvent(null);
          onStrike();
        }}
      />

      <EntitySheet
        node={openNode}
        onClose={() => setOpenNode(null)}
        onStrike={() => {
          setOpenNode(null);
          onStrike();
        }}
      />
    </div>
  );
};

/** Bottom sheet with the full detail for one piece of evidence. */
const EvidenceSheet: React.FC<{
  event: TimelineEvent | null;
  onClose: () => void;
  onStrike: () => void;
}> = ({ event, onClose, onStrike }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => setCopied(false), [event]);

  if (!event) return null;
  const sev = SEVERITY[event.severity];

  const copyHash = async () => {
    try {
      await navigator.clipboard.writeText(event.integrityHash ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable: leave the hash visible for manual copy */
    }
  };

  return (
    <BottomSheet
      onClose={onClose}
      label="Detalhe da evidência"
      chip={
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${sev.chip}`}>
          {sev.label}
        </span>
      }
    >
        <div className="px-4 pb-6 space-y-5">
          <header>
            <h2 className="text-lg font-bold text-foreground leading-snug font-display">
              {event.title.replace(/^Vetor \d: /, "")}
            </h2>
            <p className="mt-1 text-xs text-slate-muted">
              {CATEGORY_LABEL[event.category]} · {event.timestamp}
            </p>
          </header>

          <p className="text-sm text-foreground leading-relaxed">{event.description}</p>

          {event.actionRequired && (
            <section className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" aria-hidden />
                Ação recomendada
              </h3>
              <p className="mt-1 text-sm text-slate-muted leading-relaxed">
                {event.actionRequired}
              </p>
            </section>
          )}

          {event.legalBasis && (
            <section>
              <h3 className="text-sm font-bold text-foreground">Base legal</h3>
              <p className="mt-1 text-sm text-slate-muted">{event.legalBasis}</p>
            </section>
          )}

          {event.affectedParties && event.affectedParties.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-foreground">Partes envolvidas</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {event.affectedParties.map((p) => (
                  <li
                    key={p}
                    className="px-3 py-1.5 rounded-full border border-surface-border bg-surface text-sm text-foreground"
                  >
                    {p}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h3 className="text-sm font-bold text-foreground">Registro da prova</h3>
            <div className="mt-2 rounded-2xl border border-surface-border bg-surface p-3.5 space-y-2">
              <p className="text-xs text-slate-muted">
                Código <span className="font-mono text-foreground">{event.evidenceCode}</span>
              </p>
              {event.integrityHash && (
                <div className="flex items-center gap-2">
                  <code className="flex-1 min-w-0 truncate text-xs font-mono text-slate-muted">
                    {event.integrityHash}
                  </code>
                  <button
                    onClick={copyHash}
                    aria-label="Copiar hash de integridade"
                    className="shrink-0 h-10 px-3 rounded-lg border border-surface-border text-sm font-medium text-foreground flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copiado" : "Copiar"}
                  </button>
                </div>
              )}
            </div>
          </section>

          <button
            onClick={onStrike}
            className="w-full h-12 rounded-xl bg-rose-600 active:bg-rose-700 text-white text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Gavel className="w-4 h-4" aria-hidden />
            Emitir mandado cautelar
          </button>
        </div>
    </BottomSheet>
  );
};

/** Bottom sheet for one party in the grain route. */
const EntitySheet: React.FC<{
  node: GraphNode | null;
  onClose: () => void;
  onStrike: () => void;
}> = ({ node, onClose, onStrike }) => {
  if (!node) return null;
  const rows = Object.entries(node.riskDetails);
  return (
    <BottomSheet
      onClose={onClose}
      label="Detalhe da parte envolvida"
      chip={
        node.keyMetric ? (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
              node.keyMetric.isHazard
                ? SEVERITY.critical.chip
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
            }`}
          >
            {node.keyMetric.label}: {node.keyMetric.value}
          </span>
        ) : null
      }
    >
      <div className="px-4 pb-6 space-y-5">
        <header>
          <h2 className="text-lg font-bold text-foreground leading-snug font-display">
            {node.label}
          </h2>
          <p className="mt-1 text-sm text-slate-muted">{node.sublabel}</p>
        </header>

        <dl className="divide-y divide-surface-border rounded-2xl border border-surface-border bg-surface">
          {rows.map(([k, v]) => (
            <div key={k} className="px-4 py-3">
              <dt className="text-xs text-slate-muted">{k}</dt>
              <dd className="mt-0.5 text-sm text-foreground leading-snug">{v}</dd>
            </div>
          ))}
        </dl>

        {node.type === "silo" && (
          <button
            onClick={onStrike}
            className="w-full h-12 rounded-xl bg-rose-600 active:bg-rose-700 text-white text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Gavel className="w-4 h-4" aria-hidden />
            Emitir mandado cautelar
          </button>
        )}
      </div>
    </BottomSheet>
  );
};

/** Shared sheet shell: backdrop, handle, close button, Esc, scroll lock. */
const BottomSheet: React.FC<{
  onClose: () => void;
  label: string;
  chip?: React.ReactNode;
  children: React.ReactNode;
}> = ({ onClose, label, chip, children }) => {
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => ev.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true" aria-label={label}>
      <button aria-label="Fechar" onClick={onClose} className="absolute inset-0 bg-black/55" />
      <div className="relative w-full max-h-[88dvh] overflow-y-auto rounded-t-3xl bg-background border-t border-surface-border shadow-2xl animate-in slide-in-from-bottom duration-200">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur px-4 pt-2 pb-3 flex items-center justify-between min-h-14">
          <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-slate-300 dark:bg-zinc-600" />
          <div className="mt-3 min-w-0">{chip}</div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="mt-3 w-10 h-10 -mr-2 shrink-0 flex items-center justify-center rounded-full text-slate-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

/** The grain route: five steps from the pledge to the silo, built from the forensic graph data. */
const STAGE_TITLES: Record<number, string> = {
  1: "Garantia registrada",
  2: "Radar detecta a colheita",
  3: "A família assume o negócio",
  4: "O grão sai de caminhão",
  5: "Chega ao silo",
};

const LINK_COPY: Record<string, string> = {
  l1: "Radar aponta colheita (Δ −6,2 dB)",
  l2: "Proprietário registral",
  l3: "Cônjuge, comunhão parcial de bens",
  l4: "Filho, 1º grau",
  l5: "Arrendamento de gaveta, sem registro",
  l6: "Emite NF-e e MDF-e",
  l7: "Proprietário do veículo",
  l8: "Desvio de safra em curso",
};

const TRAIL = [1, 2, 3, 4, 5].map((stage) => {
  const byId = (id: string) => INITIAL_NODES.find((n) => n.id === id)?.label ?? id;
  return {
    stage,
    title: STAGE_TITLES[stage],
    nodes: INITIAL_NODES.filter((n) => n.stage === stage),
    links: INITIAL_LINKS.filter((l) => l.stepIndex === stage).map((l) => ({
      id: l.id,
      from: byId(l.source),
      to: byId(l.target),
      label: LINK_COPY[l.id] ?? l.label,
      isSuspicious: !!l.isSuspicious,
    })),
  };
});

export default ShieldMobile;
