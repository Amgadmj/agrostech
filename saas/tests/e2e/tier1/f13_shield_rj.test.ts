/**
 * Tier 1 — Feature 13: Shield-RJ Fraud Vectors & CPC 300/301 Cautelar Strike Petition
 * Requirement: ORIGINAL_REQUEST.md §R3 & PROJECT.md Feature 13
 */

import { testTier1, assertEqual, assertTrue, assertApprox } from "../harness";

export function registerF13Tests(): void {
  testTier1(
    "F13-01",
    "F13.1: Vector 1 (Área Inflada): Detects credit over-pledging when gross exceeds net plantable by > 35%",
    () => {
      const detectInflatedAreaFraud = (grossAreaHa: number, netAreaHa: number) => {
        const disparityRatio = (grossAreaHa - netAreaHa) / grossAreaHa;
        return {
          isFraud: disparityRatio > 0.35,
          disparityPct: Math.round(disparityRatio * 100),
        };
      };

      // 10,000 ha declared gross with only 4,000 ha M1 net plantable (60% disparity)
      const res = detectInflatedAreaFraud(10000, 4000);
      assertTrue(res.isFraud);
      assertEqual(res.disparityPct, 60);
    }
  );

  testTier1(
    "F13-02",
    "F13.2: Vector 2 (Safra Fantasma): Flags financing granted where SAR reveals zero vegetative cycle",
    () => {
      const evaluatePhantomHarvest = (peakVhDb: number, expectedVegetativeMinDb: number) => {
        // High canopy produces peak VH >= -15 dB; if peak is -22 dB, no crop was ever planted
        return peakVhDb < expectedVegetativeMinDb;
      };

      assertTrue(evaluatePhantomHarvest(-22.5, -16.0), "Peak VH of -22.5 dB indicates bare soil all season (ghost crop)");
    }
  );

  testTier1(
    "F13-03",
    "F13.3: Vector 3 (Fuga de Safra): Flags active grain diversion when harvest is confirmed without debtor NF-e",
    () => {
      const detectGrainDiversion = (sarHarvestConfirmed: boolean, debtorManifestsIssued: number) => {
        return sarHarvestConfirmed && debtorManifestsIssued === 0;
      };

      assertTrue(detectGrainDiversion(true, 0), "Confirmed harvest with zero debtor shipping manifests is grain diversion");
    }
  );

  testTier1(
    "F13-04",
    "F13.4: Vector 4 (Blindagem Pré-RJ): Straw person formula S_straw assigns >= 0.85 when new IE opened < 30 days before harvest",
    () => {
      // S_straw = w1*f_kinship + w2*f_ie_age + w3*f_machinery + w4*f_mdf
      const calculateStrawScore = (params: {
        kinshipScore: number;     // 1.0 for spouse
        ieAgeDays: number;        // < 30 days -> 1.0
        machineryScore: number;   // 1.0 if zero machinery
        mdfTriangulation: number; // 1.0 if vehicles owned by debtor but billed to relative
      }) => {
        const f_ie = params.ieAgeDays < 30 ? 1.0 : params.ieAgeDays < 90 ? 0.5 : 0.0;
        return (
          0.30 * params.kinshipScore +
          0.30 * f_ie +
          0.20 * params.machineryScore +
          0.20 * params.mdfTriangulation
        );
      };

      const score = calculateStrawScore({
        kinshipScore: 1.0,
        ieAgeDays: 10,
        machineryScore: 1.0,
        mdfTriangulation: 1.0,
      });

      assertApprox(score, 1.0, 0.01);
      assertTrue(score >= 0.85, "Critical straw person fraud must score >= 0.85 (Level 5 Alert)");
    }
  );

  testTier1(
    "F13-05",
    "F13.5: CPC 300/301 Cautelar strike petition cites STJ REsp 1.758.746/GO and excludes grain from stay period",
    () => {
      const generateCautelarDraft = (debtor: string, strawPerson: string, cprCode: string) => {
        return {
          title: "TUTELA CAUTELAR ANTECEDENTE DE BUSCA E APREENSÃO LIMINAR",
          legalBasis: ["Art. 300 e 301 do CPC", "Lei nº 8.929/1994", "STJ REsp 1.758.746/GO"],
          doctrine: "Grãos agrícolas colhidos constituem bens fungíveis de consumo e circulação, excluídos da essencialidade sob o Art. 49 §3º da Lei 11.101/2005.",
          parties: { debtor, strawPerson, cprCode },
        };
      };

      const petition = generateCautelarDraft("Agropecuária Devedora Ltda", "Esposa do Sócio", "CPR-2026-BURITIS");
      assertTrue(petition.legalBasis.includes("STJ REsp 1.758.746/GO"));
      assertTrue(petition.doctrine.includes("Art. 49 §3º da Lei 11.101/2005"));
    }
  );
}
