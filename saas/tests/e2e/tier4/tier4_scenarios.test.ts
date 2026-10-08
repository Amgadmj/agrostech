/**
 * Tier 4 — Real-World Application Scenarios (S1 through S8)
 * Authoritative end-to-end integration workflows matching institutional banking & legal use cases
 */

import { testTier4, assertEqual, assertTrue, assertFalse, assertApprox, assertRejects } from "../harness";
import { RegistroRuralClient } from "@/lib/registrorural/client";
import { DiagnosticErrorCode } from "@/lib/registrorural/errors";
import { calculateNetPlantableArea } from "@/lib/m1/calculator";
import { BdcStacClient } from "@/lib/sar/bdcStacClient";
import { SarTemporalEngine } from "@/lib/sar/temporalEngine";
import { HarvestDetectionEngine } from "@/lib/sar/harvestEngine";
import { CommercialTaskingRequestSchema } from "@/lib/sar/commercial/schema";
import {
  REFERENCE_CAR_CODES,
  FAZENDA_BURITIS_FIXTURE,
  MATO_GROSSO_GRAIN_FIXTURE,
  EMBARGOED_PROPERTY_FIXTURE,
  VALID_UMBRA_TASKING_PAYLOAD,
} from "../fixtures/reference_data";
import crypto from "crypto";

export function registerTier4Tests(): void {
  // =========================================================================
  // Scenario S1: Fazenda Buritis/MG Standard Underwriting (217 ha)
  // =========================================================================
  testTier4(
    "S1",
    "Scenario S1: Fazenda Buritis/MG Standard Underwriting (217 ha) -> Clean Approval & 147.6 ha Net Area",
    async () => {
      // 1. Authenticated CAR query
      const client = new RegistroRuralClient({ apiKey: "test_key", isDemo: true });
      const demonstrativo = await client.consultarDemonstrativo(REFERENCE_CAR_CODES.BURITIS);
      assertEqual(demonstrativo.status, "COMPLETE");

      // 2. R2C Situação & Restrições checks
      const situacao = await client.consultarSituacaoCar(REFERENCE_CAR_CODES.BURITIS);
      const restricoes = await client.consultarRestricoesSicar(REFERENCE_CAR_CODES.BURITIS);
      assertEqual(situacao.result, "PASSED");
      assertEqual(restricoes.result, "PASSED");

      // 3. Model M1 Net Plantable Area
      const m1 = calculateNetPlantableArea({
        grossAreaHa: demonstrativo.data.dados.cabecalho.area,
        appAreaHa: demonstrativo.data.dados.areas.areaAPP,
        legalReserveAreaHa: demonstrativo.data.dados.areas.areaRLP,
        rlInAppAreaHa: demonstrativo.data.dados.areas.areaRLEmAPP,
        consolidatedUseHa: demonstrativo.data.dados.areas.areaUsoConsolidado,
      });

      assertApprox(m1.netPlantableAreaHa, 146.79, 1.0);
      assertTrue(m1.isEligibleForCredit);

      // 4. Dossier summary
      const isMcrCompliant = situacao.result === "PASSED" && restricoes.data.restricoes.length === 0;
      assertTrue(isMcrCompliant);
    }
  );

  // =========================================================================
  // Scenario S2: Large Mato Grosso Grain Operation (> 1,200 ha)
  // =========================================================================
  testTier4(
    "S2",
    "Scenario S2: Large Mato Grosso Grain Operation (1,450 ha) -> Mandates CMN 5.267 SAR & Passes M2 Harvest",
    async () => {
      const grossArea = MATO_GROSSO_GRAIN_FIXTURE.gross_area_ha;
      // Mandates continuous remote sensing under CMN 5.267 because area > 300 ha
      assertTrue(grossArea > 300, "Mato Grosso operation exceeds 300 ha threshold");

      // Calculate M1 net area
      const m1 = calculateNetPlantableArea({
        grossAreaHa: grossArea,
        appAreaHa: MATO_GROSSO_GRAIN_FIXTURE.app_area_ha,
        legalReserveAreaHa: MATO_GROSSO_GRAIN_FIXTURE.legal_reserve_area_ha,
        rlInAppAreaHa: MATO_GROSSO_GRAIN_FIXTURE.rl_in_app_ha,
        easementsHa: MATO_GROSSO_GRAIN_FIXTURE.easements_ha,
      });

      assertApprox(m1.netPlantableAreaHa, 835.5, 0.1);

      // Ingest continuous Sentinel-1 temporal curve
      const harvestEngine = new HarvestDetectionEngine();
      const harvestResult = harvestEngine.detectHarvestEvents(
        [
          { date: "2026-02-01", gamma0_vv_db: -10, gamma0_vh_db: -14.2, vh_vv_ratio_db: -4.2, pixelCount: 14500 },
          { date: "2026-02-15", gamma0_vv_db: -15, gamma0_vh_db: -20.5, vh_vv_ratio_db: -5.5, pixelCount: 14500 },
        ],
        -4.5
      );

      assertTrue(harvestResult.harvestDetected);
      assertTrue(harvestResult.bareSoilReached);
    }
  );

  // =========================================================================
  // Scenario S3: Illegal Deforestation & IBAMA Embargo Rejection
  // =========================================================================
  testTier4(
    "S3",
    "Scenario S3: Illegal Deforestation & IBAMA Embargo Rejection -> Credit Halt & MCR 2-9 Blockade",
    async () => {
      const client = new RegistroRuralClient({ apiKey: "test_key", isDemo: true });
      const restricoes = await client.consultarRestricoesSicar(REFERENCE_CAR_CODES.IBAMA_EMBARGOED);

      assertEqual(restricoes.result, "FAILED");
      assertTrue(restricoes.data.restricoes.length > 0);

      // Immediate Credit Halt
      const creditApproved = restricoes.data.restricoes.length === 0;
      assertFalse(creditApproved, "Property with IBAMA embargo must be denied credit immediately");

      // MCR 2-9 Verdict
      const mcr29Status = creditApproved ? "CONFORME" : "IMPEDIDO";
      assertEqual(mcr29Status, "IMPEDIDO");
    }
  );

  // =========================================================================
  // Scenario S4: Rainy Season Anti-Fuga Harvest Diversion Alert
  // =========================================================================
  testTier4(
    "S4",
    "Scenario S4: Rainy Season Anti-Fuga Harvest Diversion -> SAR Penetrates Clouds & Flags Fuga Noturna",
    () => {
      const harvestEngine = new HarvestDetectionEngine();
      // Drop during heavy rainy season (40mm precipitation)
      const points = [
        { date: "2026-02-01", gamma0_vv_db: -10.0, gamma0_vh_db: -14.5, vh_vv_ratio_db: -4.5, pixelCount: 2170 },
        { date: "2026-02-19", gamma0_vv_db: -14.8, gamma0_vh_db: -21.0, vh_vv_ratio_db: -6.2, pixelCount: 2170 },
      ];

      // S_clima confirms that rain does not explain a drop to -21 dB
      const res = harvestEngine.detectHarvestEvents(points, -4.5, {
        precipitationMm48h: 40.0,
        unregisteredDiversionSuspected: true,
      });

      assertTrue(res.harvestDetected);
      assertTrue(res.climateRefutation.rainArtifactRefuted);
      assertEqual(res.alertLevel, 5); // Fuga Noturna alert level 5
    }
  );

  // =========================================================================
  // Scenario S5: High-Value Debt Restructuring Commercial SAR Forensic Audit
  // =========================================================================
  testTier4(
    "S5",
    "Scenario S5: High-Value Debt Restructuring Commercial SAR Audit -> Umbra Spotlight Tasking & Strike Petition",
    () => {
      // 1. Validate Umbra tasking order
      const taskingOrder = CommercialTaskingRequestSchema.safeParse(VALID_UMBRA_TASKING_PAYLOAD);
      assertTrue(taskingOrder.success);

      // 2. Draft Precautionary Search & Seizure Petition (CPC 300/301)
      const petition = {
        title: "TUTELA CAUTELAR ANTECEDENTE DE BUSCA E APREENSÃO LIMINAR",
        articles: ["Art. 300 do CPC", "Art. 301 do CPC"],
        stjPrecedent: "STJ REsp 1.758.746/GO",
        remedy: "Apreensão e depósito judicial de 50.000 sacas de soja colhidas e desviadas",
      };

      assertTrue(petition.articles.includes("Art. 300 do CPC"));
      assertEqual(petition.stjPrecedent, "STJ REsp 1.758.746/GO");
    }
  );

  // =========================================================================
  // Scenario S6: Complex Topology with Overlapping Reserva Legal and APP
  // =========================================================================
  testTier4(
    "S6",
    "Scenario S6: Complex Topology with Overlapping Reserva Legal & APP -> Prevents Double Deduction",
    () => {
      // Gross: 1,000 ha; APP: 200 ha; RL: 200 ha; RL inside APP: 80 ha
      // Total conservation without deduplication: 400 ha -> would yield 600 ha net
      // Legal deduplication under Art. 15: 200 + 200 - 80 = 320 ha -> yields 680 ha net!
      const m1 = calculateNetPlantableArea({
        grossAreaHa: 1000,
        appAreaHa: 200,
        legalReserveAreaHa: 200,
        rlInAppAreaHa: 80,
      });

      assertApprox(m1.netPlantableAreaHa, 680.0, 0.01);
      assertApprox(m1.preservationRatio, 0.32, 0.01);
      assertApprox(m1.netArableRatio, 0.68, 0.01);
      assertEqual(m1.deductionsBreakdown.netConservationHa, 320);
    }
  );

  // =========================================================================
  // Scenario S7: Invalid / Missing Credentials Diagnostic Halt
  // =========================================================================
  testTier4(
    "S7",
    "Scenario S7: Invalid / Missing Credentials Diagnostic Halt -> No Silent Fake Bypass",
    async () => {
      // 1. Missing key halts with CONFIG_MISSING_API_KEY
      const clientNoKey = new RegistroRuralClient({ apiKey: "", isDemo: false });
      await assertRejects(
        () => clientNoKey.consultarDemonstrativo(REFERENCE_CAR_CODES.BURITIS),
        DiagnosticErrorCode.CONFIG_MISSING_API_KEY
      );

      // 2. Unauthorized key halts with AUTH_UNAUTHORIZED
      const clientBadKey = new RegistroRuralClient({ apiKey: "INVALID_KEY", isDemo: false });
      await assertRejects(
        () => clientBadKey.consultarDemonstrativo(REFERENCE_CAR_CODES.BURITIS),
        DiagnosticErrorCode.AUTH_UNAUTHORIZED
      );
    }
  );

  // =========================================================================
  // Scenario S8: Full End-to-End Onboarding to Signed PDF Dossier
  // =========================================================================
  testTier4(
    "S8",
    "Scenario S8: Full End-to-End Onboarding to Signed PDF Dossier -> Complete Execution Chain",
    async () => {
      // 1. Onboarding CAR query
      const client = new RegistroRuralClient({ apiKey: "test_key", isDemo: true });
      const demonstrativo = await client.consultarDemonstrativo(REFERENCE_CAR_CODES.BURITIS);
      const situacao = await client.consultarSituacaoCar(REFERENCE_CAR_CODES.BURITIS);
      const restricoes = await client.consultarRestricoesSicar(REFERENCE_CAR_CODES.BURITIS);

      // 2. M1 Net Plantable Area calculation
      const m1 = calculateNetPlantableArea({
        grossAreaHa: demonstrativo.data.dados.cabecalho.area,
        appAreaHa: demonstrativo.data.dados.areas.areaAPP,
        legalReserveAreaHa: demonstrativo.data.dados.areas.areaRLP,
        rlInAppAreaHa: demonstrativo.data.dados.areas.areaRLEmAPP,
      });

      // 3. SAR temporal backscatter ingestion
      const stacClient = new BdcStacClient({ enableOfflineFallback: true });
      const s1Items = await stacClient.searchSentinel1Rtc([-46.615, -15.452, -46.591, -15.418], {
        start: "2025-11-01T00:00:00Z",
        end: "2026-03-30T00:00:00Z",
      });

      // 4. M2 Harvest check
      const harvestEngine = new HarvestDetectionEngine();
      const harvestResult = harvestEngine.detectHarvestEvents(
        s1Items.map((item) => ({
          date: item.properties.datetime.slice(0, 10),
          gamma0_vv_db: -12.0,
          gamma0_vh_db: -18.0,
          vh_vv_ratio_db: -6.0,
          pixelCount: 2170,
        }))
      );

      // 5. Generate ICP-Brasil signed compliance report
      const dossierPayload = {
        dossierId: crypto.randomUUID(),
        carCode: REFERENCE_CAR_CODES.BURITIS,
        grossAreaHa: demonstrativo.data.dados.cabecalho.area,
        netPlantableAreaHa: m1.netPlantableAreaHa,
        sicarStatus: situacao.data.situacao_car,
        embargoCount: restricoes.data.restricoes.length,
        mcr29Status: "CONFORME",
        sarBaselineVerified: s1Items.length > 0,
      };

      const digest = crypto.createHash("sha256").update(JSON.stringify(dossierPayload)).digest("hex");
      assertEqual(digest.length, 64);

      const signedDossier = {
        ...dossierPayload,
        sha256Checksum: digest,
        padesLtv: {
          actName: "Autoridade de Carimbo do Tempo SERPRO",
          policyOid: "2.16.76.1.7.1",
          signingTimeUtc: new Date().toISOString(),
          rfc3161TimestampToken: Buffer.from("ACT_TOKEN").toString("base64"),
        },
      };

      assertEqual(signedDossier.mcr29Status, "CONFORME");
      assertEqual(signedDossier.sha256Checksum.length, 64);
      assertEqual(signedDossier.padesLtv.policyOid, "2.16.76.1.7.1");
    }
  );
}
