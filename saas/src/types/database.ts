export type UserRole = "b2c" | "b2b_admin" | "b2b_viewer";

export interface Organization {
  id: string;
  name: string;
  type: "bank" | "agribusiness" | "investment_fund" | "cooperative" | "trader";
  cnpj?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  org_id?: string | null;
  organization?: Organization;
  created_at: string;
  updated_at: string;
}

export interface LandParcelMetrics {
  total_area_ha: number;
  app_area_ha: number;
  legal_reserve_area_ha: number;
  consolidated_area_ha: number;
  slope_avg_percent?: number;
  max_elevation_m?: number;
  min_elevation_m?: number;
  carbon_stock_tco2e?: number;
}

export interface ComplianceSicar {
  status: "Ativo / Regular" | "Pendente" | "Cancelado" | "Em Análise";
  has_app: boolean;
  legal_reserve_deficit_ha: number;
  car_overlap_detected: boolean;
  last_sync?: string;
}

export interface ComplianceSigef {
  certified: boolean;
  code: string | null;
  tenure_status: string;
  technical_responsible?: string;
}

export interface EmbargoRecord {
  process_num: string;
  infraction_term: string;
  embargo_date: string;
  intersection_area_ha?: number;
  reason?: string;
}

export interface ComplianceIbama {
  is_embargoed: boolean;
  embargos_count: number;
  records: EmbargoRecord[];
}

export interface EnvironmentalContext {
  biome: string;
  watershed?: string;
  soil_type?: string;
  indigenous_overlap: boolean;
  conservation_unit_overlap: boolean;
}

export interface TerritorialSubLayer {
  id: string;
  type: "gleba" | "app" | "reserva_legal";
  name: string;
  nomenclature: "Polígono Cadastrado (Gleba)" | "APP Hídrica (Rio Urucuia)" | "Reserva Legal Cerrado" | string;
  strokeColor: [number, number, number, number]; // RGBA
  fillColor: [number, number, number, number];   // RGBA
  strokeHex: string;
  linePattern: "solid" | "dashed" | "dotted";
  dashArray?: [number, number];
  areaHa: number;
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
}

export interface LandParcel {
  id: string;
  name: string;
  owner_id?: string | null;
  org_id?: string | null;
  car_code: string;
  matricula_code: string;
  municipality: string;
  state_uf: string;
  geojson_boundary: {
    type: "Feature";
    properties?: Record<string, unknown>;
    geometry: {
      type: "Polygon" | "MultiPolygon";
      coordinates: number[][][] | number[][][][];
    };
  };
  layers?: {
    app_zones?: Array<{
      type: "Feature";
      properties?: Record<string, unknown>;
      geometry: {
        type: "Polygon" | "MultiPolygon";
        coordinates: number[][][] | number[][][][];
      };
    }>;
    legal_reserve?: Array<{
      type: "Feature";
      properties?: Record<string, unknown>;
      geometry: {
        type: "Polygon" | "MultiPolygon";
        coordinates: number[][][] | number[][][][];
      };
    }>;
  };
  sub_layers?: TerritorialSubLayer[];
  metrics_json: LandParcelMetrics;
  compliance_sicar: ComplianceSicar;
  compliance_sigef: ComplianceSigef;
  compliance_ibama: ComplianceIbama;
  environmental_context: EnvironmentalContext;
  model_3d_url?: string | null;
  model_type: "glb" | "3dtiles";
  created_at: string;
  updated_at: string;
}

