import { NextResponse } from "next/server";
import { harvestDetectionEngine } from "@/lib/sar/harvestEngine";
import { bdcStacClient } from "@/lib/sar/bdcStacClient";
import { sarTemporalEngine } from "@/lib/sar/temporalEngine";
import { REAL_BURITIS_PARCELS, EXACT_BURITIS_COORDINATES } from "@/lib/mockData";
import { TemporalBackscatterPoint } from "@/types/sar";
import { checkApiAuth, unauthorizedResponse } from "@/lib/supabase/auth-guard";

export async function POST(request: Request) {
  const auth = await checkApiAuth(request);
  if (!auth.authenticated) {
    return unauthorizedResponse();
  }
  try {
    const body = await request.json();
    const {
      temporalPoints,
      car_code,
      geojson,
      thresholdDb,
      bareSoilFloorDb,
      precipitationMm48h,
      unregisteredDiversionSuspected,
    } = body;

    let points: TemporalBackscatterPoint[] = temporalPoints;

    // If temporalPoints were not directly passed, derive them from parcel or CAR code
    if (!points || !Array.isArray(points) || points.length === 0) {
      if (!car_code && !geojson) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Must provide either 'temporalPoints' array or 'car_code' / 'geojson' to evaluate harvest events.",
          },
          { status: 400 }
        );
      }

      // Dynamically resolve geometry and derive satellite bounding box (C04 compliance)
      let targetPolygon: any;
      let bbox: [number, number, number, number] = [
        -46.615, -15.452, -46.591, -15.418,
      ];

      if (geojson) {
        targetPolygon = geojson.type === "Feature" ? geojson.geometry : geojson;
        const ring = (targetPolygon.coordinates?.[0] || []) as number[][];
        if (ring.length > 0) {
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          for (const pt of ring) {
            if (pt[0] < minX) minX = pt[0];
            if (pt[1] < minY) minY = pt[1];
            if (pt[0] > maxX) maxX = pt[0];
            if (pt[1] > maxY) maxY = pt[1];
          }
          bbox = [minX, minY, maxX, maxY];
        }
      } else if (car_code) {
        const found = REAL_BURITIS_PARCELS.find(
          (p) => p.car_code.toLowerCase() === car_code.toLowerCase()
        );
        if (found) {
          targetPolygon = found.geojson_boundary.geometry;
          const ring = (targetPolygon.coordinates?.[0] || []) as number[][];
          if (ring.length > 0) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const pt of ring) {
              if (pt[0] < minX) minX = pt[0];
              if (pt[1] < minY) minY = pt[1];
              if (pt[0] > maxX) maxX = pt[0];
              if (pt[1] > maxY) maxY = pt[1];
            }
            bbox = [minX, minY, maxX, maxY];
          }
        } else if (car_code.toUpperCase().includes("MG-3109300")) {
          targetPolygon = { type: "Polygon", coordinates: [EXACT_BURITIS_COORDINATES] };
        } else {
          return NextResponse.json(
            { success: false, error: "Geometria do polígono não encontrada para o CAR especificado. Forneça o GeoJSON." },
            { status: 404 }
          );
        }
      }

      // Query STAC using derived bbox & requested crop-season interval
      const startInterval = body.startDate || "2025-11-01T00:00:00Z";
      const endInterval = body.endDate || "2026-04-15T23:59:59Z";

      const stacItems = await bdcStacClient.searchSentinel1Rtc(bbox, {
        start: startInterval,
        end: endInterval,
      });

      points = await sarTemporalEngine.generateBackscatterCurve(
        targetPolygon,
        stacItems
      );
    }

    // Run M2 Anti-Fuga Harvest Engine
    const result = harvestDetectionEngine.detectHarvestEvents(
      points,
      thresholdDb,
      {
        bareSoilFloorDb,
        precipitationMm48h,
        unregisteredDiversionSuspected,
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        evaluatedPointsCount: points.length,
        evaluatedPeriod: {
          start: points[0]?.date || null,
          end: points[points.length - 1]?.date || null,
        },
      },
    });
  } catch (error: any) {
    console.error("SAR Harvest Check API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to execute M2 harvest detection engine.",
      },
      { status: 500 }
    );
  }
}
