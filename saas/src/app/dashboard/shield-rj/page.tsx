"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GraphVisualizer } from "@/components/shield-rj/GraphVisualizer";
import { EvidenceAuditTable } from "@/components/shield-rj/EvidenceAuditTable";
import { StrikeModal } from "@/components/shield-rj/StrikeModal";
import { ShieldMobile } from "@/components/shield-rj/ShieldMobile";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { DemoBadge } from "@/components/dashboard/DemoBadge";
import { AppShell } from "@/components/layout/AppShell";
import {
  ShieldAlert,
  Gavel,
  Satellite,
  CloudSun,
  Truck,
  Scale,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Columns,
  Maximize2,
  FileText,
  AlertTriangle,
  Info,
} from "lucide-react";

export default function ShieldRJWarRoomPage() {
  const [isStrikeModalOpen, setIsStrikeModalOpen] = useState(false);
  const [isKpiCollapsed, setIsKpiCollapsed] = useState(false);
  const [isDocketCollapsed, setIsDocketCollapsed] = useState(false);
  const [layoutMode, setLayoutMode] = useState<"split" | "graph" | "table">("split");

  return (
    <AppShell noScroll={false} className="lg:h-dvh lg:overflow-hidden">
      {/* Case Context & Action Sub-Bar */}
      <div className="hidden lg:flex min-h-12 gap-2 flex-wrap bg-surface/90 border-b border-surface-border px-4 sm:px-6 items-center justify-between z-20 shrink-0 text-xs font-mono">
        {/* Left: Case Context */}
        <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1.5 min-w-0">
          <h1 className="text-xs font-bold text-foreground tracking-wide uppercase font-mono flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="hidden sm:inline">Shield-RJ™ // Inteligência Forense & Auditoria de Crédito</span>
            <span className="sm:hidden">Shield-RJ™</span>
          </h1>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/30 font-semibold max-w-full sm:max-w-none">
            Alerta Nível 5: Desvio de Safra em Curso
          </span>
          <span className="hidden lg:inline text-xs text-slate-muted">
            Caso Ref. #BR-31-BURITIS · Fazenda Buritis · CPR-2025/BURITIS-99 (R$ 1,19M)
          </span>
        </div>

        {/* Right: Layout Switcher & Emergency Judicial Strike */}
        <div className="flex items-center gap-2.5 shrink-0 max-sm:w-full max-sm:[&>button]:w-full max-sm:[&>button]:justify-center max-sm:[&>button]:min-h-10">
          {/* Layout Mode Switcher */}
          <div className="hidden lg:flex items-center bg-surface-hover p-0.5 rounded-lg border border-surface-border text-xs">
            <button
              onClick={() => setLayoutMode("split")}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
                layoutMode === "split"
                  ? "bg-surface text-foreground font-semibold shadow-xs"
                  : "text-slate-muted hover:text-foreground"
              }`}
              title="Visão Dividida (Grafo + Tabela)"
            >
              <Columns className="w-3 h-3" />
              <span>Dividido</span>
            </button>
            <button
              onClick={() => setLayoutMode("graph")}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
                layoutMode === "graph"
                  ? "bg-surface text-foreground font-semibold shadow-xs"
                  : "text-slate-muted hover:text-foreground"
              }`}
              title="Expandir Grafo para Largura Total"
            >
              <span>Foco Grafo</span>
            </button>
            <button
              onClick={() => setLayoutMode("table")}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
                layoutMode === "table"
                  ? "bg-surface text-foreground font-semibold shadow-xs"
                  : "text-slate-muted hover:text-foreground"
              }`}
              title="Expandir Tabela de Evidências para Largura Total"
            >
              <span>Foco Tabela</span>
            </button>
          </div>

          {/* Strike Action Button */}
          <button
            onClick={() => setIsStrikeModalOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-xs transition-all shrink-0"
          >
            <Gavel className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Emitir Mandado Cautelar (CPC 301)</span>
            <span className="sm:hidden">Mandado Cautelar</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <main className="hidden lg:flex flex-1 w-full p-3.5 flex-col gap-3 lg:overflow-hidden">
        {/* Top KPI Telemetry Strip (Collapsible) */}
        <div className="flex-shrink-0 transition-all">
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
              Indicadores de Telemetria & Risco Concursal
            </span>
            <button
              onClick={() => setIsKpiCollapsed(!isKpiCollapsed)}
              className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              <span>{isKpiCollapsed ? "Exibir Indicadores" : "Ocultar Indicadores"}</span>
              {isKpiCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>

          {isKpiCollapsed ? (
            /* Collapsed Compact Summary Bar */
            <div className="bg-white dark:bg-[#11141c] border border-slate-200 dark:border-[#232936] rounded-lg px-4 py-2 flex flex-wrap items-center justify-between text-xs font-mono shadow-sm">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300">
                  <Satellite className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <strong>SAR Sentinel-1:</strong> -22,1 dB (Solo Exposto · Δ -6,2 dB)
                </span>
                <span className="text-slate-300 dark:text-zinc-700">•</span>
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300">
                  <CloudSun className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <strong>S_clima:</strong> 1,00 (Incompatível com Seca)
                </span>
                <span className="text-slate-300 dark:text-zinc-700">•</span>
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300">
                  <Truck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <strong>SEFAZ:</strong> 9.540 sc sob Interposta (MDF-e 3126...)
                </span>
                <span className="text-slate-300 dark:text-zinc-700">•</span>
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300">
                  <Scale className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <strong>STJ REsp 1.758.746:</strong> Extraconcursal (Sem Stay)
                </span>
              </div>
            </div>
          ) : (
            /* Expanded Full KPI Cards Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* KPI 1: SAR Radar */}
              <div className="bg-white dark:bg-[#11141c] border border-slate-200 dark:border-[#232936] p-3 rounded-xl shadow-sm">
                <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 text-xs">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Satellite className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    SAR Sentinel-1 RTC
                  </span>
                  <span className="text-rose-700 dark:text-rose-400 font-bold font-mono">
                    Δ -6,2 dB
                  </span>
                </div>
                <p className="text-base font-bold text-slate-900 dark:text-white mt-1 font-mono">
                  -22,1 dB (Solo Exposto)
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Alerta: Supressão Rápida de Biomassa SAR
                </p>
              </div>

              {/* KPI 2: Climate Disproof */}
              <div className="bg-white dark:bg-[#11141c] border border-slate-200 dark:border-[#232936] p-3 rounded-xl shadow-sm">
                <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 text-xs">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CloudSun className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Refutação Climática
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold font-mono">
                    Incompatível
                  </span>
                </div>
                <p className="text-base font-bold text-slate-900 dark:text-white mt-1 font-mono">
                  S_clima = 1,00
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Incompatível com Frustração Climática
                </p>
              </div>

              {/* KPI 3: SEFAZ Triangulation */}
              <div className="bg-white dark:bg-[#11141c] border border-slate-200 dark:border-[#232936] p-3 rounded-xl shadow-sm">
                <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 text-xs">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Truck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Triangulação Fiscal SEFAZ
                  </span>
                  <span className="text-rose-700 dark:text-rose-400 font-bold font-mono">
                    Z = 27,5 (Crítico)
                  </span>
                </div>
                <p className="text-base font-bold text-slate-900 dark:text-white mt-1 font-mono">
                  9.540 sc sob Interposta
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  MDF-e 3126... em Rota para Moega 03
                </p>
              </div>

              {/* KPI 4: STJ Legal Shield */}
              <div className="bg-white dark:bg-[#11141c] border border-slate-200 dark:border-[#232936] p-3 rounded-xl shadow-sm">
                <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 text-xs">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Scale className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    Extraconcursal STJ
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold font-mono">
                    Sem Stay
                  </span>
                </div>
                <p className="text-base font-bold text-slate-900 dark:text-white mt-1 font-mono">
                  REsp 1.758.746/GO
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Grão é Bem Fungível (Livre Apreensão)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Split Layout: Graph & Evidence Table */}
        <div className="flex-1 min-h-0 grid grid-cols-12 gap-3.5 lg:overflow-hidden">
          {/* Left Panel: Graph Visualizer */}
          {(layoutMode === "split" || layoutMode === "graph") && (
            <div
              className={`${
                layoutMode === "graph" ? "col-span-12" : "col-span-12 lg:col-span-7"
              } h-[480px] lg:h-full min-h-0 flex flex-col`}
            >
              <GraphVisualizer />
            </div>
          )}

          {/* Right Panel: Structured Evidence Table & Action Docket */}
          {(layoutMode === "split" || layoutMode === "table") && (
            <div
              className={`${
                layoutMode === "table" ? "col-span-12" : "col-span-12 lg:col-span-5"
              } lg:h-full min-h-0 flex flex-col gap-3 lg:overflow-hidden`}
            >
              {/* Evidence Table */}
              <div className="flex-1 min-h-[380px] lg:min-h-0">
                <EvidenceAuditTable
                  onTriggerStrike={() => setIsStrikeModalOpen(true)}
                />
              </div>

              {/* Collapsible Action Docket (Plantão Judiciário) */}
              <div className="bg-white dark:bg-[#11141c] border border-rose-200 dark:border-rose-950/80 p-3 rounded-xl shadow-sm flex-shrink-0 space-y-2 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                    <Gavel className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    Ação Cautelar Antecedente (Plantão Judiciário)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      Plantão Ativo
                    </span>
                    <button
                      onClick={() => setIsDocketCollapsed(!isDocketCollapsed)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                      title={isDocketCollapsed ? "Expandir" : "Recolher"}
                    >
                      {isDocketCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {!isDocketCollapsed && (
                  <>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                      O grão sob alerta de desvio (9.540 sacas) está ingressando na Moega 03 do Armazém Receptivo Cereais do Cerrado S/A.
                      O pedido cautelar inaudita altera parte visa impedir a comistão e apreender a carga fiduciária.
                    </p>
                    <button
                      onClick={() => setIsStrikeModalOpen(true)}
                      className="w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-sm transition-all flex items-center justify-center gap-2 text-xs"
                    >
                      <Gavel className="w-3.5 h-3.5" />
                      <span>Abrir Dossiê & Minuta Cautelar de Urgência</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Phone experience: verdict-first hero, focused tabs, evidence sheet, sticky action */}
      <ShieldMobile onStrike={() => setIsStrikeModalOpen(true)} />

      {/* Judicial Strike Modal */}
      <StrikeModal
        isOpen={isStrikeModalOpen}
        onClose={() => setIsStrikeModalOpen(false)}
      />
    </AppShell>
  );
}
