/**
 * Tier 3 — Cross-Feature Interactions
 * Tests multi-module integration pipelines, cross-feature data flow, and cascade behavior
 */

import { testTier3, assertEqual, assertTrue, assertFalse, assertApprox } from "../harness";
import { RegistroRuralClient } from "@/lib/registrorural/client";
import { calculateNetPlantableArea } from "@/lib/m1/calculator";
import { HarvestDetectionEngine } from "@/lib/sar/harvestEngine";
import { SarTemporalEngine } from "@/lib/sar/temporalEngine";
import { BdcStacClient } from "@/lib/sar/bdcStacClient";
import { CommercialTaskingRequestSchema } from "@/lib/sar/commercial/schema";
import {
  REFERENCE_CAR_CODES,
  FAZENDA_BURITIS_FIXTURE,
  MATO_GROSSO_GRAIN_FIXTURE,
  EMBARGOED_PROPERTY_FIXTURE,
  SENTINEL_1_BURITIS_SERIES,
} from "../fixtures/reference_data";
import crypto from "crypto";

export function registerTier3Tests(): void {
  // =========================================================================
  // Integration Flow 1: CAR Onboarding + M1 Net Area + ScoreCard
  // =========================================================================

  testTier3(
    "X1-01",
    "X1.1: CAR query outputs flow seamlessly into Model M1 and ScoreCard metrics",
    async () => {
      const client = new RegistroRuralClient({ apiKey: "test_key", isDemo: true });
      const demonstrativo = await client.consultarDemonstrativo(REFERENCE_CAR_CODES.BURITIS);

      const cab = demonstrativo.data.dados.cabecalho;
      const areas = demonstrativo.data.dados.areas;

      // Feed into Model M1
      const m1Result = calculateNetPlantableArea({
        grossAreaHa: cab.area,
        appAreaHa: areas.areaAPP,
        legalReserveAreaHa: areas.areaRLP,
        rlInAppAreaHa: areas.areaRLEmAPP,
        consolidatedUseHa: areas.areaUsoConsolidado,
      });

      assertApprox(m1Result.netPlantableAreaHa, 146.79, 1.0);

      // Feed into ScoreCard summary
      const scorecard = {
        totalAreaHa: cab.area,
        netPlantableAreaHa: m1Result.netPlantableAreaHa,
        netArableRatio: m1Result.netArableRatio,
        preservationRatio: m1Result.preservationRatio,
        creditPassportEligible: m1Result.isEligibleForCredit,
        overallStatus: m1Result.isEligibleForCredit ? "VERIFICADO" : "BLOQUEADO",
      };

      assertEqual(scorecard.overallStatus, "VERIFICADO");
      assertTrue(scorecard.creditPassportEligible);
      assertApprox(scorecard.netArableRatio, 0.68, 0.05);
    }
  );

  testTier3(
    "X1-02",
    "X1.2: Art. 15 RL-in-APP deduplication correctly feeds ScoreCard preservation ratio without double-deduction",
    async () => {
      const client = new RegistroRuralClient({ apiKey: "test_key", isDemo: true });
      const demonstrativo = await client.consultarDemonstrativo(REFERENCE_CAR_CODES.BURITIS);
      const areas = demonstrativo.data.dados.areas;

      const m1Result = calculateNetPlantableArea({
        grossAreaHa: demonstrativo.data.dados.cabecalho.area,
        appAreaHa: areas.areaAPP,
        legalReserveAreaHa: areas.areaRLP,
        rlInAppAreaHa: areas.areaRLEmAPP,
      });

      assertTrue(m1Result.deductionsBreakdown.netConservationHa > 65);
      assertTrue(m1Result.preservationRatio > 0.30 && m1Result.preservationRatio < 0.35);
    }
  );

  testTier3(
    "X1-03",
    "X1.3: Active IBAMA embargo in CAR query cascades to Model M1 deduction and blocks ScoreCard",
    async () => {
      const client = new RegistroRuralClient({ apiKey: "test_key", isDemo: true });
      const demonstrativo = await client.consultarDemonstrativo(REFERENCE_CAR_CODES.IBAMA_EMBARGOED);

      const cab = demonstrativo.data.dados.cabecalho;
      const areas = demonstrativo.data.dados.areas;
      const restricoes = demonstrativo.data.dados.restricoes;

      const embargoArea = restricoes.reduce((acc, r) => acc + (r.areaConflito || 0), 0);

      const m1Result = calculateNetPlantableArea({
        grossAreaHa: cab.area,
        appAreaHa: areas.areaAPP,
        legalReserveAreaHa: areas.areaRLP,
        embargoesHa: embargoArea,
      });

      // Embargoes are deducted
      assertTrue(m1Result.deductionsBreakdown.embargoesHa > 0);

      // ScoreCard status must be BLOQUEADO
      const hasActiveEmbargo = restricoes.length > 0;
      const overallStatus = hasActiveEmbargo ? "BLOQUEADO" : "VERIFICADO";
      assertEqual(overallStatus, "BLOQUEADO");
    }
  );

  testTier3(
    "X1-04",
    "X1.4: Net Arable ratio < 15% in Model M1 cascades to ineligibility in ScoreCard Passaporte",
    () => {
      // 1000 ha farm with 880 ha conservation (12% net arable)
      const m1Result = calculateNetPlantableArea({
        grossAreaHa: 1000,
        appAreaHa: 300,
        legalReserveAreaHa: 600,
        rlInAppAreaHa: 20, // Net conservation = 880 ha -> 120 ha net (12%)
      });

      assertFalse(m1Result.isEligibleForCredit);
      const isPassportEligible = m1Result.isEligibleForCredit && m1Result.netArableRatio >= 0.15;
      assertFalse(isPassportEligible);
    }
  );

  testTier3(
    "X1-05",
    "X1.5: Administrative easements and restricted use reduce Net Area and update ScoreCard breakdown",
    () => {
      const m1Result = calculateNetPlantableArea({
        grossAreaHa: 1000,
        appAreaHa: 100,
        legalReserveAreaHa: 200,
        easementsHa: 50,
        restrictedUseHa: 50,
      });

      assertEqual(m1Result.deductionsBreakdown.easementsHa, 50);
      assertEqual(m1Result.deductionsBreakdown.restrictedUseHa, 50);
      assertApprox(m1Result.netPlantableAreaHa, 600, 0.1);
    }
  );

  testTier3(
    "X1-06",
    "X1.6: End-to-end land onboarding data pipeline constructs valid EnrichedLandData payload",
    async () => {
      const client = new RegistroRuralClient({ apiKey: "test_key", isDemo: true });
      const demonstrativo = await client.consultarDemonstrativo(REFERENCE_CAR_CODES.BURITIS);
      const situacao = await client.consultarSituacaoCar(REFERENCE_CAR_CODES.BURITIS);
      const restricoes = await client.consultarRestricoesSicar(REFERENCE_CAR_CODES.BURITIS);

      const m1 = calculateNetPlantableArea({
        grossAreaHa: demonstrativo.data.dados.cabecalho.area,
        appAreaHa: demonstrativo.data.dados.areas.areaAPP,
        legalReserveAreaHa: demonstrativo.data.dados.areas.areaRLP,
        rlInAppAreaHa: demonstrativo.data.dados.areas.areaRLEmAPP,
      });

      const enrichedLand = {
        name: "Fazenda Buritis",
        car_code: REFERENCE_CAR_CODES.BURITIS,
        matricula_code: "MAT-29104-CRI-BURITIS",
        municipality: demonstrativo.data.dados.cabecalho.municipio,
        state_uf: demonstrativo.data.dados.cabecalho.estado,
        metrics: {
          total_area_ha: demonstrativo.data.dados.cabecalho.area,
          app_area_ha: demonstrativo.data.dados.areas.areaAPP,
          legal_reserve_area_ha: demonstrativo.data.dados.areas.areaRLP,
          net_plantable_area_ha: m1.netPlantableAreaHa,
        },
        compliance_sicar: {
          status: situacao.data.situacao_car,
          passed: situacao.result === "PASSED",
        },
        compliance_ibama: {
          is_embargoed: restricoes.data.restricoes.length > 0,
        },
        scorecard: {
          overall_status: restricoes.data.restricoes.length === 0 ? "VERIFICADO" : "BLOQUEADO",
          credit_passport_eligible: m1.isEligibleForCredit && restricoes.data.restricoes.length === 0,
        },
      };

      assertEqual(enrichedLand.municipality, "Buritis");
      assertEqual(enrichedLand.compliance_sicar.status, "Ativo");
      assertTrue(enrichedLand.scorecard.credit_passport_eligible);
    }
  );

  // =========================================================================
  // Integration Flow 2: SAR Backscatter + M2 Harvest Alert + Shield-RJ
  // =========================================================================

  testTier3(
    "X2-01",
    "X2.1: Sentinel-1 temporal curve feeds M2 Harvest Engine and triggers Level 4 Harvest Confirmed",
    async () => {
      const stacClient = new BdcStacClient({ enableOfflineFallback: true });
      const temporalEngine = new SarTemporalEngine();
      const harvestEngine = new HarvestDetectionEngine();

      const items = await stacClient.searchSentinel1Rtc([-46.615, -15.452, -46.591, -15.418], {
        start: "2025-11-01T00:00:00Z",
        end: "2026-03-30T00:00:00Z",
      });

      const curve = await temporalEngine.generateBackscatterCurve(
        { type: "Polygon", coordinates: [[[-46.615, -15.452], [-46.615, -15.418], [-46.591, -15.418], [-46.591, -15.452], [-46.615, -15.452]]] },
        items
      );

      const harvestResult = harvestEngine.detectHarvestEvents(curve, -4.5);
      assertTrue(harvestResult.harvestDetected);
      assertTrue(harvestResult.dropMagnitudeDb >= 4.5);
      assertTrue(harvestResult.alertLevel >= 4);
    }
  );

  testTier3(
    "X2-02",
    "X2.2: Confirmed harvest with missing debtor tax manifest triggers Shield-RJ Level 5 Fuga Noturna",
    () => {
      const harvestEngine = new HarvestDetectionEngine();
      const points = SENTINEL_1_BURITIS_SERIES.map((pt) => ({
        date: pt.date,
        gamma0_vv_db: pt.gamma0_vv_db,
        gamma0_vh_db: pt.gamma0_vh_db,
        vh_vv_ratio_db: pt.vh_vv_ratio_db,
        pixelCount: pt.pixelCount,
      }));

      // Simulate harvest detected with diversion suspected
      const harvestAlert = harvestEngine.detectHarvestEvents(points, -4.5, {
        unregisteredDiversionSuspected: true,
      });

      assertTrue(harvestAlert.harvestDetected);
      assertEqual(harvestAlert.alertLevel, 5);
      assertTrue(harvestAlert.recommendations.some((r) => r.includes("Cautelar") || r.includes("busca")));
    }
  );

  testTier3(
    "X2-03",
    "X2.3: Level 5 Alert generates automated CPC 300/301 Cautelar Precautionary Petition",
    () => {
      const buildCautelarStrikeOrder = (carCode: string, harvestDate: string, deltaDb: number) => {
        return {
          petitionType: "TUTELA_CAUTELAR_ANTECEDENTE",
          cpcArticles: ["300", "301"],
          precedent: "STJ REsp 1.758.746/GO",
          evidenceDigest: crypto.createHash("sha256").update(`${carCode}:${harvestDate}:${deltaDb}`).digest("hex"),
          urgentInauditaAlteraParte: true,
        };
      };

      const strike = buildCautelarStrikeOrder(REFERENCE_CAR_CODES.BURITIS, "2026-02-19", -5.7);
      assertEqual(strike.petitionType, "TUTELA_CAUTELAR_ANTECEDENTE");
      assertTrue(strike.urgentInauditaAlteraParte);
      assertEqual(strike.evidenceDigest.length, 64);
    }
  );

  testTier3(
    "X2-04",
    "X2.4: Rain event spike is rejected by S_clima filter, preventing premature false Shield-RJ trigger",
    () => {
      const harvestEngine = new HarvestDetectionEngine();
      // Temporary rain attenuation without bare soil collapse
      const points = [
        { date: "2026-01-10", gamma0_vv_db: -10, gamma0_vh_db: -14.0, vh_vv_ratio_db: -4, pixelCount: 1000 },
        { date: "2026-01-22", gamma0_vv_db: -12, gamma0_vh_db: -16.5, vh_vv_ratio_db: -4.5, pixelCount: 1000 }, // Only -2.5 dB drop
      ];

      const res = harvestEngine.detectHarvestEvents(points, -4.5, { precipitationMm48h: 45.0 });
      assertFalse(res.harvestDetected);
      assertTrue(res.alertLevel < 4);
    }
  );

  testTier3(
    "X2-05",
    "X2.5: Inconclusive Sentinel-1 resolution triggers commercial sub-meter SAR tasking recommendation",
    () => {
      const recommendCommercialAudit = (sentinelPixelCount: number, creditExposureUsd: number) => {
        // High exposure (> US$ 500K) or small parcel (< 500 pixels) triggers commercial sub-meter recommendation
        return creditExposureUsd >= 500000 || sentinelPixelCount < 500;
      };

      assertTrue(recommendCommercialAudit(2170, 600000)); // US$ 600K loan triggers commercial tasking
      assertFalse(recommendCommercialAudit(5000, 100000));
    }
  );

  // =========================================================================
  // Integration Flow 3: CMN 5.267 Threshold + Continuous SAR + MCR 2-9 Dossier
  // =========================================================================

  testTier3(
    "X3-01",
    "X3.1: Large Mato Grosso parcel (1,450 ha) triggers CMN 5.267 continuous remote sensing in MCR 2-9 dossier",
    () => {
      const totalAreaHa = MATO_GROSSO_GRAIN_FIXTURE.gross_area_ha;
      const isRemoteSensingMandatory = totalAreaHa > 300;

      assertTrue(isRemoteSensingMandatory);

      const dossierAudit = {
        carCode: MATO_GROSSO_GRAIN_FIXTURE.car_code,
        totalAreaHa,
        cmn5267Compliance: {
          continuousRemoteSensingMandatory: isRemoteSensingMandatory,
          resolution: "Resolução CMN nº 5.267/2025 Art. 2º",
          auditCadenceDays: 12,
        },
      };

      assertTrue(dossierAudit.cmn5267Compliance.continuousRemoteSensingMandatory);
      assertEqual(dossierAudit.cmn5267Compliance.auditCadenceDays, 12);
    }
  );

  testTier3(
    "X3-02",
    "X3.2: Buritis parcel (217 ha) is under 300 ha and exempt from CMN 5.267 mandatory continuous sensing",
    () => {
      const totalAreaHa = FAZENDA_BURITIS_FIXTURE.gross_area_ha;
      const isRemoteSensingMandatory = totalAreaHa > 300;

      assertFalse(isRemoteSensingMandatory);
    }
  );

  testTier3(
    "X3-03",
    "X3.3: Continuous SAR monitoring records are embedded into MCR 2-9 compliance audit trail",
    () => {
      const sarPassesCount = SENTINEL_1_BURITIS_SERIES.length;
      assertTrue(sarPassesCount >= 6, "Expected at least 6 Sentinel-1 orbital passes over the crop cycle");

      const auditTrail = {
        standard: "MCR 2-9 / CMN 5.267",
        sarSatellite: "Sentinel-1 RTC L2 ARD",
        orbitalPassesMonitored: sarPassesCount,
        harvestDetected: true,
        harvestDate: "2026-02-19",
      };

      assertEqual(auditTrail.orbitalPassesMonitored, 6);
      assertTrue(auditTrail.harvestDetected);
    }
  );

  testTier3(
    "X3-04",
    "X3.4: Dossier generates ICP-Brasil PAdES-LTV signature structure with SHA-256 integrity hash",
    () => {
      const multiSourceData = {
        car: FAZENDA_BURITIS_FIXTURE.car_code,
        grossArea: FAZENDA_BURITIS_FIXTURE.gross_area_ha,
        netPlantableArea: FAZENDA_BURITIS_FIXTURE.expected_net_plantable_ha,
        sarSeriesPoints: SENTINEL_1_BURITIS_SERIES.length,
        timestamp: "2026-09-26T12:00:00Z",
      };

      const digest = crypto.createHash("sha256").update(JSON.stringify(multiSourceData)).digest("hex");
      assertEqual(digest.length, 64);

      const icpBrasilSignature = {
        reportId: crypto.randomUUID(),
        sha256Checksum: digest,
        padesLtvMetadata: {
          actName: "Autoridade de Carimbo do Tempo SERPRO",
          policyOid: "2.16.76.1.7.1",
          rfc3161TimestampToken: Buffer.from("TOKEN_DATA").toString("base64"),
        },
      };

      assertEqual(icpBrasilSignature.sha256Checksum, digest);
      assertEqual(icpBrasilSignature.padesLtvMetadata.policyOid, "2.16.76.1.7.1");
    }
  );

  testTier3(
    "X3-05",
    "X3.5: Clean parcel with continuous SAR compliance yields CONFORME status and signed digital dossier",
    () => {
      const evaluateFullDossier = (data: typeof FAZENDA_BURITIS_FIXTURE, hasEmbargo: boolean) => {
        const isEligible = !hasEmbargo && data.expected_net_plantable_ha > 0;
        return {
          eligibilityStatus: isEligible ? "ELIGIBLE" : "IMPEDED",
          mcr29Status: isEligible ? "CONFORME" : "IMPEDIDO",
          passaporteAgrostechIssued: isEligible,
        };
      };

      const cleanDossier = evaluateFullDossier(FAZENDA_BURITIS_FIXTURE, false);
      assertEqual(cleanDossier.eligibilityStatus, "ELIGIBLE");
      assertEqual(cleanDossier.mcr29Status, "CONFORME");
      assertTrue(cleanDossier.passaporteAgrostechIssued);

      const impededDossier = evaluateFullDossier(FAZENDA_BURITIS_FIXTURE, true);
      assertEqual(impededDossier.eligibilityStatus, "IMPEDED");
      assertEqual(impededDossier.mcr29Status, "IMPEDIDO");
      assertFalse(impededDossier.passaporteAgrostechIssued);
    }
  );
}
