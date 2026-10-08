"use client";

import React, { useMemo } from "react";
import { EnrichedLandData } from "@/types/geospatial";
import { Badge } from "@/components/ui/Badge";
import { calculateNetPlantableArea } from "@/lib/m1/calculator";
import { ModelM1Output } from "@/lib/m1/types";
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
  Satellite,
  Compass,
  Scale,
  Sparkles,
  Info,
} from "lucide-react";

export interface ScoreCardProps {
  data: EnrichedLandData;
  m1Result?: ModelM1Output;
}

/**
 * Evaluates Credit Risk Level based on 0-100 rating scale.
 * BAIXO (>= 80), MÉDIO (50-79), ALTO (30-49), CRÍTICO (< 30)
 */
export function getCreditRiskLevel(score: number): "BAIXO" | "MÉDIO" | "ALTO" | "CRÍTICO" {
  if (score >= 80) return "BAIXO";
  if (score >= 50) return "MÉDIO";
  if (score >= 30) return "ALTO";
  return "CRÍTICO";
}

/**
 * Enforces BCB Resolução CMN nº 5.267/2025 continuous remote sensing mandate.
 * Mandatory for operations with total area > 300 ha.
 */
export function isRemoteSensingMandatory(totalAreaHa: number): boolean {
  return totalAreaHa > 300.0;
}

/**
 * Evaluates Passaporte de Crédito Rural eligibility based on MCR 2-9 criteria.
 */
export function evaluateCreditPassport(input: {
  sicarStatus: string;
  hasEmbargo: boolean;
  hasIndigenousOverlap?: boolean;
  hasConservationUnitOverlap?: boolean;
  netAreaRatio: number;
}): boolean {
  const isSicarValid = input.sicarStatus === "Ativo" || input.sicarStatus === "Pendente" || input.sicarStatus.includes("Ativo");
  const noEmbargo = !input.hasEmbargo;
  const noIndigenous = !input.hasIndigenousOverlap;
  const noConservation = !input.hasConservationUnitOverlap;
  const ratioEligible = input.netAreaRatio >= 0.15;

  return isSicarValid && noEmbargo && noIndigenous && noConservation && ratioEligible;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ data, m1Result: propM1Result }) => {
  const { scorecard, metrics, compliance_ibama, compliance_sicar, compliance_sigef, environmental_context } = data;

  // Calculate or resolve Model M1 Net Plantable Area metrics
  const m1 = useMemo<ModelM1Output>(() => {
    if (propM1Result) return propM1Result;

    // Check if metrics already contains precomputed net plantable area
    const existingNet = (metrics as any).net_plantable_area_ha;
    if (typeof existingNet === "number" && existingNet > 0 && metrics.total_area_ha > 0) {
      const netRatio = existingNet / metrics.total_area_ha;
      const isEmbargoed = compliance_ibama.is_embargoed;
      const embargoesHa = isEmbargoed ? (compliance_ibama.records?.[0]?.intersection_area_ha || 0) : 0;
      return {
        cadastralGrossAreaHa: metrics.total_area_ha,
        grossAreaHa: metrics.total_area_ha,
        netPlantableAreaHa: existingNet,
        estimatedUsableAreaHa: existingNet,
        preservationRatio: (metrics.app_area_ha + metrics.legal_reserve_area_ha) / metrics.total_area_ha,
        netArableRatio: netRatio,
        deductionsBreakdown: {
          appHa: metrics.app_area_ha,
          legalReserveHa: metrics.legal_reserve_area_ha,
          rlInAppOverlapHa: 0,
          netConservationHa: metrics.app_area_ha + metrics.legal_reserve_area_ha,
          easementsHa: 0,
          restrictedUseHa: 0,
          disputedAreaHa: 0,
          publicConflictsHa: 0,
          embargoesHa,
          exclusionOverlapsHa: 0,
          totalDeductionsHa: metrics.total_area_ha - existingNet,
        },
        exclusionPolicyVersion: "v1.2-art15-dedup",
        isEligibleForCredit: !isEmbargoed && netRatio >= 0.15,
        continuousMonitoringMandatory: metrics.total_area_ha > 300,
        creditBlockReasons: isEmbargoed ? ["Área embargada pelo IBAMA"] : [],
        recommendations: [],
      };
    }

    // Otherwise dynamically run Model M1 calculator
    return calculateNetPlantableArea({
      grossAreaHa: metrics.total_area_ha,
      appAreaHa: metrics.app_area_ha,
      legalReserveAreaHa: metrics.legal_reserve_area_ha,
      rlInAppAreaHa: (metrics as any).rl_in_app_ha || 0,
      embargoesHa: compliance_ibama.is_embargoed ? (compliance_ibama.records?.[0]?.intersection_area_ha || 0) : 0,
      consolidatedUseHa: metrics.consolidated_area_ha,
      carStatus: compliance_sicar.status,
      hasIndigenousOverlap: environmental_context?.indigenous_overlap,
      hasConservationUnitOverlap: environmental_context?.conservation_unit_overlap,
    });
  }, [propM1Result, metrics, compliance_ibama, compliance_sicar, environmental_context]);

  const isEmbargoed = compliance_ibama.is_embargoed;
  const isContinuousSarMandatory = isRemoteSensingMandatory(metrics.total_area_ha);
  const isPassportEligible = evaluateCreditPassport({
    sicarStatus: compliance_sicar.status,
    hasEmbargo: isEmbargoed,
    hasIndigenousOverlap: environmental_context?.indigenous_overlap,
    hasConservationUnitOverlap: environmental_context?.conservation_unit_overlap,
    netAreaRatio: m1.netArableRatio,
  });

  const riskLevel = getCreditRiskLevel(scorecard.score_esg);

  return (
    <div className="space-y-4">
      {/* Top Status Banner */}
      <div className="p-4 rounded-lg bg-[#0a0d10] border border-[#1f242b] space-y-3 shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-gray-400">
              Auditoria Territorial Automatizada
            </span>
            <h3 className="text-lg font-bold text-white font-display">
              {data.name}
            </h3>
            <p className="text-xs text-gray-400 font-mono">
              {data.municipality} / {data.state_uf} • {metrics.total_area_ha.toFixed(2)} ha (Bruta)
            </p>
          </div>

          <Badge variant={isEmbargoed ? "embargo" : "regular"} size="md">
            {isEmbargoed ? "BLOQUEADO" : scorecard.overall_status}
          </Badge>
        </div>

        {/* Model M1 Net Plantable Area & Arable Ratio Card */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#1f242b]">
          <div className="bg-[#050505] p-2.5 rounded border border-[#1f242b]">
            <div className="text-xs text-gray-400 font-mono flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-[#00ff85]" />
              Área Útil Líquida (M1)
            </div>
            <div className="text-lg font-bold font-mono mt-1 flex items-baseline gap-1 text-[#00ff85]">
              <span>{m1.netPlantableAreaHa.toFixed(2)}</span>
              <span className="text-xs text-gray-400">ha</span>
            </div>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              Deduzidas APP, RL e servidões
            </p>
          </div>

          <div className="bg-[#050505] p-2.5 rounded border border-[#1f242b]">
            <div className="text-xs text-gray-400 font-mono flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-[#00e5ff]" />
              Taxa de Aproveitamento
            </div>
            <div className="text-lg font-bold font-mono mt-1 flex items-baseline gap-1 text-[#00e5ff]">
              <span>{(m1.netArableRatio * 100).toFixed(1)}%</span>
              <span className="text-xs text-gray-400">agricultável</span>
            </div>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              {m1.netArableRatio >= 0.15 ? "Mínimo regulatório atingido (≥15%)" : "Abaixo do corte mínimo (<15%)"}
            </p>
          </div>
        </div>

        {/* ESG Score & Risk Gauge */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#1f242b]">
          <div className="bg-[#050505] p-2.5 rounded border border-[#1f242b]">
            <div className="text-xs text-gray-400 font-mono flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-[#00e676]" />
              Rating Socioambiental (ESG)
            </div>
            <div className="text-xl font-bold font-mono mt-1 flex items-baseline gap-1">
              <span className={scorecard.score_esg >= 70 ? "text-[#00e676]" : "text-red-400"}>
                {scorecard.score_esg}
              </span>
              <span className="text-xs text-gray-500">/ 100</span>
            </div>
          </div>

          <div className="bg-[#050505] p-2.5 rounded border border-[#1f242b]">
            <div className="text-xs text-gray-400 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00ff85]" />
              Risco de Crédito Rural
            </div>
            <div
              className={`text-sm font-bold font-mono mt-1.5 ${
                riskLevel === "BAIXO"
                  ? "text-[#00e676]"
                  : riskLevel === "CRÍTICO"
                  ? "text-red-400"
                  : "text-amber-400"
              }`}
            >
              NÍVEL {riskLevel}
            </div>
          </div>
        </div>

        {/* BCB Resolução CMN nº 5.267/2025 Continuous Remote Sensing Indicator */}
        <div className="pt-2 border-t border-[#1f242b]">
          {isContinuousSarMandatory ? (
            <div className="p-2.5 rounded bg-cyan-950/30 border border-[#00e5ff]/40 text-[#00e5ff] text-xs font-mono flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Satellite className="w-4 h-4 text-[#00e5ff] animate-pulse flex-shrink-0" />
                <div>
                  <span className="font-bold block">
                    Monitoramento Remoto Contínuo Obrigatório
                  </span>
                  <span className="text-xs text-gray-300">
                    Área financiada &gt; 300 ha (Resolução CMN nº 5.267/2025 · SAR Sentinel-1)
                  </span>
                </div>
              </div>
              <Badge variant="app" size="sm">
                CMN 5.267 &gt; 300 ha
              </Badge>
            </div>
          ) : (
            <div className="p-2.5 rounded bg-[#12171e] border border-[#1f242b] text-gray-300 text-xs font-mono flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-200 block">
                    Dispensado de Monitoramento Obrigatório
                  </span>
                  <span className="text-xs text-gray-500">
                    Área ≤ 300 ha · Monitoramento Voluntário Ativo
                  </span>
                </div>
              </div>
              <Badge variant="neutral" size="sm">
                Dispensado (&le;300 ha)
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Compliance Matrix Checklist */}
      <div className="bg-[#0a0d10] border border-[#1f242b] rounded-lg p-4 space-y-3 font-mono text-xs">
        <h4 className="font-semibold text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#00e676]" />
          Matriz de Conformidade MCR 2-9
        </h4>

        <div className="space-y-2">
          {/* SICAR */}
          <div className="flex items-center justify-between p-2 rounded bg-[#050505] border border-[#1f242b]">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#00e676]" />
              <span className="text-gray-300">Cadastro SICAR (MCR 2-9-1):</span>
            </div>
            <Badge variant="regular">{compliance_sicar.status}</Badge>
          </div>

          {/* SIGEF */}
          <div className="flex items-center justify-between p-2 rounded bg-[#050505] border border-[#1f242b]">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#00e676]" />
              <span className="text-gray-300">Georreferenciamento INCRA:</span>
            </div>
            <Badge variant="regular">{compliance_sigef.certified ? "Certificado" : "Pendente"}</Badge>
          </div>

          {/* IBAMA */}
          <div className="flex items-center justify-between p-2 rounded bg-[#050505] border border-[#1f242b]">
            <div className="flex items-center gap-2">
              {isEmbargoed ? (
                <Ban className="w-4 h-4 text-red-400" />
              ) : (
                <CheckCircle className="w-4 h-4 text-[#00e676]" />
              )}
              <span className="text-gray-300">Embargos IBAMA (MCR 2-9-2):</span>
            </div>
            <Badge variant={isEmbargoed ? "embargo" : "regular"}>
              {isEmbargoed ? `${compliance_ibama.embargos_count} Embargo Ativo` : "0 Embargos (Limpo)"}
            </Badge>
          </div>

          {/* Indigenous and Conservation */}
          <div className="flex items-center justify-between p-2 rounded bg-[#050505] border border-[#1f242b]">
            <div className="flex items-center gap-2">
              {environmental_context?.indigenous_overlap || environmental_context?.conservation_unit_overlap ? (
                <Ban className="w-4 h-4 text-red-400" />
              ) : (
                <CheckCircle className="w-4 h-4 text-[#00e676]" />
              )}
              <span className="text-gray-300">Terras Indígenas / UC (MCR 2-9-3/4):</span>
            </div>
            <Badge variant={environmental_context?.indigenous_overlap ? "embargo" : "regular"}>
              {environmental_context?.indigenous_overlap ? "Sobreposição Detectada" : "Zero Sobreposição"}
            </Badge>
          </div>

          {/* Biome */}
          <div className="flex items-center justify-between p-2 rounded bg-[#050505] border border-[#1f242b]">
            <div className="flex items-center gap-2">
              <TreePine className="w-4 h-4 text-[#00ff85]" />
              <span className="text-gray-300">Bioma Predominante:</span>
            </div>
            <span className="text-white font-bold">{environmental_context?.biome || "Cerrado"}</span>
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
      {isPassportEligible ? (
        <div className="p-3 rounded-lg bg-[#00ff85]/10 border border-[#00ff85]/40 text-[#00ff85] text-xs font-mono space-y-1 shadow-neon">
          <div className="font-bold flex items-center gap-1.5">
            <FileCheck2 className="w-4 h-4 text-[#00ff85]" />
            <span>Passaporte de Crédito Rural AgrosTech Concedido</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse ml-auto" />
          </div>
          <p className="text-gray-300 text-xs leading-relaxed">
            Propriedade 100% conforme sob MCR 2-9 e Código Florestal. Área Útil Líquida calculada em{" "}
            <b className="text-white">{m1.netPlantableAreaHa.toFixed(2)} ha</b> (
            <b className="text-[#00ff85]">{(m1.netArableRatio * 100).toFixed(1)}%</b> do total) apta para garantia fiduciária e CPR.
          </p>
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/50 text-red-400 text-xs font-mono space-y-1 shadow-[0_0_15px_rgba(239,68,68,0.25)]">
          <div className="font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>Inconformidade Crítica Detectada — Bloqueio MCR 2-9</span>
          </div>
          <p className="text-gray-300 text-xs leading-relaxed">
            {isEmbargoed
              ? "Operação impedida por sobreposição com embargo ambiental ativo do IBAMA (MCR 2-9-2)."
              : m1.netArableRatio < 0.15
              ? `Taxa de área agricultável (${(m1.netArableRatio * 100).toFixed(1)}%) inferior ao piso regulatório de 15%.`
              : "Impedimento socioambiental detectado nos cadastros oficiais."}
          </p>
        </div>
      )}
    </div>
  );
};

export default ScoreCard;
