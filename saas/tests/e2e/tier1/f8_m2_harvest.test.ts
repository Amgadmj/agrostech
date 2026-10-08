/**
 * Tier 1 — Feature 8: M2 Anti-Fuga Harvest Detection Algorithm & Thresholds
 * Requirement: ORIGINAL_REQUEST.md §R2 & PROJECT.md Feature 8
 */

import { testTier1, assertEqual, assertTrue, assertFalse, assertApprox } from "../harness";
import { HarvestDetectionEngine } from "@/lib/sar/harvestEngine";
import { TemporalBackscatterPoint } from "@/types/sar";
import { SENTINEL_1_BURITIS_SERIES } from "../fixtures/reference_data";

export function registerF8Tests(): void {
  testTier1(
    "F8-01",
    "F8.1: Harvest event detected when Delta gamma0_VH <= -4.5 dB and bare soil floor <= -20.0 dB",
    () => {
      const engine = new HarvestDetectionEngine();
      // Buritis series has drop on 2026-02-19: -14.9 to -20.6 (Delta = -5.7 dB)
      const points: TemporalBackscatterPoint[] = SENTINEL_1_BURITIS_SERIES.map((pt) => ({
        date: pt.date,
        gamma0_vv_db: pt.gamma0_vv_db,
        gamma0_vh_db: pt.gamma0_vh_db,
        vh_vv_ratio_db: pt.vh_vv_ratio_db,
        pixelCount: pt.pixelCount,
      }));

      const result = engine.detectHarvestEvents(points, -4.5);

      assertTrue(result.harvestDetected);
      assertEqual(result.harvestDate, "2026-02-19");
      assertTrue(result.dropMagnitudeDb >= 4.5);
      assertTrue(result.bareSoilReached);
      assertTrue(result.alertLevel >= 4);
    }
  );

  testTier1(
    "F8-02",
    "F8.2: Drop smaller than calibrated threshold (Delta > -4.5 dB) does not trigger harvest alert",
    () => {
      const engine = new HarvestDetectionEngine();
      // Minor senescence drop of -1.5 dB (from -14.0 to -15.5 dB)
      const points: TemporalBackscatterPoint[] = [
        { date: "2026-01-01", gamma0_vv_db: -10, gamma0_vh_db: -14.0, vh_vv_ratio_db: -4, pixelCount: 1000 },
        { date: "2026-01-15", gamma0_vv_db: -10, gamma0_vh_db: -15.5, vh_vv_ratio_db: -5.5, pixelCount: 1000 },
      ];

      const result = engine.detectHarvestEvents(points, -4.5);

      assertFalse(result.harvestDetected);
      assertTrue(result.alertLevel <= 2);
    }
  );

  testTier1(
    "F8-03",
    "F8.3: Drop reaching only -17 dB (missing bare soil floor) is rejected as crop lodging or anomaly",
    () => {
      const engine = new HarvestDetectionEngine();
      // Drop of -5.0 dB from -12.0 to -17.0 dB (bare soil floor of -20.0 dB NOT reached)
      const points: TemporalBackscatterPoint[] = [
        { date: "2026-01-01", gamma0_vv_db: -8, gamma0_vh_db: -12.0, vh_vv_ratio_db: -4, pixelCount: 1000 },
        { date: "2026-01-15", gamma0_vv_db: -12, gamma0_vh_db: -17.0, vh_vv_ratio_db: -5, pixelCount: 1000 },
        { date: "2026-01-27", gamma0_vv_db: -12, gamma0_vh_db: -16.8, vh_vv_ratio_db: -4.8, pixelCount: 1000 },
      ];

      const result = engine.detectHarvestEvents(points, -4.5, { bareSoilFloorDb: -20.0 });

      // Because bare soil floor was not reached, confidence is penalized or harvest is rejected
      assertFalse(result.bareSoilReached);
    }
  );

  testTier1(
    "F8-04",
    "F8.4: S_clima Climate Refutation confirms precipitation does not explain negative backscatter drop",
    () => {
      const engine = new HarvestDetectionEngine();
      const points: TemporalBackscatterPoint[] = [
        { date: "2026-02-01", gamma0_vv_db: -10, gamma0_vh_db: -14.0, vh_vv_ratio_db: -4, pixelCount: 1000 },
        { date: "2026-02-15", gamma0_vv_db: -15, gamma0_vh_db: -21.0, vh_vv_ratio_db: -6, pixelCount: 1000 },
      ];

      const result = engine.detectHarvestEvents(points, -4.5, { precipitationMm48h: 2.5 });

      assertTrue(result.climateRefutation.rainArtifactRefuted);
      assertTrue(result.confidence > 0.8);
    }
  );

  testTier1(
    "F8-05",
    "F8.5: Unregistered grain diversion escalates harvest detection to Level 5 Alert (Fuga Noturna)",
    () => {
      const engine = new HarvestDetectionEngine();
      const points: TemporalBackscatterPoint[] = [
        { date: "2026-02-01", gamma0_vv_db: -10, gamma0_vh_db: -14.0, vh_vv_ratio_db: -4, pixelCount: 1000 },
        { date: "2026-02-15", gamma0_vv_db: -15, gamma0_vh_db: -21.5, vh_vv_ratio_db: -6.5, pixelCount: 1000 },
      ];

      const result = engine.detectHarvestEvents(points, -4.5, {
        unregisteredDiversionSuspected: true,
      });

      assertTrue(result.harvestDetected);
      assertEqual(result.alertLevel, 5);
      assertTrue(result.recommendations.some((r) => r.includes("Cautelar") || r.includes("Shield-RJ") || r.includes("busca")));
    }
  );
}
