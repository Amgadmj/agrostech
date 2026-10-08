/**
 * Model M1 Net Plantable Area (Área Útil Líquida - AUL) Calculation Engine
 *
 * Implements the official SFB & BCB Resolução CMN nº 5.267/2025 (MCR 2-9)
 * mathematical formula with conservation deduplication under Art. 15 Law 12.651/2012.
 */

import { ModelM1Input, ModelM1Output, DeductionsBreakdown } from "./types";
import { SicarAreas, SicarCabecalho, SicarRestricao } from "../registrorural/types";

/**
 * Calculates the exact Net Plantable Area (Área Útil Líquida)
 *
 * Formula:
 * A_net = max(0, A_gross - (A_APP + A_RL - A_RLEmAPP + A_servidao + A_restrito + A_disputa + A_conflito + A_embargo))
 */
export function calculateNetPlantableArea(input: ModelM1Input): ModelM1Output {
  const grossArea = Math.max(0, input.grossAreaHa || 0);
  const appArea = Math.max(0, input.appAreaHa || 0);
  const legalReserveArea = Math.max(0, input.legalReserveAreaHa || 0);
  const rlInAppOverlap = Math.max(0, input.rlInAppAreaHa || 0);

  const easements = Math.max(0, input.easementsHa || 0);
  const restrictedUse = Math.max(0, input.restrictedUseHa || 0);
  const disputedArea = Math.max(0, input.disputedAreaHa || 0);
  const publicOverlaps = Math.max(0, input.publicOverlapsHa || 0);
  const embargoes = Math.max(0, input.embargoesHa || 0);

  // Step 1: Conservation Area Deduplication (Art. 15 Lei 12.651/2012)
  // RL within APP must not be double-deducted
  const netConservationArea = Math.max(
    0,
    appArea + legalReserveArea - Math.min(rlInAppOverlap, Math.min(appArea, legalReserveArea))
  );

  // Step 2: Total Statutory Exclusions (with overlap deduplication)
  const exclusionOverlaps = Math.max(0, input.exclusionOverlapsHa || 0);
  const totalDeductions = Math.max(
    0,
    netConservationArea +
    easements +
    restrictedUse +
    disputedArea +
    publicOverlaps +
    embargoes -
    exclusionOverlaps
  );

  // Step 3: Deductive Net Plantable Area
  const deductiveNet = Math.max(0, grossArea - totalDeductions);

  // Step 4: Consolidated Land Cross-Verification
  let finalNet = deductiveNet;
  if (
    typeof input.consolidatedUseHa === "number" &&
    input.consolidatedUseHa > 0
  ) {
    const appRestore = Math.max(0, input.appRestorationHa || 0);
    const rlRestore = Math.max(0, input.rlRestorationHa || 0);
    const consolidatedNet = Math.max(
      0,
      input.consolidatedUseHa - appRestore - rlRestore
    );
    finalNet = Math.min(deductiveNet, consolidatedNet);
  }

  const roundedNetHa = Number(finalNet.toFixed(2));
  const roundedGrossHa = Number(grossArea.toFixed(2));

  // Step 5: Metrics & Ratios
  const preservationRatio =
    roundedGrossHa > 0
      ? Number((netConservationArea / roundedGrossHa).toFixed(4))
      : 0;

  const netArableRatio =
    roundedGrossHa > 0
      ? Number((roundedNetHa / roundedGrossHa).toFixed(4))
      : 0;

  // Step 6: Credit Eligibility & Blockades (BCB Resolução CMN 5.267/2025 & MCR 2-9)
  const creditBlockReasons: string[] = [];
  const recommendations: string[] = [];

  // Check 1: Zero or negative plantable area
  if (roundedNetHa <= 0) {
    creditBlockReasons.push(
      "Propriedade sem área útil plantável (100% de preservação ambiental ou passivo territorial)."
    );
  }

  // Check 2: Active Environmental Embargoes
  if (embargoes > 0) {
    creditBlockReasons.push(
      `Sobreposição com ${embargoes.toFixed(
        2
      )} ha de embargo ambiental ativo (IBAMA/Órgão Estadual). Bloqueio obrigatório MCR 2-9.`
    );
  }

  // Check 3: Protected Land Overlaps (Indigenous, Conservation Units, Settlements)
  if (
    publicOverlaps > 0 ||
    input.hasIndigenousOverlap ||
    input.hasConservationUnitOverlap
  ) {
    creditBlockReasons.push(
      "Sobreposição territorial com Terras Indígenas (TI), Unidade de Conservação Integral ou Assentamentos."
    );
  }

  // Check 4: CAR Status Irregularity
  if (
    input.carStatus &&
    (input.carStatus === "Suspenso" || input.carStatus === "Cancelado")
  ) {
    creditBlockReasons.push(
      `Cadastro Ambiental Rural com status irregular (${input.carStatus}). Crédito rural proibido.`
    );
  }

  // Check 5: Extremely low plantability threshold
  if (roundedNetHa > 0 && netArableRatio < 0.15) {
    creditBlockReasons.push(
      `Taxa de plantabilidade crítica (${(netArableRatio * 100).toFixed(
        1
      )}% < 15%). Inelegível para custeio agrícola padrão.`
    );
  }

  const isEligibleForCredit = creditBlockReasons.length === 0 && roundedNetHa > 0;

  // CMN 5.267/2025 mandate: Properties > 300 ha require continuous remote sensing orbital monitoring
  const continuousMonitoringMandatory = roundedGrossHa > 300;

  // Populate Recommendations
  if (isEligibleForCredit) {
    recommendations.push(
      "Propriedade 100% elegível para linhas de Crédito Rural Verde (Plano Safra / CRA Verde)."
    );
    recommendations.push(
      "Área útil líquida certificada para emissão de Cédula de Produto Rural (CPR) física ou financeira."
    );
    if (continuousMonitoringMandatory) {
      recommendations.push(
        "Área superior a 300 ha: enquadramento obrigatório no Radar de Sensoriamento Remoto Orbital Contínuo (Res. CMN 5.267/2025)."
      );
    }
  } else {
    if (embargoes > 0) {
      recommendations.push(
        "Regularizar termo de embargo junto ao IBAMA ou solicitar desmembramento da gleba embargada antes do pleito de crédito."
      );
    }
    if (roundedNetHa <= 0) {
      recommendations.push(
        "Avaliar enquadramento em Pagamento por Serviços Ambientais (PSA) ou geração de Créditos de Carbono Florestal."
      );
    }
  }

  const deductionsBreakdown: DeductionsBreakdown = {
    appHa: Number(appArea.toFixed(2)),
    legalReserveHa: Number(legalReserveArea.toFixed(2)),
    rlInAppOverlapHa: Number(rlInAppOverlap.toFixed(2)),
    netConservationHa: Number(netConservationArea.toFixed(2)),
    easementsHa: Number(easements.toFixed(2)),
    restrictedUseHa: Number(restrictedUse.toFixed(2)),
    disputedAreaHa: Number(disputedArea.toFixed(2)),
    publicConflictsHa: Number(publicOverlaps.toFixed(2)),
    embargoesHa: Number(embargoes.toFixed(2)),
    totalDeductionsHa: Number(totalDeductions.toFixed(2)),
  };

  return {
    grossAreaHa: roundedGrossHa,
    cadastralGrossAreaHa: input.cadastralGrossAreaHa ?? roundedGrossHa,
    measuredGeometryGrossAreaHa: input.measuredGeometryGrossAreaHa ?? roundedGrossHa,
    financedOperationAreaHa: input.financedOperationAreaHa,
    estimatedUsableAreaHa: roundedNetHa, // C02: explicitly named estimated usable area
    netPlantableAreaHa: roundedNetHa,
    preservationRatio,
    netArableRatio,
    deductionsBreakdown,
    exclusionPolicyVersion: "v1.2-art15-dedup",
    isEligibleForCredit,
    continuousMonitoringMandatory,
    creditBlockReasons,
    recommendations,
  };
}

/**
 * Helper to calculate Model M1 directly from a hydrated SICAR demonstrativo data node
 */
export function calculateModelM1FromSicar(dados: {
  cabecalho: SicarCabecalho;
  areas: SicarAreas;
  restricoes?: SicarRestricao[];
  temTI?: boolean;
}): ModelM1Output {
  const { cabecalho, areas, restricoes } = dados;

  // Compute total embargo area from restrictions
  let embargoArea = 0;
  if (Array.isArray(restricoes)) {
    for (const r of restricoes) {
      if (
        r.origem?.toLowerCase().includes("embargo") ||
        r.descricao?.toLowerCase().includes("embargo") ||
        r.descricao?.toLowerCase().includes("infração") ||
        r.descricao?.toLowerCase().includes("infracao")
      ) {
        embargoArea += r.areaConflito || 0;
      }
    }
  }

  const publicConflicts =
    (areas.areaSobreposicaoTI || 0) +
    (areas.areaSobreposicaoUC || 0) +
    (areas.areaSobreposicaoAssentamento || 0);

  const legalReserveHa = Math.max(
    areas.areaRLP || 0,
    areas.areaRLA || 0,
    areas.areaRLDeclarada || 0
  );

  return calculateNetPlantableArea({
    grossAreaHa: cabecalho.area,
    appAreaHa: areas.areaAPP || 0,
    legalReserveAreaHa: legalReserveHa,
    rlInAppAreaHa: areas.areaRLEmAPP || 0,
    easementsHa: areas.areaServidaoAdministrativa || 0,
    restrictedUseHa: areas.areaUsoRestrito || 0,
    disputedAreaHa: areas.areaSobreposicaoOutrosImoveis || 0,
    publicOverlapsHa: publicConflicts,
    embargoesHa: embargoArea,
    consolidatedUseHa: areas.areaUsoConsolidado || 0,
    appRestorationHa: areas.areaAPPRecompor || 0,
    rlRestorationHa: areas.areaRLRecompor || 0,
    carStatus: cabecalho.statusImovel,
    hasIndigenousOverlap:
      dados.temTI || (areas.areaSobreposicaoTI || 0) > 0,
    hasConservationUnitOverlap: (areas.areaSobreposicaoUC || 0) > 0,
  });
}
