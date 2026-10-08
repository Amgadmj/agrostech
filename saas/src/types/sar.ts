/**
 * Core SAR (Synthetic Aperture Radar) Types & Schemas
 * Dual-Track Architecture: INPE Sentinel-1 RTC L2 ARD + Commercial Sub-Meter Tasking
 */

export interface StacAssetLink {
  href: string;
  type?: string;
  title?: string;
  roles?: string[];
  [key: string]: unknown;
}

export interface Sentinel1RtcItem {
  id: string;
  type: "Feature";
  collection: "sentinel-1-rtc-1";
  bbox: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
  properties: {
    datetime: string;
    operational_mode?: "IW" | "EW";
    polarisation_channels?: "VV&VH" | "HH&HV" | "VV" | "VH";
    orbit_direction?: "ASCENDING" | "DESCENDING";
    relative_orbit?: number;
    rtc_radiometry?: "gamma0";
    platform?: string;
    constellation?: string;
    [key: string]: unknown;
  };
  assets: {
    Gamma0_VH: StacAssetLink;
    Gamma0_VV: StacAssetLink;
    layover_shadow_mask?: StacAssetLink;
    local_incidence_angle?: StacAssetLink;
    thumbnail?: StacAssetLink;
    [key: string]: StacAssetLink | undefined;
  };
}

export type StacItem = Sentinel1RtcItem;

export interface BDCStacSearchQuery {
  collections?: string[];
  bbox?: [number, number, number, number];
  intersects?: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
  datetime: string; // ISO-8601 interval: "start/end"
  limit?: number;
  query?: Record<string, unknown>;
}

export interface TemporalBackscatterPoint {
  date: string; // ISO-8601 (YYYY-MM-DD)
  gamma0_vv_db: number;
  gamma0_vh_db: number;
  vh_vv_ratio_db: number; // VH_dB - VV_dB (Cross-Polarization Ratio)
  pixelCount: number;
  stdDev_vh_db?: number;
  stdDev_vv_db?: number;
  is_harvest_event?: boolean;
}

export interface ClimateRefutationContext {
  precipitation_mm_48h: number;
  soil_moisture_index: number;
  rain_artifact_refuted: boolean;
}

export interface HarvestDetectionResult {
  harvestDetected: boolean;
  harvestDate?: string;
  dropMagnitudeDb: number; // Delta gamma0_VH <= -4.5 dB
  confidence: number; // 0 to 1
  bareSoilReached: boolean; // VH <= -20.0 dB
  preHarvestVhDb?: number;
  postHarvestVhDb?: number;
  alertLevel: 1 | 2 | 3 | 4 | 5;
  biomassLossPct?: number;
  weatherStatus?: "measured" | "unknown";
  persistenceStatus?: "confirmed" | "unconfirmed" | "provisional_awaiting_next_pass";
  cropType?: string;
  climateRefutation: {
    rainArtifactRefuted: boolean;
    sClimaIndex: number;
    precipitationMm48h: number;
    explanation: string;
  };
  recommendations: string[];
}

export type CommercialTaskingProvider = "umbra" | "terrasar_x";

export type CommercialResolutionMode =
  | "SPOTLIGHT_0_25M"
  | "SPOTLIGHT_0_50M"
  | "SPOTLIGHT_1_00M"
  | "STRIPMAP_3_00M";

export type CommercialPolarization =
  | "HH"
  | "VV"
  | "DUAL_HH_HV"
  | "DUAL_VV_VH";

export type CommercialPriority = "STANDARD" | "RUSH" | "EMERGENCY_JUDICIAL";

export type CommercialTaskingStatus =
  | "SUBMITTED"
  | "FEASIBILITY_REQUESTED"
  | "SCHEDULED"
  | "ACQUIRING"
  | "PROCESSING_L2_RTC"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

export interface CommercialTaskingParams {
  provider: CommercialTaskingProvider;
  farmId?: string;
  farm_id?: string;
  carCode?: string;
  car_code?: string;
  geometry: {
    type: "Polygon";
    coordinates: [number, number][][];
  };
  resolutionMode: CommercialResolutionMode;
  resolution_mode?: CommercialResolutionMode;
  polarization: CommercialPolarization;
  acquisitionWindow: {
    startDatetime: string;
    endDatetime: string;
  };
  acquisition_window?: {
    start_datetime?: string;
    end_datetime?: string;
  };
  priority?: CommercialPriority;
  targetIncidenceAngleDeg?: {
    min: number;
    max: number;
  };
  geometricConstraints?: {
    minGrazingAngleDeg?: number;
    maxGrazingAngleDeg?: number;
    passDirection?: "ASCENDING" | "DESCENDING" | "ANY";
    min_grazing_angle_deg?: number;
    max_grazing_angle_deg?: number;
    pass_direction?: "ASCENDING" | "DESCENDING" | "ANY";
  };
  geometric_constraints?: {
    minGrazingAngleDeg?: number;
    maxGrazingAngleDeg?: number;
    passDirection?: "ASCENDING" | "DESCENDING" | "ANY";
    min_grazing_angle_deg?: number;
    max_grazing_angle_deg?: number;
    pass_direction?: "ASCENDING" | "DESCENDING" | "ANY";
  };
  notes?: string;
}

export interface CommercialTaskingOrder {
  orderId: string;
  provider: CommercialTaskingProvider;
  status: CommercialTaskingStatus;
  createdAt: string;
  updatedAt: string;
  params: CommercialTaskingParams;
  feasibilityReport: {
    feasible: boolean;
    nextPassWindowStart?: string;
    nextPassWindowEnd?: string;
    orbitPassDirection?: "ASCENDING" | "DESCENDING";
    estimatedCostUsd: number;
    footprintAreaKm2: number;
  };
  delivery?: {
    productFormat: "COG" | "SICD" | "GEC";
    downloadUrl?: string;
    targetResolutionM: number;
    checksumSha256?: string;
  };
  statusHistory: Array<{
    status: CommercialTaskingStatus;
    timestamp: string;
    comment?: string;
  }>;
}
