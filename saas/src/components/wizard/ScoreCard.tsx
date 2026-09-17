"use client";

import React from "react";
import { EnrichedLandData } from "@/types/geospatial";
import { Badge } from "../ui/Badge";
import {
  ShieldCheck,
  AlertTriangle,
  Ban,
  CheckCircle,
  FileCheck2,
  TreePine,
  Droplets,
  Layers,
  Award,
} from "lucide-react";

interface ScoreCardProps {
  data: EnrichedLandData;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ data }) => {
  const { scorecard, metrics, compliance_ibama, compliance_sicar, compliance_sigef, environmental_context } = data;
  const isClean = scorecard.overall_status === "VERIFICADO";
  const isEmbargoed = compliance_ibama.is_embargoed;

  return (
    <div className="space-y-4">
      {/* Top Status Banner */}
      <div className="p-4 rounded-lg bg-[#0a0d10] border border-[#1f242b] space-y-3 shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
              Auditoria Territorial Automatizada
            </span>
            <h3 className="text-lg font-bold text-white font-display">
              {data.name}
            </h3>
            <p className="text-xs text-gray-400 font-mono">
              {data.municipality} / {data.state_uf} • {metrics.total_area_ha.toFixed(2)} ha
            </p>
          </div>

          <Badge variant={isEmbargoed ? "embargo" : "regular"} size="md">
            {scorecard.overall_status}
          </Badge>
        </div>

        {/* ESG Score & Risk Gauge */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#1f242b]">
          <div className="bg-[#050505] p-2.5 rounded border border-[#1f242b]">
            <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-[#00e676]" />
              Rating Socioambiental (ESG)
            </div>
            <div className="text-xl font-bold font-mono mt-1 flex items-baseline gap-1">
              <span className={scorecard.score_esg > 70 ? "text-[#00e676]" : "text-red-400"}>
                {scorecard.score_esg}
              </span>
              <span className="text-xs text-gray-500">/ 100</span>
            </div>
          </div>

          <div className="bg-[#050505] p-2.5 rounded border border-[#1f242b]">
            <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00ff85]" />
              Risco de Crédito Rural
            </div>
            <div
              className={`text-sm font-bold font-mono mt-1.5 ${
                scorecard.risk_level === "BAIXO"
                  ? "text-[#00e676]"
                  : scorecard.risk_level === "CRÍTICO"
                  ? "text-red-400"
                  : "text-amber-400"
              }`}
            >
              NÍVEL {scorecard.risk_level}
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Matrix Checklist */}
      <div className="bg-[#0a0d10] border border-[#1f242b] rounded-lg p-4 space-y-3 font-mono text-xs">
        <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#00e676]" />
          Matriz de Conformidade Legal
        </h4>

        <div className="space-y-2">
          {/* SICAR */}
          <div className="flex items-center justify-between p-2 rounded bg-[#050505] border border-[#1f242b]">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#00e676]" />
              <span className="text-gray-300">Cadastro SICAR:</span>
            </div>
            <Badge variant="regular">{compliance_sicar.status}</Badge>
          </div>

          {/* SIGEF */}
          <div className="flex items-center justify-between p-2 rounded bg-[#050505] border border-[#1f242b]">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#00e676]" />
              <span className="text-gray-300">Georreferenciamento INCRA:</span>
            </div>
            <Badge variant="regular">Certificado</Badge>
          </div>

          {/* IBAMA */}
          <div className="flex items-center justify-between p-2 rounded bg-[#050505] border border-[#1f242b]">
            <div className="flex items-center gap-2">
              {isEmbargoed ? (
                <Ban className="w-4 h-4 text-red-400" />
              ) : (
                <CheckCircle className="w-4 h-4 text-[#00e676]" />
              )}
              <span className="text-gray-300">Intersecção Embargos IBAMA:</span>
            </div>
            <Badge variant={isEmbargoed ? "embargo" : "regular"}>
              {isEmbargoed ? `${compliance_ibama.embargos_count} Embargo Ativo` : "0 Embargos (Limpo)"}
            </Badge>
          </div>

          {/* Biome */}
          <div className="flex items-center justify-between p-2 rounded bg-[#050505] border border-[#1f242b]">
            <div className="flex items-center gap-2">
              <TreePine className="w-4 h-4 text-[#00ff85]" />
              <span className="text-gray-300">Bioma Predominante:</span>
            </div>
            <span className="text-white font-bold">{environmental_context.biome}</span>
          </div>

          {/* APPs */}
          <div className="flex items-center justify-between p-2 rounded bg-[#050505] border border-[#1f242b]">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-[#00e5ff]" />
              <span className="text-gray-300">Áreas de Preservação (APP):</span>
            </div>
            <span className="text-[#00e5ff] font-bold">{metrics.app_area_ha.toFixed(2)} ha</span>
          </div>
        </div>
      </div>

      {/* Credit Passport Eligibility Alert */}
      {isClean ? (
        <div className="p-3 rounded-lg bg-[#00e676]/10 border border-[#00e676]/40 text-[#00e676] text-xs font-mono space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <FileCheck2 className="w-4 h-4" />
            Elegível para Passaporte de Crédito Rural AgrosTech
          </div>
          <p className="text-gray-300 text-[11px]">
            Propriedade autenticada em Buritis/MG sem restrições socioambientais ativas.
          </p>
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/50 text-red-400 text-xs font-mono space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            Inconformidade Crítica Detectada
          </div>
          <p className="text-gray-300 text-[11px]">
            Sobreposição com embargo ambiental do IBAMA.
          </p>
        </div>
      )}
    </div>
  );
};
