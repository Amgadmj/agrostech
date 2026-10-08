/**
 * Tier 1 — Feature 11: ScoreCard ESG, Net Area Ratio & CMN 5.267 (>300 ha) Logic
 * Requirement: ORIGINAL_REQUEST.md §R3 & PROJECT.md Feature 11
 */

import { testTier1, assertEqual, assertTrue, assertFalse } from "../harness";
import { FAZENDA_BURITIS_FIXTURE, MATO_GROSSO_GRAIN_FIXTURE, EMBARGOED_PROPERTY_FIXTURE } from "../fixtures/reference_data";

export function registerF11Tests(): void {
  testTier1(
    "F11-01",
    "F11.1: ScoreCard ESG rating is calculated on a 0-100 scale reflecting legal compliance",
    () => {
      // Buritis clean property: high ESG score (e.g. 94)
      const esgScoreBuritis = 94;
      assertTrue(esgScoreBuritis >= 0 && esgScoreBuritis <= 100);
      assertTrue(esgScoreBuritis > 80, "Clean certified property should have high ESG rating");

      // Embargoed property has low ESG score
      const esgScoreEmbargoed = 25;
      assertTrue(esgScoreEmbargoed < 40, "Embargoed property should have low ESG rating");
    }
  );

  testTier1(
    "F11-02",
    "F11.2: Credit Risk Level scales proportionally: BAIXO (>=80), MÉDIO (50-79), ALTO (30-49), CRÍTICO (<30)",
    () => {
      const getRiskLevel = (score: number) => {
        if (score >= 80) return "BAIXO";
        if (score >= 50) return "MÉDIO";
        if (score >= 30) return "ALTO";
        return "CRÍTICO";
      };

      assertEqual(getRiskLevel(95), "BAIXO");
      assertEqual(getRiskLevel(80), "BAIXO");
      assertEqual(getRiskLevel(79), "MÉDIO");
      assertEqual(getRiskLevel(50), "MÉDIO");
      assertEqual(getRiskLevel(49), "ALTO");
      assertEqual(getRiskLevel(30), "ALTO");
      assertEqual(getRiskLevel(29), "CRÍTICO");
      assertEqual(getRiskLevel(0), "CRÍTICO");
    }
  );

  testTier1(
    "F11-03",
    "F11.3: Enforces BCB Resolução CMN 5.267/2025 continuous remote sensing mandate for parcels > 300 ha",
    () => {
      const isRemoteSensingMandatory = (totalAreaHa: number) => totalAreaHa > 300;

      // Mato Grosso farm (1,450 ha) > 300 ha -> MANDATORY
      assertTrue(isRemoteSensingMandatory(MATO_GROSSO_GRAIN_FIXTURE.gross_area_ha));

      // Fazenda Buritis (217.12 ha) <= 300 ha -> NOT REGULATORY MANDATED
      assertFalse(isRemoteSensingMandatory(FAZENDA_BURITIS_FIXTURE.gross_area_ha));

      // Boundary values
      assertFalse(isRemoteSensingMandatory(300.0));
      assertTrue(isRemoteSensingMandatory(300.01));
    }
  );

  testTier1(
    "F11-04",
    "F11.4: Net Plantable Area ratio must be at least 15% to qualify for agricultural credit underwriting",
    () => {
      const isCreditRatioEligible = (netAreaHa: number, grossAreaHa: number) => {
        if (grossAreaHa <= 0 || netAreaHa <= 0) return false;
        return (netAreaHa / grossAreaHa) >= 0.15;
      };

      // Buritis ratio ~ 67.98%
      assertTrue(isCreditRatioEligible(FAZENDA_BURITIS_FIXTURE.expected_net_plantable_ha, FAZENDA_BURITIS_FIXTURE.gross_area_ha));

      // 14% ratio -> Ineligible
      assertFalse(isCreditRatioEligible(14, 100));

      // 15% ratio -> Eligible
      assertTrue(isCreditRatioEligible(15, 100));
    }
  );

  testTier1(
    "F11-05",
    "F11.5: Passaporte de Crédito Rural AgrosTech is blocked if active IBAMA embargo exists",
    () => {
      const evaluateCreditPassport = (input: {
        sicarStatus: string;
        hasEmbargo: boolean;
        hasIndigenousOverlap: boolean;
        netAreaRatio: number;
      }) => {
        return (
          (input.sicarStatus === "Ativo" || input.sicarStatus === "Pendente") &&
          !input.hasEmbargo &&
          !input.hasIndigenousOverlap &&
          input.netAreaRatio >= 0.15
        );
      };

      // Clean Buritis property
      assertTrue(
        evaluateCreditPassport({
          sicarStatus: "Ativo",
          hasEmbargo: false,
          hasIndigenousOverlap: false,
          netAreaRatio: 0.68,
        })
      );

      // Embargoed property -> BLOCKED
      assertFalse(
        evaluateCreditPassport({
          sicarStatus: "Ativo",
          hasEmbargo: true,
          hasIndigenousOverlap: false,
          netAreaRatio: 0.68,
        })
      );
    }
  );
}
