"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GraphVisualizer } from "@/components/shield-rj/GraphVisualizer";
import { RedFlagTimeline } from "@/components/shield-rj/RedFlagTimeline";
import { StrikeModal } from "@/components/shield-rj/StrikeModal";
import {
  ShieldAlert,
  ArrowLeft,
  Box,
  Gavel,
  Satellite,
  CloudSun,
  Truck,
  Scale,
  RefreshCw,
} from "lucide-react";

export default function ShieldRJWarRoomPage() {
  const [isStrikeModalOpen, setIsStrikeModalOpen] = useState(false);

  return (
    <div className="w-screen h-screen bg-[#050505] flex flex-col overflow-hidden select-none font-mono text-xs">
      {/* Top Floating HUD Navigation & Alert Bar */}
      <header className="h-14 bg-[#0a0d10]/95 backdrop-blur-md border-b border-[#1f242b] px-5 flex items-center justify-between z-30 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#12171e] text-[#00e676] border border-[#1f242b] hover:border-[#00e676] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Radar 2D</span>
          </Link>

          <Link
            href="/dashboard/land/1/3d"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#12171e] text-cyan-400 border border-[#1f242b] hover:border-cyan-400 transition-all"
          >
            <Box className="w-4 h-4" />
            <span>Gêmeo 3D Buritis</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <h1 className="text-sm font-bold text-white font-display flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span>SHIELD RJ 2.0 // WAR ROOM FORENSE ANTI-GOLPE</span>
            </h1>
            <span className="text-[10px] text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-500/40 font-bold">
              FUGA NOTURNA EM ANDAMENTO · ALERTA NÍVEL 5
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsStrikeModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white font-bold shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all animate-pulse"
          >
            <Gavel className="w-4 h-4 text-white" />
            <span>DISPARAR MANDADO CAUTELAR (CPC 301)</span>
          </button>
        </div>
      </header>

      {/* Main War Room Body */}
      <main className="flex-1 w-full p-4 grid grid-cols-12 gap-4 overflow-hidden">
        {/* Left Column: Multi-Layer Graph & Analytical Telemetry (8 cols) */}
        <section className="col-span-8 flex flex-col gap-3 h-full overflow-hidden">
          {/* Top KPI Telemetry Row */}
          <div className="grid grid-cols-4 gap-2.5 flex-shrink-0">
            {/* KPI 1: SAR Radar */}
            <div className="bg-[#0a0d10] border border-[#1f242b] p-2.5 rounded-lg">
              <div className="flex items-center justify-between text-slate-400 text-[10px]">
                <span className="flex items-center gap-1">
                  <Satellite className="w-3 h-3 text-cyan-400" />
                  SAR Sentinel-1
                </span>
                <span className="text-red-400 font-bold">-9,7 dB</span>
              </div>
              <p className="text-sm font-bold text-white mt-1">-22,1 dB (Solo)</p>
              <p className="text-[9px] text-slate-500">Colheita Noturna Provada</p>
            </div>

            {/* KPI 2: Climate Disproof */}
            <div className="bg-[#0a0d10] border border-[#1f242b] p-2.5 rounded-lg">
              <div className="flex items-center justify-between text-slate-400 text-[10px]">
                <span className="flex items-center gap-1">
                  <CloudSun className="w-3 h-3 text-emerald-400" />
                  Refutação S_clima
                </span>
                <span className="text-emerald-400 font-bold">100% Refutado</span>
              </div>
              <p className="text-sm font-bold text-white mt-1">S_clima = 1,00</p>
              <p className="text-[9px] text-slate-500">Seca/Chuva Impossível</p>
            </div>

            {/* KPI 3: SEFAZ Triangulation */}
            <div className="bg-[#0a0d10] border border-[#1f242b] p-2.5 rounded-lg">
              <div className="flex items-center justify-between text-slate-400 text-[10px]">
                <span className="flex items-center gap-1">
                  <Truck className="w-3 h-3 text-orange-400" />
                  Triangulação SEFAZ
                </span>
                <span className="text-red-400 font-bold">Z = 27,5</span>
              </div>
              <p className="text-sm font-bold text-white mt-1">85.400 sc em Laranja</p>
              <p className="text-[9px] text-slate-500">MDF-e 3126... em Rota</p>
            </div>

            {/* KPI 4: STJ Legal Shield */}
            <div className="bg-[#0a0d10] border border-[#1f242b] p-2.5 rounded-lg">
              <div className="flex items-center justify-between text-slate-400 text-[10px]">
                <span className="flex items-center gap-1">
                  <Scale className="w-3 h-3 text-amber-400" />
                  Extraconcursal STJ
                </span>
                <span className="text-emerald-400 font-bold">Sem Stay</span>
              </div>
              <p className="text-sm font-bold text-white mt-1">REsp 1.758.746</p>
              <p className="text-[9px] text-slate-500">Grão é Bem Fungível</p>
            </div>
          </div>

          {/* Center Canvas: Interactive Cytoscape / SVG Graph */}
          <div className="flex-1 min-h-0">
            <GraphVisualizer />
          </div>
        </section>

        {/* Right Column: Timeline & Procedural Action Docket (4 cols) */}
        <section className="col-span-4 flex flex-col gap-3 h-full overflow-hidden">
          <div className="flex-1 min-h-0">
            <RedFlagTimeline />
          </div>

          {/* Quick Legal Launch Pad */}
          <div className="bg-[#0a0d10] border border-red-500/40 p-3 rounded-xl flex-shrink-0 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <Gavel className="w-3.5 h-3.5 text-red-500" />
                Ação Cautelar Pré-Processual
              </span>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                PLANTÃO JUDICIÁRIO ATIVO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              O grão desviado (85.400 sacas) está ingressando na Moega 03 do Armazém Receptivo Cereais S/A.
              O mandado liminar inaudita altera parte impede a comistão e apreende a carga com força policial.
            </p>
            <button
              onClick={() => setIsStrikeModalOpen(true)}
              className="w-full py-2 rounded bg-red-600 hover:bg-red-500 text-white font-bold shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all flex items-center justify-center gap-2"
            >
              <Gavel className="w-4 h-4" />
              <span>Abrir Dossiê e Petição Liminar</span>
            </button>
          </div>
        </section>
      </main>

      {/* Judicial Strike Modal */}
      <StrikeModal
        isOpen={isStrikeModalOpen}
        onClose={() => setIsStrikeModalOpen(false)}
      />
    </div>
  );
}
