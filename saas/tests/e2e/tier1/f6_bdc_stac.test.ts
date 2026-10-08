/**
 * Tier 1 — Feature 6: INPE BDC STAC Client Sentinel-1 RTC Query Schemas
 * Requirement: ORIGINAL_REQUEST.md §R2 & PROJECT.md Feature 6
 */

import { testTier1, assertEqual, assertTrue } from "../harness";
import { BdcStacClient } from "@/lib/sar/bdcStacClient";

export function registerF6Tests(): void {
  testTier1(
    "F6-01",
    "F6.1: BdcStacClient queries sentinel-1-rtc-1 collection by bbox and date range",
    async () => {
      const client = new BdcStacClient({ enableOfflineFallback: true });
      const bbox: [number, number, number, number] = [-46.615, -15.452, -46.591, -15.418]; // Buritis/MG
      const items = await client.searchSentinel1Rtc(bbox, {
        start: "2025-11-01T00:00:00Z",
        end: "2026-04-01T00:00:00Z",
      });

      assertTrue(Array.isArray(items));
      assertTrue(items.length >= 5, "Expected at least 5 Sentinel-1 RTC acquisitions over the crop cycle");
      assertEqual(items[0].collection, "sentinel-1-rtc-1");
    }
  );

  testTier1(
    "F6-02",
    "F6.2: Sentinel-1 RTC STAC items provide required Gamma0_VH and Gamma0_VV assets",
    async () => {
      const client = new BdcStacClient({ enableOfflineFallback: true });
      const bbox: [number, number, number, number] = [-46.615, -15.452, -46.591, -15.418];
      const items = await client.searchSentinel1Rtc(bbox, {
        start: "2025-11-01T00:00:00Z",
        end: "2026-03-30T00:00:00Z",
      });

      const firstItem = items[0];
      assertTrue(firstItem.assets.Gamma0_VH !== undefined);
      assertTrue(firstItem.assets.Gamma0_VV !== undefined);
      assertTrue(firstItem.assets.Gamma0_VH.href.includes(".tif"));
      assertTrue(firstItem.assets.Gamma0_VV.href.includes(".tif"));
    }
  );

  testTier1(
    "F6-03",
    "F6.3: STAC items confirm Interferometric Wide (IW) mode and dual polarisation channels (VV&VH)",
    async () => {
      const client = new BdcStacClient({ enableOfflineFallback: true });
      const bbox: [number, number, number, number] = [-46.615, -15.452, -46.591, -15.418];
      const items = await client.searchSentinel1Rtc(bbox, {
        start: "2025-11-01T00:00:00Z",
        end: "2026-03-30T00:00:00Z",
      });

      for (const item of items) {
        assertEqual(item.properties.operational_mode, "IW");
        assertEqual(item.properties.polarisation_channels, "VV&VH");
        assertTrue(
          item.properties.orbit_direction === "ASCENDING" ||
          item.properties.orbit_direction === "DESCENDING"
        );
      }
    }
  );

  testTier1(
    "F6-04",
    "F6.4: Retrieved STAC items are ordered chronologically by acquisition datetime",
    async () => {
      const client = new BdcStacClient({ enableOfflineFallback: true });
      const bbox: [number, number, number, number] = [-46.615, -15.452, -46.591, -15.418];
      const items = await client.searchSentinel1Rtc(bbox, {
        start: "2025-11-01T00:00:00Z",
        end: "2026-03-30T00:00:00Z",
      });

      for (let i = 0; i < items.length - 1; i++) {
        const t1 = new Date(items[i].properties.datetime).getTime();
        const t2 = new Date(items[i + 1].properties.datetime).getTime();
        assertTrue(t1 <= t2, `Item ${i} (${items[i].properties.datetime}) must precede or equal item ${i + 1} (${items[i + 1].properties.datetime})`);
      }
    }
  );

  testTier1(
    "F6-05",
    "F6.5: Spatial bbox filtering restricts items to intersecting geometries",
    async () => {
      const client = new BdcStacClient({ enableOfflineFallback: true });
      const bbox: [number, number, number, number] = [-46.615, -15.452, -46.591, -15.418];
      const items = await client.searchSentinel1Rtc(bbox, {
        start: "2026-01-01T00:00:00Z",
        end: "2026-03-01T00:00:00Z",
      });

      for (const item of items) {
        const itemBbox = item.bbox;
        // Bbox should overlap
        assertTrue(itemBbox[0] <= bbox[2] && itemBbox[2] >= bbox[0]);
        assertTrue(itemBbox[1] <= bbox[3] && itemBbox[3] >= bbox[1]);
      }
    }
  );
}
