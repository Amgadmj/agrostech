import { NextResponse } from "next/server";
import { bdcStacClient } from "@/lib/sar/bdcStacClient";
import { sarTemporalEngine } from "@/lib/sar/temporalEngine";
import { REAL_BURITIS_PARCELS, EXACT_BURITIS_COORDINATES } from "@/lib/mockData";
import { checkApiAuth, unauthorizedResponse } from "@/lib/supabase/auth-guard";

export async function POST(request: Request) {
  const auth = await checkApiAuth(request);
  if (!auth.authenticated) {
    return unauthorizedResponse();
  }
  try {
    const body = await request.json();
    const { car_code, geojson, dateRange } = body;

    if (!car_code && !geojson) {
      return NextResponse.json(
        {
          success: false,
          error: "Either 'car_code' or 'geojson' geometry must be provided.",
        },
        { status: 400 }
      );
    }

    // Determine target polygon and bounding box
    let targetPolygon: any;
    let bbox: [number, number, number, number];

    if (geojson) {
      if (geojson.type === "Feature") {
        targetPolygon = geojson.geometry;
      } else if (geojson.type === "Polygon") {
        targetPolygon = geojson;
      } else if (geojson.type === "FeatureCollection" && geojson.features?.length > 0) {
        targetPolygon = geojson.features[0].geometry;
      } else {
        targetPolygon = geojson;
      }
    } else if (car_code) {
      // Find matching mock parcel if available
      const found = REAL_BURITIS_PARCELS.find(
        (p) => p.car_code.toLowerCase() === car_code.toLowerCase()
      );
      if (found) {
        targetPolygon = found.geojson_boundary.geometry;
      } else {
        // Default to Buritis polygon
        targetPolygon = {
          type: "Polygon",
          coordinates: [EXACT_BURITIS_COORDINATES],
        };
      }
    }

    // Compute bounding box [minLon, minLat, maxLon, maxLat] from polygon coordinates
    try {
      const ring = targetPolygon.coordinates?.[0] || EXACT_BURITIS_COORDINATES;
      let minLon = Infinity;
      let maxLon = -Infinity;
      let minLat = Infinity;
      let maxLat = -Infinity;

      for (const pt of ring) {
        const [lon, lat] = pt;
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }

      bbox = [minLon, minLat, maxLon, maxLat];
    } catch {
      // Default to Fazenda Buritis bounding box
      bbox = [-46.615, -15.452, -46.591, -15.418];
    }

    // Default 6-month observation window if not specified
    const start = dateRange?.start || "2025-11-01T00:00:00Z";
    const end = dateRange?.end || "2026-04-15T23:59:59Z";

    // 1. Query INPE Sentinel-1 RTC items
    const stacItems = await bdcStacClient.searchSentinel1Rtc(bbox, {
      start,
      end,
    });

    // 2. Generate temporal backscatter curve (dB conversion & zonal statistics)
    const curve = await sarTemporalEngine.generateBackscatterCurve(
      targetPolygon,
      stacItems
    );

    // 3. Compute phenological trend summary
    let trend = "STABLE";
    if (curve.length >= 2) {
      const latest = curve[curve.length - 1];
      const previous = curve[curve.length - 2];
      const delta = latest.gamma0_vh_db - previous.gamma0_vh_db;

      if (delta <= -4.5 && latest.gamma0_vh_db <= -20.0) {
        trend = "HARVEST_COLLAPSE";
      } else if (latest.gamma0_vh_db <= -20.0) {
        trend = "BARE_SOIL";
      } else if (delta < -1.5) {
        trend = "SENESCENCE";
      } else if (latest.gamma0_vh_db >= -13.5) {
        trend = "PEAK_BIOMASS";
      } else {
        trend = "VEGETATIVE_GROWTH";
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        car_code: car_code || "CAR-CUSTOM-GEOMETRY",
        bbox,
        dateRange: { start, end },
        acquisitionsCount: curve.length,
        itemsCount: stacItems.length,
        curve,
        summary: {
          latestDate: curve[curve.length - 1]?.date || null,
          latestVhDb: curve[curve.length - 1]?.gamma0_vh_db || null,
          latestVvDb: curve[curve.length - 1]?.gamma0_vv_db || null,
          latestRatioDb: curve[curve.length - 1]?.vh_vv_ratio_db || null,
          trend,
        },
      },
    });
  } catch (error: any) {
    console.error("SAR Temporal API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate SAR temporal backscatter curve.",
      },
      { status: 500 }
    );
  }
}
