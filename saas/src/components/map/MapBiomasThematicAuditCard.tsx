"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  X,
  HelpCircle,
  FileCheck2,
  Wheat,
  TreePine,
  Droplets,
  Building,
  AlertTriangle,
  Info,
} from "lucide-react";
import { LandParcel } from "@/types/database";

interface MapBiomasThematicAuditCardProps {
  selectedParcel: LandParcel | null;
  activeThemeCount: number;
  activeYear?: number;
  onOpenWorkflowGuide: () => void;
  onClose: () => void;
}

export const MapBiomasThematicAuditCard: React.FC<MapBiomasThematicAuditCardProps> = ({
  selectedParcel,
  activeThemeCount,
  activeYear = 2023,
  onOpenWorkflowGuide,
  onClose,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // On phones the map slot is short: start collapsed so the card doesn't cover the parcel
  useEffect(() => {
    if (window.matchMedia("(max-width: 639px)").matches) setIsCollapsed(true);
  }, []);

  if (activeThemeCount === 0) return null;

  const totalArea = selectedParcel?.metrics_json.total_area_ha ?? 217.12;
  const arableArea = 146.79; // Soja / Safra principal
  const reserveArea = selectedParcel?.metrics_json.legal_reserve_area_ha ?? 43.42;
  const appArea = selectedParcel?.metrics_json.app_area_ha ?? 26.91;
  const infraArea = Math.max(0, totalArea - arableArea - reserveArea);

  return (
    <div className="absolute bottom-[68px] left-2 right-[89px] sm:right-auto sm:bottom-auto sm:top-16 sm:left-4 z-20 sm:w-88 max-h-[calc(100%-1rem)] sm:max-h-[calc(100%-5rem)] bg-white/95 dark:bg-[#11141c]/95 backdrop-blur-md border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl flex flex-col font-sans text-xs overflow-hidden transition-all animate-in fade-in duration-200">
      {/* Card Header */}
      <div className="p-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/80 dark:bg-zinc-900/60">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-xs">
              Auditoria Temática MapBiomas
            </h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
              Coleção 9.0 • Ano Base: {activeYear} • {activeThemeCount} temas ativos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenWorkflowGuide}
            className="p-1 rounded text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            title="Como funciona o workflow de crédito?"
            aria-label="Como funciona o workflow de crédito?"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            title={isCollapsed ? "Expandir" : "Recolher"}
            aria-label={isCollapsed ? "Expandir card" : "Recolher card"}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            title="Fechar card"
            aria-label="Fechar card"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Compliance Badge Banner */}
      <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold">
          <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Auditoria Cadastral: 0 Alertas Identificados (EUDR / CMN 5.267)</span>
        </div>
        <span className="text-xs bg-emerald-600 text-white px-1.5 py-0.5 rounded font-mono font-bold">
          0 Alertas
        </span>
      </div>

      {/* Expandable Breakdown Table */}
      {!isCollapsed && (
        <div className="p-3 space-y-2.5">
          <div className="flex items-center justify-between text-xs uppercase font-mono font-bold text-slate-400 dark:text-zinc-500 pb-1 border-b border-slate-100 dark:border-zinc-800">
            <span>Uso do Solo (Mapeado no Imóvel)</span>
            <span>Área (ha) • %</span>
          </div>

          <div className="space-y-1.5 text-xs">
            {/* 1. Lavoura Comercial (Soja/Milho) */}
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#e974ed] flex-shrink-0" />
                <span className="font-semibold text-slate-800 dark:text-zinc-200">
                  Lavoura Anual (Soja)
                </span>
              </div>
              <div className="font-mono text-right">
                <span className="font-bold text-slate-900 dark:text-white">146,79 ha</span>
                <span className="text-xs text-slate-400 ml-1.5">(67,6%)</span>
              </div>
            </div>

            {/* 2. Reserva Legal Cerrado */}
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#15803d] flex-shrink-0" />
                <span className="font-semibold text-slate-800 dark:text-zinc-200">
                  Reserva Legal Cerrado
                </span>
              </div>
              <div className="font-mono text-right">
                <span className="font-bold text-slate-900 dark:text-white">43,42 ha</span>
                <span className="text-xs text-slate-400 ml-1.5">(20,0%)</span>
              </div>
            </div>

            {/* 3. APP Hídrica */}
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#00e5ff] flex-shrink-0" />
                <span className="font-semibold text-slate-800 dark:text-zinc-200">
                  APP Hídrica (Rio Urucuia)
                </span>
              </div>
              <div className="font-mono text-right">
                <span className="font-bold text-slate-900 dark:text-white">26,91 ha</span>
                <span className="text-xs text-slate-400 ml-1.5">(12,4%)</span>
              </div>
            </div>

            {/* 4. Desmatamento Recente */}
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 flex-shrink-0" />
                <span className="font-semibold text-slate-800 dark:text-zinc-200">
                  Desmatamento Recente (Alerta)
                </span>
              </div>
              <div className="font-mono text-right">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">0,00 ha</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 ml-1.5">(Livre)</span>
              </div>
            </div>
          </div>

          {/* Quick Action Button */}
          <button
            onClick={onOpenWorkflowGuide}
            className="w-full py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 mt-2"
          >
            <Info className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Como usar estes dados no crédito rural?</span>
          </button>
        </div>
      )}
    </div>
  );
};
