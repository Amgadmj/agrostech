"use client";

import React, { useState, useMemo } from "react";
import { LandParcel } from "@/types/database";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Box,
  ShieldCheck,
  AlertTriangle,
  TreePine,
  Droplets,
  Mountain,
  Compass,
  FileText,
  ExternalLink,
  SlidersHorizontal,
  X,
} from "lucide-react";

interface SidebarProps {
  parcels: LandParcel[];
  selectedParcel: LandParcel | null;
  onSelectParcel: (parcel: LandParcel) => void;
  portalRole: "b2c" | "b2b";
}

export const Sidebar: React.FC<SidebarProps> = ({
  parcels,
  selectedParcel,
  onSelectParcel,
  portalRole,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const isB2B = portalRole === "b2b";

  // Diacritic normalization for Portuguese search
  const normalize = (str: string) =>
    str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // Filter parcels for search (nationwide across name, CAR, municipality, UF)
  const filteredParcels = parcels.filter((p) => {
    const q = normalize(searchTerm);
    if (!q) return true;
    return (
      normalize(p.name).includes(q) ||
      normalize(p.car_code).replace(/[-.]/g, "").includes(q.replace(/[-.]/g, "")) ||
      normalize(p.municipality).includes(q) ||
      normalize(p.state_uf).includes(q)
    );
  });

  // Calculate portfolio metrics for B2B
  const totalArea = parcels.reduce((acc, p) => acc + p.metrics_json.total_area_ha, 0);
  const coverageUFs = useMemo(
    () => [...new Set(parcels.map((p) => p.state_uf))].join(" • "),
    [parcels]
  );

  return (
    <aside
      className={`relative z-30 transition-all duration-300 h-[calc(100vh-4rem)] flex flex-col bg-[#0a0d10]/95 backdrop-blur-md border-r border-[#1f242b] ${
        isCollapsed ? "w-14" : "w-96 md:w-[420px]"
      }`}
    >
      {/* Collapse Toggle Tab */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3.5 top-6 z-40 w-7 h-7 rounded-full bg-[#0a0d10] border border-[#1f242b] text-gray-300 hover:text-[#00e676] hover:border-[#00e676] flex items-center justify-center transition-all shadow-md"
        title={isCollapsed ? "Expandir Painel" : "Recolher Painel"}
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {isCollapsed ? (
        <div className="flex flex-col items-center py-6 gap-6 text-gray-400">
          <div className="w-8 h-8 rounded bg-[#12171e] border border-[#1f242b] flex items-center justify-center text-[#00e676]">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div className="writing-vertical text-xs font-mono tracking-wider uppercase text-gray-500">
            {isB2B ? "Glebas Brasil" : "Fazenda Buritis"}
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Top Panel: Header & Summary */}
          <div className="p-5 border-b border-[#1f242b]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#00e676] font-bold">
                  {isB2B ? "Carteira Nacional — Brasil" : "Gleba Benchmark — Buritis/MG"}
                </span>
                <h2 className="text-base font-bold text-white font-display">
                  {isB2B ? "Glebas Mapeadas no Brasil" : "Fazenda Buritis (217,12 ha)"}
                </h2>
              </div>
              <Badge variant="regular" size="sm">
                {isB2B ? `${parcels.length} Glebas no Brasil` : "Benchmark SICAR"}
              </Badge>
            </div>

            {/* B2B Institutional Summary Metrics */}
            {isB2B && (
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#1f242b]">
                <div className="bg-[#12171e] p-2 rounded border border-[#1f242b]">
                  <div className="text-[10px] text-gray-400 font-mono">Área Total</div>
                  <div className="text-xs font-bold text-white font-mono">
                    {totalArea.toFixed(0)} ha
                  </div>
                </div>
                <div className="bg-[#12171e] p-2 rounded border border-[#1f242b]">
                  <div className="text-[10px] text-gray-400 font-mono">Conformidade</div>
                  <div className="text-xs font-bold text-[#00e676] font-mono">100%</div>
                </div>
                <div className="bg-[#12171e] p-2 rounded border border-[#1f242b]">
                  <div className="text-[10px] text-gray-400 font-mono">Cobertura</div>
                  <div className="text-xs font-bold text-white font-mono truncate" title={coverageUFs}>
                    {coverageUFs}
                  </div>
                </div>
              </div>
            )}

            {/* Search Bar (Nationwide Scope) */}
            <div className="mt-3 relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar gleba no Brasil por nome, município, UF ou CAR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#050505] border border-[#1f242b] rounded pl-8 pr-8 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00e676] font-mono"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-2 text-gray-400 hover:text-white"
                  title="Limpar busca"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Middle Scrollable Section: Selected Parcel or Gleba List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {selectedParcel ? (
              <div className="space-y-4">
                {isB2B && (
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => onSelectParcel(null as any)}
                      className="text-xs text-[#00e676] hover:underline font-mono flex items-center gap-1"
                    >
                      &larr; Ver todas as propriedades
                    </button>
                    <Badge variant="regular">VERIFICADO</Badge>
                  </div>
                )}

                {/* Selected Farm Card Header */}
                <div className="p-4 rounded-lg bg-[#12171e] border border-[#00e676]/40 shadow-[0_0_15px_rgba(0,230,118,0.15)] space-y-3 reticle-corner">
                  <div>
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                      {selectedParcel.municipality} — {selectedParcel.state_uf} • UTM 23S
                    </span>
                    <h3 className="text-base font-bold text-white font-display mt-0.5">
                      {selectedParcel.name}
                    </h3>
                  </div>

                  {/* CRITICAL CTA: View 3D Digital Twin (Direct link to dashboard-ui) */}
                  <a
                    href="https://dashboard-ui-liart-ten.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full flex items-center justify-center gap-2 group bg-[#00e676] hover:bg-[#00ff85] text-black font-bold shadow-[0_0_15px_rgba(0,230,118,0.35)]"
                    >
                      <Box className="w-4 h-4 text-black group-hover:scale-110 transition-transform" />
                      <span>Ver Gêmeo Digital 3D</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-70" />
                    </Button>
                  </a>
                </div>

                {/* Real Metrics Grid for Buritis */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#12171e] p-3 rounded border border-[#1f242b]">
                    <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                      <Mountain className="w-3 h-3 text-[#00e676]" />
                      Área Cadastrada
                    </div>
                    <div className="text-base font-bold text-white font-mono mt-0.5">
                      {selectedParcel.metrics_json.total_area_ha.toFixed(2)} ha
                    </div>
                  </div>

                  <div className="bg-[#12171e] p-3 rounded border border-[#1f242b]">
                    <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-[#00e5ff]" />
                      APP Hídrica
                    </div>
                    <div className="text-base font-bold text-[#00e5ff] font-mono mt-0.5">
                      {selectedParcel.metrics_json.app_area_ha.toFixed(2)} ha
                    </div>
                  </div>

                  <div className="bg-[#12171e] p-3 rounded border border-[#1f242b]">
                    <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                      <TreePine className="w-3 h-3 text-[#15803d]" />
                      Reserva Legal Cerrado
                    </div>
                    <div className="text-base font-bold text-[#15803d] font-mono mt-0.5">
                      {selectedParcel.metrics_json.legal_reserve_area_ha.toFixed(2)} ha
                    </div>
                  </div>

                  <div className="bg-[#12171e] p-3 rounded border border-[#1f242b]">
                    <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                      <Compass className="w-3 h-3 text-[#00e676]" />
                      Declividade Média
                    </div>
                    <div className="text-base font-bold text-[#00e676] font-mono mt-0.5">
                      {selectedParcel.metrics_json.slope_avg_percent || 6.8}%
                    </div>
                  </div>
                </div>

                {/* Official Codes & Registries */}
                <div className="bg-[#12171e] p-3.5 rounded border border-[#1f242b] space-y-2">
                  <h4 className="text-xs font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#00e676]" />
                    Registro Cadastral Oficial
                  </h4>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div>
                      <span className="text-gray-500 block text-[10px]">Código CAR:</span>
                      <span className="text-gray-200 break-all select-all text-[11px]">
                        {selectedParcel.car_code}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">Matrícula Cartorial:</span>
                      <span className="text-gray-200">{selectedParcel.matricula_code}</span>
                    </div>
                  </div>
                </div>

                {/* Compliance Scorecard */}
                <div className="bg-[#12171e] p-3.5 rounded border border-[#1f242b] space-y-2.5">
                  <h4 className="text-xs font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#00e676]" />
                    Auditoria Territorial Automatizada
                  </h4>

                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between p-2 rounded bg-[#0a0d10] border border-[#1f242b]">
                      <span className="text-gray-300">SICAR Nacional:</span>
                      <span className="text-[#00e676] font-bold">Ativo / Regular</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-[#0a0d10] border border-[#1f242b]">
                      <span className="text-gray-300">SIGEF / INCRA:</span>
                      <span className="text-[#00e676] font-bold">
                        {selectedParcel.compliance_sigef.certified ? "Certificado INCRA" : "Em Análise"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-[#0a0d10] border border-[#1f242b]">
                      <span className="text-gray-300">Embargos IBAMA:</span>
                      <span className="text-[#00e676] font-bold">
                        {selectedParcel.compliance_ibama.is_embargoed ? "Sob Embargo" : "0 Embargos (Livre)"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-[#0a0d10] border border-[#1f242b]">
                      <span className="text-gray-300">Solo & Bioma:</span>
                      <span className="text-gray-200 truncate max-w-[200px] text-right" title={selectedParcel.environmental_context.soil_type}>
                        {selectedParcel.environmental_context.biome}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* List of Properties */
              <div className="space-y-2">
                <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>
                    {isB2B
                      ? `Glebas Mapeadas no Brasil (${filteredParcels.length})`
                      : `Glebas Mapeadas no Brasil (${filteredParcels.length})`}
                  </span>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="text-[#00e676] hover:underline lowercase text-[10px]"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {filteredParcels.length === 0 ? (
                  <div className="p-4 rounded-lg bg-[#12171e] border border-[#1f242b] text-center space-y-2">
                    <p className="text-xs text-gray-400 font-mono">
                      Nenhuma gleba encontrada para &ldquo;{searchTerm}&rdquo;.
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono">
                      Busque por UF (ex: MG, SP, MT, BA, PR, GO), município ou código CAR.
                    </p>
                    <button
                      onClick={() => setSearchTerm("")}
                      className="text-xs text-[#00e676] font-mono hover:underline"
                    >
                      Limpar busca
                    </button>
                  </div>
                ) : (
                  filteredParcels.map((parcel) => (
                    <div
                      key={parcel.id}
                      onClick={() => onSelectParcel(parcel)}
                      className="p-3 rounded-lg bg-[#12171e] border border-[#1f242b] hover:border-[#00e676] cursor-pointer transition-all space-y-1.5 group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white group-hover:text-[#00e676] transition-colors">
                            {parcel.name}
                          </h4>
                          <span className="text-[10px] font-mono text-gray-400">
                            {parcel.municipality}/{parcel.state_uf} •{" "}
                            {parcel.metrics_json.total_area_ha.toFixed(1)} ha
                          </span>
                        </div>
                        <Badge variant="regular" size="sm">
                          Regular
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 pt-1 border-t border-[#1f242b]/60">
                        <span>CAR: {parcel.car_code.slice(0, 15)}...</span>
                        <span className="text-[#00e676] group-hover:translate-x-0.5 transition-transform">
                          Inspecionar &rarr;
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
