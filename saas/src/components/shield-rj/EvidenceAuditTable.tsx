"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Clock,
  FileWarning,
  ShieldAlert,
  Truck,
  Satellite,
  Scale,
  Activity,
  Layers,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Search,
  Copy,
  ExternalLink,
  Filter,
  FileText,
  Table as TableIcon,
  ListFilter,
  Gavel,
  Check,
} from "lucide-react";

export type FraudVectorId =
  | "inflated_area"
  | "phantom_harvest"
  | "grain_diversion"
  | "legal_restructuring";

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  category: "sar" | "fiscal" | "cartorio" | "judicial";
  severity: "critical" | "high" | "warning";
  evidenceCode: string;
  vectorId: FraudVectorId;
  vectorName: string;
  sarDeltaDb?: number;
  disparityPct?: number;
  strawScore?: number;
  legalBasis?: string;
  integrityHash?: string;
  actionRequired?: string;
  affectedParties?: string[];
}

export const EVIDENCE_EVENTS: TimelineEvent[] = [
  {
    id: "ev-1",
    timestamp: "Registro recente · 14:35 (Em trânsito)",
    title: "Vetor 3: Alerta de Fuga de Safra — Carga em Rota ao Silo",
    description:
      "Bitrem carregado com 38t de soja (~630 sacas) ingressando na Moega 03 do Armazém Receptivo sob NF-e da cônjuge (zero NF-e emitida pelo devedor fiduciante).",
    category: "fiscal",
    severity: "critical",
    evidenceCode: "MDF-e 3126...8902",
    vectorId: "grain_diversion",
    vectorName: "Vetor 3: Fuga de Safra (Grain Diversion)",
    sarDeltaDb: -6.2,
    legalBasis: "Art. 301 CPC / Art. 19 Lei 8.929/1994 (Penhor da CPR)",
    integrityHash: "sha256-4b89e21f92e3124ab827e80129bcdef893412093847291aeb7c81d392a01492b",
    actionRequired: "Apreensão cautelar inaudita altera parte na moega receptora antes da comistão de grãos.",
    affectedParties: ["Marcos Silveira (Devedor)", "Juliana Silveira (Interposta)", "Cereais do Cerrado S/A (Depositário)"],
  },
  {
    id: "ev-2",
    timestamp: "14/Mar · 06:28",
    title: "Vetor 3: Colapso de Biomassa Orbital — Sentinel-1 SAR",
    description:
      "Queda brusca de retroespalhamento VH (-22,1 dB, Δ = -6,2 dB) sobre a Fazenda Buritis. Indicativo de colheita rápida sob cobertura de nuvens, compatível com solo exposto.",
    category: "sar",
    severity: "critical",
    evidenceCode: "SAR-S1C-IW-VH",
    vectorId: "grain_diversion",
    vectorName: "Vetor 3: Fuga de Safra (Grain Diversion)",
    sarDeltaDb: -6.2,
    legalBasis: "BCB Resolução CMN nº 5.267/2025 / MCR 2-9",
    integrityHash: "sha256-91e847201bc93410284710293840192837401928374019283740192837401928",
    actionRequired: "Anexar laudo orbital de micro-ondas assinado digitalmente ICP-Brasil ao pedido de liminar.",
    affectedParties: ["Fazenda Buritis (Gleba Sede)", "INPE Brazil Data Cube (Sentinel-1 RTC L2)"],
  },
  {
    id: "ev-3",
    timestamp: "28/Fev · 11:40",
    title: "Vetor 1: Área Inflada — Disparidade CAR vs Modelo M1",
    description:
      "Declaração de 217,12 ha de área integralmente produtiva no penhor da CPR, quando o Modelo M1 indicou 146,79 ha de Área Útil Líquida após deduções de APP (26,91 ha) e Reserva Legal (43,42 ha) — disparidade de 70,33 ha (48% de área não plantável sobreposta ao penhor).",
    category: "cartorio",
    severity: "high",
    evidenceCode: "M1-AUL-48PCT",
    vectorId: "inflated_area",
    vectorName: "Vetor 1: Área Inflada (Inflated Area)",
    disparityPct: 48,
    legalBasis: "Art. 171 §2º, VI CP / MCR 2-9 §4º",
    integrityHash: "sha256-a182947192847102938471029384710293847102938471029384710293847102",
    actionRequired: "Recalcular LTV de garantia fiduciária e exigir reforço imediato de hipoteca.",
    affectedParties: ["CRI Buritis (Matrícula 12.449)", "SICAR MG-3109303-D09"],
  },
  {
    id: "ev-4",
    timestamp: "15/Fev · 08:30",
    title: "Vetor 2: Safra Fantasma — Ausência de Ciclo Fenológico",
    description:
      "Crédito captado para custeio de 6.000 sacas em gleba anexa onde a série temporal SAR Sentinel-1 indicou solo exposto contínuo (pico VH de -22,5 dB abaixo do patamar vegetativo mínimo de -16,0 dB).",
    category: "sar",
    severity: "high",
    evidenceCode: "SAR-GHOST-CROP",
    vectorId: "phantom_harvest",
    vectorName: "Vetor 2: Safra Fantasma (Phantom Harvest)",
    sarDeltaDb: 0,
    legalBasis: "Art. 19 Lei 7.492/1986 (Desvio de Crédito Rural Vinculado)",
    integrityHash: "sha256-f849201928374019283740192837401928374019283740192837401928374019",
    actionRequired: "Vencimento antecipado extraordinário das cédulas rurais lastreadas na área inexistente.",
    affectedParties: ["Gleba Anexa Sul", "Linha Pronaf/CPR Custeio Safra 25/26"],
  },
  {
    id: "ev-5",
    timestamp: "05/Fev · 14:22",
    title: "Vetor 4: Blindagem Pré-RJ — Arrendamento & Nova Inscrição Estadual",
    description:
      "Arrendamento de gaveta gratuito para cônjuge sem registro prévio no RTD. Inscrição Estadual aberta a 18 dias da colheita (S_straw = 0,94 — Crítico Nível 5).",
    category: "cartorio",
    severity: "critical",
    evidenceCode: "IE 13.999.888-0",
    vectorId: "legal_restructuring",
    vectorName: "Vetor 4: Blindagem Pré-RJ (Legal Restructuring)",
    strawScore: 0.94,
    legalBasis: "Art. 50 Código Civil (Desconsideração da Personalidade Jurídica)",
    integrityHash: "sha256-c384910293847102938471029384710293847102938471029384710293847102",
    actionRequired: "Pedir extensão da constrição judicial para patrimônio e contas da pessoa interposta.",
    affectedParties: ["Juliana Silveira", "SEFAZ-MG / SIARE"],
  },
  {
    id: "ev-6",
    timestamp: "18/Jan · 10:15",
    title: "Vetor 4: Surto de Protestos Cartorários (CENPROT)",
    description:
      "Apontamentos de R$ 1.850.000,00 distribuídos por distribuidoras e credores de insumos (AgroInsumos Brasil, Cerrado Fertilizantes, BioSementes). Indicativo de risco agudo de insolvência pré-recuperação.",
    category: "cartorio",
    severity: "warning",
    evidenceCode: "CENPROT-BR-1.8M",
    vectorId: "legal_restructuring",
    vectorName: "Vetor 4: Blindagem Pré-RJ (Legal Restructuring)",
    legalBasis: "Art. 94, I da Lei nº 11.101/2005",
    integrityHash: "sha256-e918273645102938475610293847561029384756102938475610293847561029",
    actionRequired: "Monitoramento diário via robô no Diário Oficial de Justiça para prevenção de stay concursal.",
    affectedParties: ["CENPROT Nacional", "Cartórios de Buritis e Unaí/MG"],
  },
  {
    id: "ev-7",
    timestamp: "10/Jan · 09:00",
    title: "Vetor 4: Contração de Limite SCR Bacen & Execuções",
    description:
      "Corte abrupto de 58% em linhas de crédito bancário e ajuizamento de 4 Execuções de Título Extrajudicial contra o devedor principal Marcos Silveira.",
    category: "judicial",
    severity: "warning",
    evidenceCode: "Bacen-SCR-DataJud",
    vectorId: "legal_restructuring",
    vectorName: "Vetor 4: Blindagem Pré-RJ (Legal Restructuring)",
    legalBasis: "Sistema de Informações de Crédito (SCR) / Banco Central",
    integrityHash: "sha256-d718293049586718293049586718293049586718293049586718293049586718",
    actionRequired: "Consolidar certidões cíveis e de distribuição de execução para demonstrar fumus boni iuris.",
    affectedParties: ["Banco Central do Brasil", "Tribunal de Justiça de Minas Gerais (TJMG)"],
  },
];

interface EvidenceAuditTableProps {
  onSelectEvent?: (event: TimelineEvent) => void;
  onTriggerStrike?: () => void;
}

export const EvidenceAuditTable: React.FC<EvidenceAuditTableProps> = ({
  onSelectEvent,
  onTriggerStrike,
}) => {
  const [viewMode, setViewMode] = useState<"table" | "timeline">("table");
  const [selectedVector, setSelectedVector] = useState<FraudVectorId | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<"all" | "critical" | "high" | "warning">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({
    "ev-1": true, // First event expanded by default for rapid audit
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Toggle single row expansion
  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Expand all / Collapse all
  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    EVIDENCE_EVENTS.forEach((e) => {
      allExpanded[e.id] = true;
    });
    setExpandedRows(allExpanded);
  };

  const collapseAll = () => {
    setExpandedRows({});
  };

  // Filter logic
  const filteredEvents = EVIDENCE_EVENTS.filter((ev) => {
    if (selectedVector !== "all" && ev.vectorId !== selectedVector) return false;
    if (severityFilter !== "all" && ev.severity !== severityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        ev.title.toLowerCase().includes(q) ||
        ev.description.toLowerCase().includes(q) ||
        ev.evidenceCode.toLowerCase().includes(q) ||
        (ev.legalBasis && ev.legalBasis.toLowerCase().includes(q)) ||
        (ev.affectedParties && ev.affectedParties.some((p) => p.toLowerCase().includes(q)));
      if (!match) return false;
    }
    return true;
  });

  const handleCopyHash = (ev: TimelineEvent) => {
    if (ev.integrityHash) {
      navigator.clipboard.writeText(ev.integrityHash);
      setCopiedId(ev.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const getSeverityBadge = (severity: TimelineEvent["severity"]) => {
    switch (severity) {
      case "critical":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900/50">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Crítico
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900/50">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Alto
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Moderado
          </span>
        );
    }
  };

  const getCategoryIcon = (cat: TimelineEvent["category"]) => {
    switch (cat) {
      case "sar":
        return <Satellite className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />;
      case "fiscal":
        return <Truck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      case "cartorio":
        return <FileWarning className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />;
      case "judicial":
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />;
    }
  };

  return (
    <div className="w-full h-full bg-white dark:bg-[#11141c] border border-slate-200 dark:border-[#232936] rounded-xl flex flex-col overflow-hidden shadow-sm transition-colors">
      {/* Top Header & View Controls */}
      <div className="p-3.5 border-b border-slate-200 dark:border-[#232936] flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-[#141822]/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              Dossiê Pericial & Matriz de Evidências
              <span className="text-xs normal-case font-mono font-normal text-slate-500 dark:text-zinc-400 bg-slate-200/60 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                {filteredEvents.length} eventos auditados
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Cadeia de custódia pericial com assinaturas criptográficas e enquadramento no CPC
            </p>
          </div>
        </div>

        {/* View Mode Toggle: Table vs Timeline */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-200/80 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-300 dark:border-zinc-700">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === "table"
                  ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabela</span>
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === "timeline"
                  ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm font-semibold"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Linha do Tempo</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={expandAll}
              className="px-2 py-1 rounded text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 transition-colors"
              title="Expandir todas as linhas"
            >
              Expandir Tudo
            </button>
            <button
              onClick={collapseAll}
              className="px-2 py-1 rounded text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 transition-colors"
              title="Recolher todas as linhas"
            >
              Recolher Tudo
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="px-3.5 py-2.5 border-b border-slate-200 dark:border-[#232936] flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-[#11141c]">
        {/* Vector Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mr-1">
            Vetores:
          </span>
          <button
            onClick={() => setSelectedVector("all")}
            className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
              selectedVector === "all"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700"
            }`}
          >
            Todos ({EVIDENCE_EVENTS.length})
          </button>
          <button
            onClick={() => setSelectedVector("inflated_area")}
            className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
              selectedVector === "inflated_area"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700"
            }`}
          >
            Vetor 1: Área Inflada
          </button>
          <button
            onClick={() => setSelectedVector("phantom_harvest")}
            className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
              selectedVector === "phantom_harvest"
                ? "bg-cyan-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700"
            }`}
          >
            Vetor 2: Safra Fantasma
          </button>
          <button
            onClick={() => setSelectedVector("grain_diversion")}
            className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
              selectedVector === "grain_diversion"
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700"
            }`}
          >
            Vetor 3: Fuga de Safra
          </button>
          <button
            onClick={() => setSelectedVector("legal_restructuring")}
            className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
              selectedVector === "legal_restructuring"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700"
            }`}
          >
            Vetor 4: Blindagem Pré-RJ
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Filtrar evidências..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Main Content View (Table or Timeline) */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === "table" ? (
          /* Institutional Structured Data Table */
          <div className="min-w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-100/70 dark:bg-zinc-900/60 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-8"></th>
                  <th className="py-2.5 px-3">Evento & Vetor</th>
                  <th className="py-2.5 px-3">Fonte / Categoria</th>
                  <th className="py-2.5 px-3">Evidência / Código</th>
                  <th className="py-2.5 px-3">Métrica Chave</th>
                  <th className="py-2.5 px-3">Severidade</th>
                  <th className="py-2.5 px-3 text-right">Data/Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80 text-xs">
                {filteredEvents.map((ev) => {
                  const isExpanded = !!expandedRows[ev.id];

                  return (
                    <React.Fragment key={ev.id}>
                      {/* Main Clickable Row */}
                      <tr
                        onClick={() => toggleRow(ev.id)}
                        className={`cursor-pointer transition-colors group ${
                          isExpanded
                            ? "bg-slate-50 dark:bg-zinc-800/40"
                            : "hover:bg-slate-50/70 dark:hover:bg-zinc-800/20"
                        }`}
                      >
                        <td className="py-3 px-3 text-slate-400 dark:text-zinc-500 text-center">
                          <button
                            type="button"
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-700 dark:text-zinc-200" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-zinc-200" />
                            )}
                          </button>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                            {ev.title}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                            {ev.description}
                          </div>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300 font-medium text-xs">
                            {getCategoryIcon(ev.category)}
                            <span className="capitalize">{ev.category}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap font-mono text-xs text-slate-600 dark:text-zinc-300">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                            {ev.evidenceCode}
                          </span>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap font-mono text-xs">
                          {ev.sarDeltaDb !== undefined && (
                            <span className="text-cyan-700 dark:text-cyan-400 font-bold">
                              Δ {ev.sarDeltaDb.toFixed(1)} dB
                            </span>
                          )}
                          {ev.disparityPct !== undefined && (
                            <span className="text-amber-700 dark:text-amber-400 font-bold">
                              +{ev.disparityPct}% Disp.
                            </span>
                          )}
                          {ev.strawScore !== undefined && (
                            <span className="text-rose-700 dark:text-rose-400 font-bold">
                              S_straw {(ev.strawScore * 100).toFixed(0)}%
                            </span>
                          )}
                          {!ev.sarDeltaDb && !ev.disparityPct && !ev.strawScore && (
                            <span className="text-slate-400 dark:text-zinc-500">—</span>
                          )}
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">{getSeverityBadge(ev.severity)}</td>

                        <td className="py-3 px-3 whitespace-nowrap text-right text-xs text-slate-500 dark:text-zinc-400 font-mono">
                          {ev.timestamp}
                        </td>
                      </tr>

                      {/* Expandable Forensic Detail Panel */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80 dark:bg-zinc-900/50">
                          <td colSpan={7} className="px-4 py-3.5 border-b border-slate-200 dark:border-zinc-800">
                            <div className="pl-6 space-y-3">
                              {/* Descriptive Narrative */}
                              <div className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed bg-white dark:bg-zinc-800/60 p-3 rounded-lg border border-slate-200 dark:border-zinc-700">
                                <span className="font-semibold text-slate-900 dark:text-white block mb-1">
                                  Circunstâncias Fáticas e Probatórias:
                                </span>
                                {ev.description}
                              </div>

                              {/* Forensic Metadata Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {ev.legalBasis && (
                                  <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-700 text-xs">
                                    <span className="text-slate-500 dark:text-zinc-400 block font-semibold mb-0.5">
                                      Fundamento Jurídico:
                                    </span>
                                    <span className="text-slate-800 dark:text-zinc-200 font-mono">
                                      {ev.legalBasis}
                                    </span>
                                  </div>
                                )}

                                {ev.actionRequired && (
                                  <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-700 text-xs">
                                    <span className="text-slate-500 dark:text-zinc-400 block font-semibold mb-0.5">
                                      Medida Cautelar Recomendada:
                                    </span>
                                    <span className="text-rose-700 dark:text-rose-300 font-medium">
                                      {ev.actionRequired}
                                    </span>
                                  </div>
                                )}

                                {ev.affectedParties && (
                                  <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-700 text-xs">
                                    <span className="text-slate-500 dark:text-zinc-400 block font-semibold mb-0.5">
                                      Partes Envolvidas:
                                    </span>
                                    <span className="text-slate-800 dark:text-zinc-200">
                                      {ev.affectedParties.join(" • ")}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Custody Hash & Action Toolbar */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-zinc-800 text-xs">
                                {ev.integrityHash && (
                                  <div className="flex items-center gap-1.5 font-mono text-slate-500 dark:text-zinc-400">
                                    <span className="text-slate-400 dark:text-zinc-500">Hash de Custódia:</span>
                                    <span className="truncate max-w-[280px] bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs">
                                      {ev.integrityHash}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopyHash(ev);
                                      }}
                                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors"
                                      title="Copiar Hash SHA-256"
                                    >
                                      {copiedId === ev.id ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                )}

                                <div className="flex items-center gap-2 ml-auto">
                                  {onTriggerStrike && ev.severity === "critical" && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onTriggerStrike();
                                      }}
                                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs shadow-sm transition-all"
                                    >
                                      <Gavel className="w-3 h-3" />
                                      <span>Anexar à Tutela de Urgência</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Institutional Chronological Timeline */
          <div className="p-4 space-y-4">
            {filteredEvents.map((ev) => (
              <div
                key={ev.id}
                className="relative pl-6 pb-4 border-l-2 border-slate-200 dark:border-zinc-800 hover:border-rose-400 dark:hover:border-rose-500 transition-colors group"
              >
                {/* Timeline Dot */}
                <div
                  className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-[#11141c] ${
                    ev.severity === "critical"
                      ? "bg-rose-500"
                      : ev.severity === "high"
                      ? "bg-amber-500"
                      : "bg-slate-400"
                  }`}
                />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-mono text-slate-500 dark:text-zinc-400 font-medium">
                    {ev.timestamp}
                  </span>
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(ev.severity)}
                    <span className="px-2 py-0.5 rounded font-mono text-xs bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 flex items-center gap-1">
                      {getCategoryIcon(ev.category)}
                      {ev.evidenceCode}
                    </span>
                  </div>
                </div>

                <h3 className="mt-1 text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  {ev.title}
                </h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                  {ev.description}
                </p>

                {ev.legalBasis && (
                  <div className="mt-2 text-xs font-mono text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                    <Scale className="w-3 h-3 text-slate-400" />
                    <span>{ev.legalBasis}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EvidenceAuditTable;
