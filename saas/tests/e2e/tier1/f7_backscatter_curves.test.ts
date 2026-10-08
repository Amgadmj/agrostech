/**
 * Tier 1 — Feature 7: Temporal Backscatter Decibel Conversions & Curve Points
 * Requirement: ORIGINAL_REQUEST.md §R2 & PROJECT.md Feature 7
 */

import { testTier1, assertEqual, assertTrue, assertApprox } from "../harness";
import {
  linearToDb,
  dbToLinear,
  calculateCrossPolRatioDb,
  SarTemporalEngine,
} from "@/lib/sar/temporalEngine";
import { FAZENDA_BURITIS_RTC_ITEMS } from "@/lib/sar/bdcStacClient";

export function registerF7Tests(): void {
  testTier1(
    "F7-01",
    "F7.1: Linear to decibel formula converts intensity: gamma0_dB = 10 * log10(gamma0_linear)",
    () => {
      // 1.0 linear = 0 dB
      assertApprox(linearToDb(1.0), 0.0, 0.001);
      // 0.1 linear = -10 dB
      assertApprox(linearToDb(0.1), -10.0, 0.001);
      // 0.01 linear = -20 dB
      assertApprox(linearToDb(0.01), -20.0, 0.001);
    }
  );

  testTier1(
    "F7-02",
    "F7.2: Calibrated fixture values convert with precision: linear 0.01513 yields -18.2 dB",
    () => {
      // Early emergence linear intensity from Fazenda Buritis
      const db = linearToDb(0.01513);
      assertApprox(db, -18.20, 0.05);

      // Peak biomass linear intensity 0.03802 yields -14.2 dB
      const peakDb = linearToDb(0.03802);
      assertApprox(peakDb, -14.20, 0.05);
    }
  );

  testTier1(
    "F7-03",
    "F7.3: Decibels to linear intensity conversion satisfies inverse relationship",
    () => {
      const originalDb = -16.5;
      const linearVal = dbToLinear(originalDb);
      const reconstructedDb = linearToDb(linearVal);
      assertApprox(reconstructedDb, originalDb, 0.001);
    }
  );

  testTier1(
    "F7-04",
    "F7.4: Cross-polarization ratio calculates depolarization: CR_dB = gamma0_VH_dB - gamma0_VV_dB",
    () => {
      const vhDb = -18.2;
      const vvDb = -12.0;
      const cr = calculateCrossPolRatioDb(vhDb, vvDb);
      assertApprox(cr, -6.2, 0.01);
    }
  );

  testTier1(
    "F7-05",
    "F7.5: SarTemporalEngine produces chronological curve points with pixel counts",
    async () => {
      const engine = new SarTemporalEngine();
      const polygon = {
        type: "Polygon",
        coordinates: [
          [
            [-46.615, -15.452],
            [-46.615, -15.418],
            [-46.591, -15.418],
            [-46.591, -15.452],
            [-46.615, -15.452],
          ],
        ],
      };

      const points = await engine.generateBackscatterCurve(polygon, FAZENDA_BURITIS_RTC_ITEMS);

      assertTrue(points.length >= 5);
      assertTrue(points[0].pixelCount > 0);

      for (let i = 0; i < points.length - 1; i++) {
        assertTrue(new Date(points[i].date).getTime() <= new Date(points[i + 1].date).getTime());
        assertTrue(typeof points[i].gamma0_vh_db === "number");
        assertTrue(typeof points[i].gamma0_vv_db === "number");
        assertTrue(typeof points[i].vh_vv_ratio_db === "number");
      }
    }
  );
}
