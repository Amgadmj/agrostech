/**
 * Commercial SAR Tasking Validation Schemas
 * Powered by Zod for runtime contract verification
 * Providers: Umbra Space Canopy API & Airbus TerraSAR-X
 */

import { z } from "zod";
import { calculatePolygonAreaHa } from "@/lib/spatialUtils";

export const GeoJsonPolygonSchema = z.object({
  type: z.literal("Polygon"),
  coordinates: z
    .array(z.array(z.tuple([z.number(), z.number()])))
    .refine(
      (rings) => {
        if (!rings || rings.length === 0 || !rings[0] || rings[0].length < 4) {
          return false;
        }
        // Check closure: first coordinate must match last coordinate
        const first = rings[0][0];
        const last = rings[0][rings[0].length - 1];
        const isClosed =
          Math.abs(first[0] - last[0]) < 1e-6 &&
          Math.abs(first[1] - last[1]) < 1e-6;
        return isClosed;
      },
      {
        message:
          "Polygon exterior ring must have at least 4 coordinates and be closed (first coordinate equals last).",
      }
    ),
});

export const GeometricConstraintsSchema = z
  .object({
    minGrazingAngleDeg: z.number().min(15).max(75).default(20).optional(),
    maxGrazingAngleDeg: z.number().min(20).max(85).default(70).optional(),
    passDirection: z.enum(["ASCENDING", "DESCENDING", "ANY"]).default("ANY").optional(),
    min_grazing_angle_deg: z.number().optional(),
    max_grazing_angle_deg: z.number().optional(),
    pass_direction: z.enum(["ASCENDING", "DESCENDING", "ANY"]).optional(),
  })
  .optional();

const BaseTaskingObjectSchema = z
  .object({
    provider: z.enum(["umbra", "terrasar_x"]),
    farmId: z.string().optional(),
    farm_id: z.string().optional(),
    carCode: z.string().min(5, "CAR code must have at least 5 characters.").optional(),
    car_code: z.string().min(5).optional(),
    geometry: GeoJsonPolygonSchema,
    resolutionMode: z.enum([
      "SPOTLIGHT_0_25M", // Umbra 25cm / TerraSAR-X Staring Spotlight
      "SPOTLIGHT_0_50M", // Umbra 50cm
      "SPOTLIGHT_1_00M", // Umbra 1m / TerraSAR-X High Resolution Spotlight
      "STRIPMAP_3_00M",  // TerraSAR-X Standard Stripmap
    ]),
    resolution_mode: z.enum([
      "SPOTLIGHT_0_25M",
      "SPOTLIGHT_0_50M",
      "SPOTLIGHT_1_00M",
      "STRIPMAP_3_00M",
    ]).optional(),
    polarization: z.enum(["HH", "VV", "DUAL_HH_HV", "DUAL_VV_VH"]),
    acquisitionWindow: z
      .object({
        startDatetime: z.string().refine((val) => !isNaN(Date.parse(val)), {
          message: "startDatetime must be a valid ISO-8601 date string.",
        }),
        endDatetime: z.string().refine((val) => !isNaN(Date.parse(val)), {
          message: "endDatetime must be a valid ISO-8601 date string.",
        }),
      })
      .refine(
        (window) => new Date(window.endDatetime) > new Date(window.startDatetime),
        {
          message: "endDatetime must be strictly after startDatetime.",
        }
      ),
    acquisition_window: z
      .object({
        start_datetime: z.string().optional(),
        end_datetime: z.string().optional(),
      })
      .optional(),
    geometricConstraints: GeometricConstraintsSchema,
    geometric_constraints: GeometricConstraintsSchema,
    priority: z
      .enum(["STANDARD", "RUSH", "EMERGENCY_JUDICIAL"])
      .default("STANDARD"),
    targetIncidenceAngleDeg: z
      .object({
        min: z.number().min(15).max(75).default(20),
        max: z.number().min(20).max(85).default(60),
      })
      .optional(),
    notes: z.string().max(1000).optional(),
  })
  .superRefine((data, ctx) => {
    // Provider specific capability checks
    if (data.provider === "umbra" && data.resolutionMode === "STRIPMAP_3_00M") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Umbra Space Canopy does not support STRIPMAP_3_00M. Choose SPOTLIGHT (0.25m, 0.50m, or 1.00m).",
        path: ["resolutionMode"],
      });
    }

    if (data.provider === "terrasar_x" && data.resolutionMode === "SPOTLIGHT_0_50M") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Airbus TerraSAR-X offers SPOTLIGHT_0_25M (Staring), SPOTLIGHT_1_00M (HighRes), and STRIPMAP_3_00M.",
        path: ["resolutionMode"],
      });
    }

    // Footprint area check
    try {
      const ring = data.geometry.coordinates[0] as unknown as number[][];
      const areaHa = calculatePolygonAreaHa(ring);
      const areaKm2 = areaHa / 100;

      // Spotlight modes have strict maximum footprints
      if (
        data.resolutionMode.startsWith("SPOTLIGHT") &&
        areaKm2 > 25.0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `AOI footprint (${areaKm2.toFixed(1)} km²) exceeds maximum 25 km² limit for Spotlight SAR mode. Split into sub-tiles or select Stripmap.`,
          path: ["geometry"],
        });
      }
    } catch {
      // Area calculation warning only if geometry parsing fails
    }
  });

export const CommercialTaskingRequestSchema = z.preprocess((raw: any) => {
  if (!raw || typeof raw !== "object") return raw;
  const processed = { ...raw };

  // Normalize snake_case to camelCase
  if (!processed.farmId && processed.farm_id) {
    processed.farmId = processed.farm_id;
  }
  if (!processed.carCode && processed.car_code) {
    processed.carCode = processed.car_code;
  }
  if (!processed.resolutionMode && processed.resolution_mode) {
    processed.resolutionMode = processed.resolution_mode;
  }
  if (!processed.geometricConstraints && processed.geometric_constraints) {
    processed.geometricConstraints = processed.geometric_constraints;
  }

  // Normalize acquisitionWindow
  if (!processed.acquisitionWindow && processed.acquisition_window) {
    processed.acquisitionWindow = {
      startDatetime:
        processed.acquisition_window.startDatetime ||
        processed.acquisition_window.start_datetime,
      endDatetime:
        processed.acquisition_window.endDatetime ||
        processed.acquisition_window.end_datetime,
    };
  } else if (processed.acquisitionWindow) {
    processed.acquisitionWindow = {
      startDatetime:
        processed.acquisitionWindow.startDatetime ||
        (processed.acquisitionWindow as any).start_datetime,
      endDatetime:
        processed.acquisitionWindow.endDatetime ||
        (processed.acquisitionWindow as any).end_datetime,
    };
  }

  return processed;
}, BaseTaskingObjectSchema);

export type ValidatedCommercialTaskingParams = z.infer<
  typeof BaseTaskingObjectSchema
>;
