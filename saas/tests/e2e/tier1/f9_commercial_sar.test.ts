/**
 * Tier 1 — Feature 9: Commercial High-Res SAR Tasking Schemas & Zod Validation
 * Requirement: ORIGINAL_REQUEST.md §R2 & PROJECT.md Feature 9
 */

import { testTier1, assertEqual, assertTrue, assertFalse } from "../harness";
import { CommercialTaskingRequestSchema } from "@/lib/sar/commercial/schema";

export function registerF9Tests(): void {
  testTier1(
    "F9-01",
    "F9.1: Validates Umbra sub-meter spotlight tasking parameters (0.25m, HH polarization)",
    () => {
      const payload = {
        provider: "umbra",
        carCode: "MG-3109300-4829A0D7314B4A45A7C49102B94C7192",
        geometry: {
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
        },
        resolutionMode: "SPOTLIGHT_0_25M",
        polarization: "HH",
        acquisitionWindow: {
          startDatetime: "2026-10-01T00:00:00Z",
          endDatetime: "2026-10-05T23:59:59Z",
        },
        geometricConstraints: {
          minGrazingAngleDeg: 40,
          maxGrazingAngleDeg: 70,
          passDirection: "ANY",
        },
        priority: "EMERGENCY_JUDICIAL",
      };

      const result = CommercialTaskingRequestSchema.safeParse(payload);
      assertTrue(result.success, `Expected valid Umbra payload, errors: ${result.error?.message}`);
      if (result.success) {
        assertEqual(result.data.provider, "umbra");
        assertEqual(result.data.resolutionMode, "SPOTLIGHT_0_25M");
      }
    }
  );

  testTier1(
    "F9-02",
    "F9.2: Validates TerraSAR-X High-Res Spotlight tasking parameters (1.0m, DUAL_VV_VH)",
    () => {
      const payload = {
        provider: "terrasar_x",
        carCode: "MT-5107909-ABCD1234EF567890ABCD1234EF567890",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-55.72, -12.55],
              [-55.72, -12.50],
              [-55.65, -12.50],
              [-55.65, -12.55],
              [-55.72, -12.55],
            ],
          ],
        },
        resolutionMode: "SPOTLIGHT_1_00M",
        polarization: "DUAL_VV_VH",
        acquisitionWindow: {
          startDatetime: "2026-10-02T00:00:00Z",
          endDatetime: "2026-10-08T23:59:59Z",
        },
        geometricConstraints: {
          minGrazingAngleDeg: 35,
          maxGrazingAngleDeg: 65,
          passDirection: "DESCENDING",
        },
        priority: "RUSH",
      };

      const result = CommercialTaskingRequestSchema.safeParse(payload);
      assertTrue(result.success, `Expected valid TerraSAR payload, errors: ${result.error?.message}`);
      if (result.success) {
        assertEqual(result.data.provider, "terrasar_x");
      }
    }
  );

  testTier1(
    "F9-03",
    "F9.3: Rejects invalid satellite provider name not in supported provider enum",
    () => {
      const payload = {
        provider: "unsupported_sar_constellation",
        geometry: {
          type: "Polygon",
          coordinates: [[[-46, -15], [-46, -14], [-45, -14], [-45, -15], [-46, -15]]],
        },
        resolutionMode: "SPOTLIGHT_0_25M",
        polarization: "HH",
        acquisitionWindow: {
          startDatetime: "2026-10-01T00:00:00Z",
          endDatetime: "2026-10-05T00:00:00Z",
        },
      };

      const result = CommercialTaskingRequestSchema.safeParse(payload);
      assertFalse(result.success);
    }
  );

  testTier1(
    "F9-04",
    "F9.4: Rejects acquisition window when endDatetime is before or equal to startDatetime",
    () => {
      const payload = {
        provider: "umbra",
        geometry: {
          type: "Polygon",
          coordinates: [[[-46, -15], [-46, -14], [-45, -14], [-45, -15], [-46, -15]]],
        },
        resolutionMode: "SPOTLIGHT_0_25M",
        polarization: "HH",
        acquisitionWindow: {
          startDatetime: "2026-10-05T00:00:00Z",
          endDatetime: "2026-10-01T00:00:00Z", // Inverted!
        },
      };

      const result = CommercialTaskingRequestSchema.safeParse(payload);
      assertFalse(result.success);
    }
  );

  testTier1(
    "F9-05",
    "F9.5: Rejects unclosed polygon coordinates exterior ring",
    () => {
      const payload = {
        provider: "umbra",
        geometry: {
          type: "Polygon",
          // Open ring: first [-46, -15] != last [-45, -15]
          coordinates: [[[-46, -15], [-46, -14], [-45, -14], [-45, -15]]],
        },
        resolutionMode: "SPOTLIGHT_0_25M",
        polarization: "HH",
        acquisitionWindow: {
          startDatetime: "2026-10-01T00:00:00Z",
          endDatetime: "2026-10-05T00:00:00Z",
        },
      };

      const result = CommercialTaskingRequestSchema.safeParse(payload);
      assertFalse(result.success);
    }
  );
}
