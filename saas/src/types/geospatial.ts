import { LandParcel, ComplianceIbama, ComplianceSicar, ComplianceSigef, EnvironmentalContext, LandParcelMetrics } from "./database";

export interface GeoJsonPolygonGeometry {
  type: "Polygon" | "MultiPolygon";
  coordinates: number[][][] | number[][][][];
}

export interface GeoJsonFeature {
  type: "Feature";
  properties: {
    id?: string;
    name?: string;
    category?: "parcel" | "app" | "legal_reserve" | "embargo";
    color?: [number, number, number, number];
    [key: string]: unknown;
  };
  geometry: GeoJsonPolygonGeometry;
}

export interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

export interface EnrichmentRequest {
  car_code?: string;
  matricula_code?: string;
  geojson?: GeoJsonFeature | GeoJsonFeatureCollection;
  name?: string;
  owner_id?: string;
  org_id?: string;
}

export interface EnrichmentStepLog {
  id: string;
  layer: "SICAR" | "SIGEF" | "IBGE_CPRM" | "IBAMA";
  title: string;
  detail: string;
  status: "pending" | "processing" | "success" | "warning" | "danger";
  duration_ms?: number;
  timestamp: string;
}

export interface EnrichedLandData {
  name: string;
  car_code: string;
  matricula_code: string;
  municipality: string;
  state_uf: string;
  geojson_boundary: GeoJsonFeature;
  layers: {
    app_zones: GeoJsonFeature[];
    legal_reserve: GeoJsonFeature[];
    ibama_embargos: GeoJsonFeature[];
  };
  metrics: LandParcelMetrics;
  compliance_sicar: ComplianceSicar;
  compliance_sigef: ComplianceSigef;
  compliance_ibama: ComplianceIbama;
  environmental_context: EnvironmentalContext;
  scorecard: {
    overall_status: "VERIFICADO" | "ALERTA" | "BLOQUEADO";
    score_esg: number; // 0 to 100
    risk_level: "BAIXO" | "MÉDIO" | "ALTO" | "CRÍTICO";
    credit_passport_eligible: boolean;
    recommendations: string[];
  };
  model_3d_url: string;
  model_type: "glb" | "3dtiles";
}
