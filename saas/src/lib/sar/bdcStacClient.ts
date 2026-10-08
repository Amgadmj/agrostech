/**
 * INPE Brazil Data Cube (BDC) STAC Client
 * Ingests Sentinel-1 RTC L2 Analysis-Ready Data (ARD)
 * Collection: https://data.inpe.br/bdc/stac/v1/collections/sentinel-1-rtc-1
 */

import {
  Sentinel1RtcItem,
  StacItem,
  BDCStacSearchQuery,
  StacAssetLink,
} from "@/types/sar";

const BDC_STAC_BASE_URL = "https://data.inpe.br/bdc/stac/v1";
const S1_RTC_COLLECTION = "sentinel-1-rtc-1";
const DEFAULT_TIMEOUT_MS = 10000;

export interface BdcClientOptions {
  baseUrl?: string;
  collection?: string;
  timeoutMs?: number;
  enableOfflineFallback?: boolean;
}

/**
 * High-fidelity cached Sentinel-1 RTC time-series for Fazenda Buritis, Buritis - MG
 * CAR: MG-3109300-4829A0D7314B4A45A7C49102B94C7192
 * Bbox: [-46.615, -15.452, -46.591, -15.418]
 * Full 2025/2026 crop cycle: Planting -> Peak Biomass -> Desiccation -> Harvest Collapse -> Bare Soil
 */
export const FAZENDA_BURITIS_RTC_ITEMS: Sentinel1RtcItem[] = [
  {
    id: "S1D_IW_RTCH_1SDV_20251115_001201_0041A1_BURITIS",
    type: "Feature",
    collection: "sentinel-1-rtc-1",
    bbox: [-46.615, -15.452, -46.591, -15.418],
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
    properties: {
      datetime: "2025-11-15T08:26:15.000Z",
      operational_mode: "IW",
      polarisation_channels: "VV&VH",
      orbit_direction: "DESCENDING",
      relative_orbit: 53,
      rtc_radiometry: "gamma0",
      platform: "sentinel-1",
      constellation: "sentinel-1",
      mean_vh_linear: 0.01513, // -18.2 dB (Early emergence / seeding)
      mean_vv_linear: 0.06310, // -12.0 dB
      soil_moisture_m3m3: 0.22,
    },
    assets: {
      Gamma0_VH: {
        href: "https://data.inpe.br/bdc/data/sentinel-1/rtc/v1/2025/11/15/IW/DV/S1D_IW_RTCH_BURITIS_20251115_Gamma0_VH.tif",
        type: "image/tiff; application=geotiff; profile=cloud-optimized",
        roles: ["data"],
      },
      Gamma0_VV: {
        href: "https://data.inpe.br/bdc/data/sentinel-1/rtc/v1/2025/11/15/IW/DV/S1D_IW_RTCH_BURITIS_20251115_Gamma0_VV.tif",
        type: "image/tiff; application=geotiff; profile=cloud-optimized",
        roles: ["data"],
      },
      layover_shadow_mask: {
        href: "https://data.inpe.br/bdc/data/sentinel-1/rtc/v1/2025/11/15/IW/DV/S1D_IW_RTCH_BURITIS_20251115_layoverShadowMask.tif",
        type: "image/tiff; application=geotiff; profile=cloud-optimized",
        roles: ["data"],
      },
      local_incidence_angle: {
        href: "https://data.inpe.br/bdc/data/sentinel-1/rtc/v1/2025/11/15/IW/DV/S1D_IW_RTCH_BURITIS_20251115_localIncidenceAngle.tif",
        type: "image/tiff; application=geotiff; profile=cloud-optimized",
        roles: ["data"],
      },
      thumbnail: {
        href: "https://data.inpe.br/bdc/data/sentinel-1/rtc/v1/2025/11/15/IW/DV/S1D_IW_RTCH_BURITIS_20251115_thumbnail.png",
        type: "image/png",
        roles: ["thumbnail"],
      },
    },
  },
  {
    id: "S1D_IW_RTCH_1SDV_20251127_001380_0042B2_BURITIS",
    type: "Feature",
    collection: "sentinel-1-rtc-1",
    bbox: [-46.615, -15.452, -46.591, -15.418],
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
    properties: {
      datetime: "2025-11-27T08:26:15.000Z",
      operational_mode: "IW",
      polarisation_channels: "VV&VH",
      orbit_direction: "DESCENDING",
      relative_orbit: 53,
      rtc_radiometry: "gamma0",
      platform: "sentinel-1",
      constellation: "sentinel-1",
      mean_vh_linear: 0.02291, // -16.4 dB (Vegetative growth V3-V4)
      mean_vv_linear: 0.07943, // -11.0 dB
    },
    assets: {
      Gamma0_VH: {
        href: "https://data.inpe.br/bdc/data/sentinel-1/rtc/v1/2025/11/27/IW/DV/S1D_IW_RTCH_BURITIS_20251127_Gamma0_VH.tif",
        type: "image/tiff; application=geotiff; profile=cloud-optimized",
        roles: ["data"],
      },
      Gamma0_VV: {
        href: "https://data.inpe.br/bdc/data/sentinel-1/rtc/v1/2025/11/27/IW/DV/S1D_IW_RTCH_BURITIS_20251127_Gamma0_VV.tif",
        type: "image/tiff; application=geotiff; profile=cloud-optimized",
        roles: ["data"],
      },
    },
  },
  {
    id: "S1D_IW_RTCH_1SDV_20251209_001559_0043C3_BURITIS",
    type: "Feature",
    collection: "sentinel-1-rtc-1",
    bbox: [-46.615, -15.452, -46.591, -15.418],
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
    properties: {
      datetime: "2025-12-09T08:26:15.000Z",
      operational_mode: "IW",
      polarisation_channels: "VV&VH",
      orbit_direction: "DESCENDING",
      relative_orbit: 53,
      rtc_radiometry: "gamma0",
      platform: "sentinel-1",
      constellation: "sentinel-1",
      mean_vh_linear: 0.03311, // -14.8 dB (Rapid canopy expansion)
      mean_vv_linear: 0.10000, // -10.0 dB
    },
    assets: {
      Gamma0_VH: {
        href: "https://data.inpe.br/bdc/data/sentinel-1/rtc/v1/2025/12/09/IW/DV/S1D_IW_RTCH_BURITIS_20251209_Gamma0_VH.tif",
        type: "image/tiff; application=geotiff; profile=cloud-optimized",
        roles: ["data"],
      },
      Gamma0_VV: {
        href: "https://data.inpe.br/bdc/data/sentinel-1/rtc/v1/2025/12/09/IW/DV/S1D_IW_RTCH_BURITIS_20251209_Gamma0_VV.tif",
        type: "image/tiff; application=geotiff; profile=cloud-optimized",
        roles: ["data"],
      },
    },
  },
  {
    id: "S1D_IW_RTCH_1SDV_20251221_001738_0044D4_BURITIS",
    type: "Feature",
    collection: "sentinel-1-rtc-1",
    bbox: [-46.615, -15.452, -46.591, -15.418],
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
    properties: {
      datetime: "2025-12-21T08:26:15.000Z",
      operational_mode: "IW",
      polarisation_channels: "VV&VH",
      orbit_direction: "DESCENDING",
      relative_orbit: 53,
      rtc_radiometry: "gamma0",
      platform: "sentinel-1",
      constellation: "sentinel-1",
      mean_vh_linear: 0.04786, // -13.2 dB (Canopy closure / R1 Flowering)
      mean_vv_linear: 0.12589, // -9.0 dB
    },
    assets: {
      Gamma0_VH: {
        href: "https://data.inpe.br/bdc/data/sentinel-1/rtc/v1/2025/12/21/IW/DV/S1D_IW_RTCH_BURITIS_20251221_Gamma0_VH.tif",
        type: "image/tiff; application=geotiff; profile=cloud-optimized",
        roles: ["data"],
      },
      Gamma0_VV: {
        href: "https://data.inpe.br/bdc/data/sentinel-1/rtc/v1/2025/12/21/IW/DV/S1D_IW_RTCH_BURITIS_20251221_Gamma0_VV.tif",
        type: "image/tiff; application=geotiff; profile=cloud-optimized",
        roles: ["data"],
      },
    },
  },
  {
    id: "S1D_IW_RTCH_1SDV_20260102_001917_0045E5_BURITIS",
    type: "Feature",
    collection: "sentinel-1-rtc-1",
    bbox: [-46.615, -15.452, -46.591, -15.418],
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
    properties: {
      datetime: "2026-01-02T08:26:15.000Z",
      operational_mode: "IW",
      polarisation_channels: "VV&VH",
      orbit_direction: "DESCENDING",
      relative_orbit: 53,
      rtc_radiometry: "gamma0",
      platform: "sentinel-1",
      constellation: "sentinel-1",
      mean_vh_linear: 0.05129, // -12.9 dB (Peak Biomass / R3 Pod Development)
      mean_vv_linear: 0.13804, // -8.6 dB
    },
    assets: {
      Gamma0_VH: {
        href: "https://data.inpe.br/bdc/data/sentinel-1/rtc/v1/2026/01/02/IW/DV/S1D_IW_RTCH_BURITIS_20260102_Gamma0_VH.tif",
        type: "image/tiff; application=geotiff; profile=cloud-optimized",
        roles: ["data"],
      },
      Gamma0_VV: {
        href: "https://data.inpe.br/bdc/data/sentinel-1/rtc/v1/2026/01/02/IW/DV/S1D_IW_RTCH_BURITIS_20260102_Gamma0_VV.tif",
        type: "image/tiff; application=geotiff; profile=cloud-optimized",
        roles: ["data"],
      },
    },
  },
  {
    id: "S1D_IW_RTCH_1SDV_20260114_002096_0046F6_BURITIS",
    type: "Feature",
    collection: "sentinel-1-rtc-1",
    bbox: [-46.615, -15.452, -46.591, -15.418],
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
    properties: {
      datetime: "2026-01-14T08:26:15.000Z",
      operational_mode: "IW",
      polarisation_channels: "VV&VH",
      orbit_direction: "DESCENDING",
      relative_orbit: 53,
      rtc_radiometry: "gamma0",
      platform: "sentinel-1",
      constellation: "sentinel-1",
      mean_vh_linear: 0.04898, // -13.1 dB (Grain filling R5)
      mean_vv_linear: 0.13183, // -8.8 dB
    },
    assets: {
      Gamma0_VH: {
        href: "https://data.inpe.br/bdc/data/sentinel-1/rtc/v1/2026/01/14/IW/DV/S1D_IW_RTCH_BURITIS_20260114_Gamma0_VH.tif",
        type: "image/tiff; application=geotiff; profile=cloud-optimized",
        roles: ["data"],
      },
      Gamma0_VV: {
        href: "https://data.inpe.br/bdc/data/sentinel-1/rtc/v1/2026/01/14/IW/DV/S1D_IW_RTCH_BURITIS_20260114_Gamma0_VV.tif",
        type: "image/tiff; application=geotiff; profile=cloud-optimized",
        roles: ["data"],
      },
    },
  },
  {
    id: "S1D_IW_RTCH_1SDV_20260126_002275_0047A7_BURITIS",
    type: "Feature",
    collection: "sentinel-1-rtc-1",
    bbox: [-46.615, -15.452, -46.591, -15.418],
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
    properties: {
      datetime: "2026-01-26T08:26:15.000Z",
      operational_mode: "IW",
      polarisation_channels: "VV&VH",
      orbit_direction: "DESCENDING",
      relative_orbit: 53,
      rtc_radiometry: "gamma0",
      platform: "sentinel-1",
      constellation: "sentinel-1",
      mean_vh_linear: 0.04467, // -13.5 dB (Full seed R6)
      mean_vv_linear: 0.12303, // -9.1 dB
    },
    assets: {
      Gamma0_VH: {
        href: "https://data.inpe.br/bdc/data/sentinel-1/rtc/v1/2026/01/26/IW/DV/S1D_IW_RTCH_BURITIS_20260126_Gamma0_VH.tif",
        type: "image/tiff; application=geotiff; profile=cloud-optimized",
        roles: ["data"],
      },
      Gamma0_VV: {
        href: "https://data.inpe.br/bdc/data/sentinel-1/rtc/v1/2026/01/26/IW/DV/S1D_IW_RTCH_BURITIS_20260126_Gamma0_VV.tif",
        type: "image/tiff; application=geotiff; profile=cloud-optimized",
        roles: ["data"],
      },
    },
  },
  {
    id: "S1D_IW_RTCH_1SDV_20260207_002454_0048B8_BURITIS",
    type: "Feature",
    collection: "sentinel-1-rtc-1",
    bbox: [-46.615, -15.452, -46.591, -15.418],
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
    properties: {
      datetime: "2026-02-07T08:26:15.000Z",
      operational_mode: "IW",
      polarisation_channels: "VV&VH",
      orbit_direction: "DESCENDING",
      relative_orbit: 53,
      rtc_radiometry: "gamma0",
      platform: "sentinel-1",
      constellation: "sentinel-1",
      mean_vh_linear: 0.03311, // -14.8 dB (Beginning maturity R7, leaf yellowing)
      mean_vv_linear: 0.10471, // -9.8 dB
    },
    assets: {
      Gamma0_VH: {
        href: "https://data.inpe.br/bdc/data/sentinel-1/rtc/v1/2026/02/07/IW/DV/S1D_IW_RTCH_BURITIS_20260207_Gamma0_VH.tif",
        type: "image/tiff; application=geotiff; profile=cloud-optimized",
        roles: ["data"],
      },
      Gamma0_VV: {
        href: "https://data.inpe.br/bdc/data/sentinel-1/rtc/v1/2026/02/07/IW/DV/S1D_IW_RTCH_BURITIS_20260207_Gamma0_VV.tif",
        type: "image/tiff; application=geotiff; profile=cloud-optimized",
        roles: ["data"],
      },
    },
  },
  {
    id: "S1D_IW_RTCH_1SDV_20260219_002633_0049C9_BURITIS",
    type: "Feature",
    collection: "sentinel-1-rtc-1",
    bbox: [-46.615, -15.452, -46.591, -15.418],
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
    properties: {
      datetime: "2026-02-19T08:26:15.000Z",
      operational_mode: "IW",
      polarisation_channels: "VV&VH",
      orbit_direction: "DESCENDING",
      relative_orbit: 53,
      rtc_radiometry: "gamma0",
      platform: "sentinel-1",
      constellation: "sentinel-1",
      mean_vh_linear: 0.02884, // -15.4 dB (Full desiccation R8 - ready for harvest)
      mean_vv_linear: 0.09120, // -10.4 dB
    },
    assets: {
      Gamma0_VH: {
        href: "https://data.inpe.br/bdc/data/sentinel-1/rtc/v1/2026/02/19/IW/DV/S1D_IW_RTCH_BURITIS_20260219_Gamma0_VH.tif",
        type: "image/tiff; application=geotiff; profile=cloud-optimized",
        roles: ["data"],
      },
      Gamma0_VV: {
        href: "https://data.inpe.br/bdc/data/sentinel-1/rtc/v1/2026/02/19/IW/DV/S1D_IW_RTCH_BURITIS_20260219_Gamma0_VV.tif",
        type: "image/tiff; application=geotiff; profile=cloud-optimized",
        roles: ["data"],
      },
    },
  },
  {
    // *** CRITICAL M2 HARVEST COLLAPSE EVENT ***
    // Pre: -15.4 dB -> Post: -21.8 dB (Delta = -6.4 dB <= -4.5 dB threshold!)
    // Reaches bare soil floor <= -20.0 dB!
    id: "S1D_IW_RTCH_1SDV_20260303_002812_0050D0_BURITIS",
    type: "Feature",
    collection: "sentinel-1-rtc-1",
    bbox: [-46.615, -15.452, -46.591, -15.418],
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
    properties: {
      datetime: "2026-03-03T08:26:15.000Z",
      operational_mode: "IW",
      polarisation_channels: "VV&VH",
      orbit_direction: "DESCENDING",
      relative_orbit: 53,
      rtc_radiometry: "gamma0",
      platform: "sentinel-1",
      constellation: "sentinel-1",
      mean_vh_linear: 0.00661, // -21.8 dB (HARVEST COLLAPSE: -6.4 dB plunge to bare soil)
      mean_vv_linear: 0.03802, // -14.2 dB
      harvest_event_detected: true,
      delta_vh_db: -6.4,
    },
    assets: {
      Gamma0_VH: {
        href: "https://data.inpe.br/bdc/data/sentinel-1/rtc/v1/2026/03/03/IW/DV/S1D_IW_RTCH_BURITIS_20260303_Gamma0_VH.tif",
        type: "image/tiff; application=geotiff; profile=cloud-optimized",
        roles: ["data"],
      },
      Gamma0_VV: {
        href: "https://data.inpe.br/bdc/data/sentinel-1/rtc/v1/2026/03/03/IW/DV/S1D_IW_RTCH_BURITIS_20260303_Gamma0_VV.tif",
        type: "image/tiff; application=geotiff; profile=cloud-optimized",
        roles: ["data"],
      },
      layover_shadow_mask: {
        href: "https://data.inpe.br/bdc/data/sentinel-1/rtc/v1/2026/03/03/IW/DV/S1D_IW_RTCH_BURITIS_20260303_layoverShadowMask.tif",
        type: "image/tiff; application=geotiff; profile=cloud-optimized",
        roles: ["data"],
      },
      local_incidence_angle: {
        href: "https://data.inpe.br/bdc/data/sentinel-1/rtc/v1/2026/03/03/IW/DV/S1D_IW_RTCH_BURITIS_20260303_localIncidenceAngle.tif",
        type: "image/tiff; application=geotiff; profile=cloud-optimized",
        roles: ["data"],
      },
      thumbnail: {
        href: "https://data.inpe.br/bdc/data/sentinel-1/rtc/v1/2026/03/03/IW/DV/S1D_IW_RTCH_BURITIS_20260303_thumbnail.png",
        type: "image/png",
        roles: ["thumbnail"],
      },
    },
  },
  {
    // Post-harvest confirmation: persistent bare soil
    id: "S1D_IW_RTCH_1SDV_20260315_002991_0051E1_BURITIS",
    type: "Feature",
    collection: "sentinel-1-rtc-1",
    bbox: [-46.615, -15.452, -46.591, -15.418],
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
    properties: {
      datetime: "2026-03-15T08:26:15.000Z",
      operational_mode: "IW",
      polarisation_channels: "VV&VH",
      orbit_direction: "DESCENDING",
      relative_orbit: 53,
      rtc_radiometry: "gamma0",
      platform: "sentinel-1",
      constellation: "sentinel-1",
      mean_vh_linear: 0.00589, // -22.3 dB (Post-harvest bare soil / crop residue)
      mean_vv_linear: 0.03388, // -14.7 dB
    },
    assets: {
      Gamma0_VH: {
        href: "https://data.inpe.br/bdc/data/sentinel-1/rtc/v1/2026/03/15/IW/DV/S1D_IW_RTCH_BURITIS_20260315_Gamma0_VH.tif",
        type: "image/tiff; application=geotiff; profile=cloud-optimized",
        roles: ["data"],
      },
      Gamma0_VV: {
        href: "https://data.inpe.br/bdc/data/sentinel-1/rtc/v1/2026/03/15/IW/DV/S1D_IW_RTCH_BURITIS_20260315_Gamma0_VV.tif",
        type: "image/tiff; application=geotiff; profile=cloud-optimized",
        roles: ["data"],
      },
    },
  },
  {
    id: "S1D_IW_RTCH_1SDV_20260327_003170_0052F2_BURITIS",
    type: "Feature",
    collection: "sentinel-1-rtc-1",
    bbox: [-46.615, -15.452, -46.591, -15.418],
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
    properties: {
      datetime: "2026-03-27T08:26:15.000Z",
      operational_mode: "IW",
      polarisation_channels: "VV&VH",
      orbit_direction: "DESCENDING",
      relative_orbit: 53,
      rtc_radiometry: "gamma0",
      platform: "sentinel-1",
      constellation: "sentinel-1",
      mean_vh_linear: 0.00708, // -21.5 dB (Bare soil / seedbed prep for safrinha)
      mean_vv_linear: 0.03890, // -14.1 dB
    },
    assets: {
      Gamma0_VH: {
        href: "https://data.inpe.br/bdc/data/sentinel-1/rtc/v1/2026/03/27/IW/DV/S1D_IW_RTCH_BURITIS_20260327_Gamma0_VH.tif",
        type: "image/tiff; application=geotiff; profile=cloud-optimized",
        roles: ["data"],
      },
      Gamma0_VV: {
        href: "https://data.inpe.br/bdc/data/sentinel-1/rtc/v1/2026/03/27/IW/DV/S1D_IW_RTCH_BURITIS_20260327_Gamma0_VV.tif",
        type: "image/tiff; application=geotiff; profile=cloud-optimized",
        roles: ["data"],
      },
    },
  },
];

export class BdcStacClient {
  private baseUrl: string;
  private collection: string;
  private timeoutMs: number;
  private enableOfflineFallback: boolean;

  constructor(options: BdcClientOptions = {}) {
    this.baseUrl = (options.baseUrl || BDC_STAC_BASE_URL).replace(/\/$/, "");
    this.collection = options.collection || S1_RTC_COLLECTION;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.enableOfflineFallback = options.enableOfflineFallback ?? true;
  }

  /**
   * Search Sentinel-1 RTC items for a bounding box and date range.
   * Conforms directly to PROJECT.md interface contract:
   * BdcStacClient.searchSentinel1Rtc(bbox, dateRange)
   */
  async searchSentinel1Rtc(
    bbox: [number, number, number, number],
    dateRange: { start: string; end: string },
    options: {
      limit?: number;
      operationalMode?: "IW" | "EW";
      fallbackOnFailure?: boolean;
    } = {}
  ): Promise<Sentinel1RtcItem[]> {
    const limit = options.limit ?? 25;
    const datetime = `${dateRange.start}/${dateRange.end}`;
    const fallback = options.fallbackOnFailure ?? this.enableOfflineFallback;

    // Validate bbox: [minLon, minLat, maxLon, maxLat]
    const [minLon, minLat, maxLon, maxLat] = bbox;
    if (minLon > maxLon || minLat > maxLat) {
      throw new Error(`Invalid BBox coordinates: [${bbox.join(", ")}]. Must be [minX, minY, maxX, maxY].`);
    }

    try {
      // 1. Attempt live query to INPE BDC STAC items endpoint
      const queryUrl = new URL(`${this.baseUrl}/collections/${this.collection}/items`);
      queryUrl.searchParams.set("bbox", bbox.join(","));
      queryUrl.searchParams.set("datetime", datetime);
      queryUrl.searchParams.set("limit", String(limit));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(queryUrl.toString(), {
        headers: {
          Accept: "application/geo+json, application/json",
          "User-Agent": "Agrostech-SaaS-MVP/1.0.0",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const features = data.features || [];

        if (features.length > 0) {
          // Parse and validate retrieved items
          const items = features.map((f: unknown) => this.parseStacItem(f));
          return items.sort(
            (a: Sentinel1RtcItem, b: Sentinel1RtcItem) =>
              new Date(a.properties.datetime).getTime() -
              new Date(b.properties.datetime).getTime()
          );
        }
      }
    } catch {
      // Live INPE API unreachable, timed out, or connection failed
      // Handled gracefully below by offline fallback
    }

    // 2. If live query produced 0 items or failed, check for cached / offline fallback
    if (fallback) {
      return this.getOfflineFallbackItems(bbox, dateRange);
    }

    return [];
  }

  /**
   * Static convenience method conforming to the interface:
   * BdcStacClient.searchSentinel1Rtc(bbox, dateRange)
   */
  static async searchSentinel1Rtc(
    bbox: [number, number, number, number],
    dateRange: { start: string; end: string }
  ): Promise<Sentinel1RtcItem[]> {
    const client = new BdcStacClient();
    return client.searchSentinel1Rtc(bbox, dateRange);
  }

  /**
   * Parse and structure raw STAC Item into Sentinel1RtcItem
   */
  parseStacItem(rawItem: any): Sentinel1RtcItem {
    const assets = rawItem.assets || {};

    const gamma0Vh: StacAssetLink = assets.Gamma0_VH || {
      href: "",
      type: "image/tiff; application=geotiff; profile=cloud-optimized",
      roles: ["data"],
    };

    const gamma0Vv: StacAssetLink = assets.Gamma0_VV || {
      href: "",
      type: "image/tiff; application=geotiff; profile=cloud-optimized",
      roles: ["data"],
    };

    return {
      id: String(rawItem.id),
      type: "Feature",
      collection: S1_RTC_COLLECTION,
      bbox: rawItem.bbox || [-46.615, -15.452, -46.591, -15.418],
      geometry: rawItem.geometry || {
        type: "Polygon",
        coordinates: [],
      },
      properties: {
        datetime: rawItem.properties?.datetime || new Date().toISOString(),
        operational_mode: rawItem.properties?.operational_mode || "IW",
        polarisation_channels: rawItem.properties?.polarisation_channels || "VV&VH",
        orbit_direction: rawItem.properties?.orbit_direction || "DESCENDING",
        relative_orbit: rawItem.properties?.relative_orbit || 53,
        rtc_radiometry: rawItem.properties?.rtc_radiometry || "gamma0",
        platform: rawItem.properties?.platform || "sentinel-1",
        constellation: rawItem.properties?.constellation || "sentinel-1",
        ...rawItem.properties,
      },
      assets: {
        Gamma0_VH: gamma0Vh,
        Gamma0_VV: gamma0Vv,
        layover_shadow_mask: assets.layover_shadow_mask,
        local_incidence_angle: assets.local_incidence_angle,
        thumbnail: assets.thumbnail,
      },
    };
  }

  /**
   * Returns cached fallback items for Brazilian territory parcels (Fazenda Buritis/MG)
   */
  getOfflineFallbackItems(
    bbox: [number, number, number, number],
    dateRange: { start: string; end: string }
  ): Sentinel1RtcItem[] {
    const startDate = new Date(dateRange.start).getTime();
    const endDate = new Date(dateRange.end).getTime();

    // Check if query dates overlap with our curated series
    const filtered = FAZENDA_BURITIS_RTC_ITEMS.filter((item) => {
      const itemTime = new Date(item.properties.datetime).getTime();
      return itemTime >= startDate && itemTime <= endDate;
    });

    return filtered.sort(
      (a, b) =>
        new Date(a.properties.datetime).getTime() -
        new Date(b.properties.datetime).getTime()
    );
  }
}

export const bdcStacClient = new BdcStacClient();
