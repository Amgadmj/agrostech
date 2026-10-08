/**
 * Tier 1 — Feature 5: Model M1 Net Plantable Area (Área Útil Líquida) Math & Formulas
 * Requirement: ORIGINAL_REQUEST.md §R1 & PROJECT.md Feature 5
 */

import { testTier1, assertEqual, assertTrue, assertFalse, assertApprox } from "../harness";
import { calculateNetPlantableArea } from "@/lib/m1/calculator";
import { FAZENDA_BURITIS_FIXTURE } from "../fixtures/reference_data";

export function registerF5Tests(): void {
  testTier1(
    "F5-01",
    "F5.1: Art. 15 Law 12.651/2012 conservation deduplication avoids double-counting APP inside RL",
    () => {
      // 100 ha Gross, 20 ha APP, 20 ha RL, 5 ha RL inside APP
      // Conservation should be: 20 + 20 - 5 = 35 ha
      // Net area should be: 100 - 35 = 65 ha
      const output = calculateNetPlantableArea({
        grossAreaHa: 100,
        appAreaHa: 20,
        legalReserveAreaHa: 20,
        rlInAppAreaHa: 5,
      });

      assertApprox(output.netPlantableAreaHa, 65.0, 0.01);
      assertApprox(output.preservationRatio, 0.35, 0.01);
      assertApprox(output.netArableRatio, 0.65, 0.01);
      assertTrue(output.isEligibleForCredit);
    }
  );

  testTier1(
    "F5-02",
    "F5.2: Model M1 deducts easements, restricted use, disputed areas, and embargoes",
    () => {
      const output = calculateNetPlantableArea({
        grossAreaHa: 500,
        appAreaHa: 50,
        legalReserveAreaHa: 100,
        rlInAppAreaHa: 0,
        easementsHa: 10,
        restrictedUseHa: 15,
        disputedAreaHa: 25,
        publicOverlapsHa: 0,
        embargoesHa: 50,
      });

      // Total deductions: 50 + 100 + 10 + 15 + 25 + 50 = 250 ha
      // Net plantable: 500 - 250 = 250 ha
      assertApprox(output.netPlantableAreaHa, 250.0, 0.01);
      assertApprox(output.netArableRatio, 0.50, 0.01);
      assertEqual(output.deductionsBreakdown.embargoesHa, 50);
      assertEqual(output.deductionsBreakdown.easementsHa, 10);
    }
  );

  testTier1(
    "F5-03",
    "F5.3: Fazenda Buritis reference fixture yields exact 147.60 ha Net Plantable Area",
    () => {
      const output = calculateNetPlantableArea({
        grossAreaHa: FAZENDA_BURITIS_FIXTURE.gross_area_ha,
        appAreaHa: FAZENDA_BURITIS_FIXTURE.app_area_ha,
        legalReserveAreaHa: FAZENDA_BURITIS_FIXTURE.legal_reserve_area_ha,
        rlInAppAreaHa: FAZENDA_BURITIS_FIXTURE.rl_in_app_ha,
        consolidatedUseHa: FAZENDA_BURITIS_FIXTURE.consolidated_use_ha,
      });

      assertApprox(output.netPlantableAreaHa, FAZENDA_BURITIS_FIXTURE.expected_net_plantable_ha, 0.05);
      assertApprox(output.preservationRatio, FAZENDA_BURITIS_FIXTURE.expected_preservation_ratio, 0.01);
      assertApprox(output.netArableRatio, FAZENDA_BURITIS_FIXTURE.expected_net_arable_ratio, 0.01);
      assertTrue(output.isEligibleForCredit);
    }
  );

  testTier1(
    "F5-04",
    "F5.4: Deductive net area is clamped to zero when total exclusions exceed gross area",
    () => {
      const output = calculateNetPlantableArea({
        grossAreaHa: 100,
        appAreaHa: 70,
        legalReserveAreaHa: 80, // Total conservation = 150 > 100
        rlInAppAreaHa: 0,
      });

      assertEqual(output.netPlantableAreaHa, 0);
      assertFalse(output.isEligibleForCredit);
    }
  );

  testTier1(
    "F5-05",
    "F5.5: Property with net arable ratio below 15% is flagged as ineligble for crop financing",
    () => {
      // 1000 ha property with 860 ha conservation -> 140 ha net (14% ratio < 15%)
      const output = calculateNetPlantableArea({
        grossAreaHa: 1000,
        appAreaHa: 360,
        legalReserveAreaHa: 500,
        rlInAppAreaHa: 0,
      });

      assertApprox(output.netPlantableAreaHa, 140.0, 0.01);
      assertApprox(output.netArableRatio, 0.14, 0.01);
      assertFalse(output.isEligibleForCredit);
    }
  );

  testTier1(
    "F5-06",
    "F5.6: Consolidated land cross-verification caps net area to effective consolidated minus liabilities",
    () => {
      // Gross 500 ha, Deductive net = 350 ha, but consolidated use is only 200 ha with 20 ha restoration
      // Effective consolidated = 180 ha -> Final Net must be min(350, 180) = 180 ha
      const output = calculateNetPlantableArea({
        grossAreaHa: 500,
        appAreaHa: 50,
        legalReserveAreaHa: 100,
        consolidatedUseHa: 200,
        appRestorationHa: 20,
      });

      assertApprox(output.netPlantableAreaHa, 180.0, 0.01);
    }
  );
}
