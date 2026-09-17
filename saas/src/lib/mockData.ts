import { LandParcel, Organization, UserProfile, TerritorialSubLayer } from "@/types/database";

export const MOCK_ORGANIZATIONS: Organization[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Banco AgroInvest S/A — Carteira Nacional Brasil",
    type: "bank",
    cnpj: "12.345.678/0001-90",
    created_at: "2026-01-10T12:00:00Z",
    updated_at: "2026-01-10T12:00:00Z",
  },
];

export const MOCK_USERS: Record<string, UserProfile> = {
  b2c: {
    id: "33333333-3333-3333-3333-333333333333",
    email: "produtor@buritis.agr.br",
    full_name: "Produtor Rural — Fazenda Buritis",
    role: "b2c",
    org_id: null,
    created_at: "2026-01-15T10:00:00Z",
    updated_at: "2026-01-15T10:00:00Z",
  },
  b2b_admin: {
    id: "44444444-4444-4444-4444-444444444444",
    email: "gestor.risco@agroinvest.com.br",
    full_name: "Gestor de Portfólio Agro & Risco",
    role: "b2b_admin",
    org_id: "11111111-1111-1111-1111-111111111111",
    organization: MOCK_ORGANIZATIONS[0],
    created_at: "2026-01-05T08:30:00Z",
    updated_at: "2026-01-05T08:30:00Z",
  },
};

/**
 * EXACT REAL PERIMETER OF FAZENDA BURITIS (217,12 ha), BURITIS - MG
 * Extracted directly from drone photogrammetry MDE grid and geo.json (SIRGAS 2000 / UTM 23S)
 * Bbox: Emin 326704.0, Emax 329248.5, Nmin 8291033.4, Nmax 8294762.3
 */
export const EXACT_BURITIS_COORDINATES: [number, number][] = [
  [-46.6093214, -15.4515796],
  [-46.6100189, -15.4510875],
  [-46.6106135, -15.4502391],
  [-46.6113757, -15.4494868],
  [-46.6127049, -15.4486330],
  [-46.6135008, -15.4479129],
  [-46.6140999, -15.4476488],
  [-46.6145674, -15.4476454],
  [-46.6145995, -15.4474828],
  [-46.6120798, -15.4455207],
  [-46.6117423, -15.4450686],
  [-46.6114747, -15.4450056],
  [-46.6111719, -15.4447156],
  [-46.6106683, -15.4443621],
  [-46.6091895, -15.4431391],
  [-46.6089224, -15.4431410],
  [-46.6079156, -15.4424990],
  [-46.6065036, -15.4412755],
  [-46.6054301, -15.4406339],
  [-46.6049626, -15.4406373],
  [-46.6041557, -15.4399289],
  [-46.6032850, -15.4396105],
  [-46.6029486, -15.4392882],
  [-46.6026815, -15.4392902],
  [-46.6020112, -15.4389703],
  [-46.6004692, -15.4382023],
  [-46.6002337, -15.4379767],
  [-46.5997488, -15.4357075],
  [-46.5993402, -15.4346715],
  [-46.5994030, -15.4341515],
  [-46.5991339, -15.4338938],
  [-46.5991294, -15.4333094],
  [-46.5989275, -15.4331160],
  [-46.5983056, -15.4303933],
  [-46.5979643, -15.4294217],
  [-46.5979613, -15.4290321],
  [-46.5974136, -15.4272828],
  [-46.5974102, -15.4268283],
  [-46.5970011, -15.4257274],
  [-46.5970589, -15.4245581],
  [-46.5965825, -15.4233927],
  [-46.5957539, -15.4198273],
  [-46.5954467, -15.4189529],
  [-46.5914441, -15.4238842],
  [-46.5947168, -15.4326918],
  [-46.5954678, -15.4348292],
  [-46.5955391, -15.4354131],
  [-46.5958092, -15.4358008],
  [-46.5960818, -15.4365131],
  [-46.5960847, -15.4369027],
  [-46.5963548, -15.4372904],
  [-46.5969020, -15.4389747],
  [-46.5971736, -15.4395572],
  [-46.5977797, -15.4402022],
  [-46.6026245, -15.4449074],
  [-46.6032315, -15.4456822],
  [-46.6043744, -15.4466480],
  [-46.6044431, -15.4469072],
  [-46.6046776, -15.4470029],
  [-46.6093214, -15.4515796],
];

/**
 * APP HÍDRICA (RIO URUCUIA) — 26,91 ha
 * Riparian buffer corridor along the eastern hydrological channel of Fazenda Buritis
 */
export const BURITIS_APP_COORDINATES: [number, number][] = [
  [-46.5954467, -15.4189529],
  [-46.5914441, -15.4238842],
  [-46.5947168, -15.4326918],
  [-46.5954678, -15.4348292],
  [-46.5958092, -15.4358008],
  [-46.5960818, -15.4365131],
  [-46.5963548, -15.4372904],
  [-46.5969020, -15.4389747],
  [-46.5975000, -15.4388000],
  [-46.5968000, -15.4360000],
  [-46.5962000, -15.4340000],
  [-46.5955000, -15.4300000],
  [-46.5942000, -15.4250000],
  [-46.5949000, -15.4215000],
  [-46.5954467, -15.4189529],
];

/**
 * RESERVA LEGAL CERRADO — 43,42 ha (20% of 217,12 ha)
 * Native Cerrado vegetation reserve in the southwestern sector of Fazenda Buritis
 */
export const BURITIS_RESERVA_LEGAL_COORDINATES: [number, number][] = [
  [-46.6093214, -15.4515796],
  [-46.6100189, -15.4510875],
  [-46.6106135, -15.4502391],
  [-46.6113757, -15.4494868],
  [-46.6127049, -15.4486330],
  [-46.6135008, -15.4479129],
  [-46.6140999, -15.4476488],
  [-46.6145674, -15.4476454],
  [-46.6145995, -15.4474828],
  [-46.6120798, -15.4455207],
  [-46.6110000, -15.4450000],
  [-46.6080000, -15.4465000],
  [-46.6055000, -15.4485000],
  [-46.6075000, -15.4505000],
  [-46.6093214, -15.4515796],
];

export const UBERABA_COORDINATES: [number, number][] = [
  [-47.92072, -19.742],
  [-47.9208646, -19.7363746],
  [-47.9256238, -19.7329915],
  [-47.9307063, -19.7320406],
  [-47.935, -19.73024],
  [-47.9404647, -19.7293244],
  [-47.94654, -19.7309126],
  [-47.9491354, -19.7363746],
  [-47.94826, -19.742],
  [-47.9444236, -19.7457503],
  [-47.9429337, -19.7496226],
  [-47.9400744, -19.7537702],
  [-47.935, -19.7567],
  [-47.9287546, -19.7564864],
  [-47.9249025, -19.7517015],
  [-47.9227494, -19.7468754],
  [-47.92072, -19.742],
];

export const SAO_PAULO_COORDINATES: [number, number][] = [
  [-47.8024, -21.175],
  [-47.801419, -21.1699103],
  [-47.8031206, -21.164252],
  [-47.8089727, -21.1618347],
  [-47.815, -21.16265],
  [-47.81942, -21.1653455],
  [-47.8224246, -21.1682825],
  [-47.8237307, -21.1717281],
  [-47.82655, -21.175],
  [-47.827611, -21.1797261],
  [-47.8261369, -21.1850763],
  [-47.8218309, -21.1899207],
  [-47.815, -21.1902],
  [-47.8093746, -21.1872876],
  [-47.805348, -21.1837328],
  [-47.8033591, -21.1793626],
  [-47.8024, -21.175],
];

export const MATO_GROSSO_COORDINATES: [number, number][] = [
  [-55.720, -12.550],
  [-55.710, -12.545],
  [-55.700, -12.555],
  [-55.705, -12.565],
  [-55.720, -12.560],
  [-55.720, -12.550],
];

export const BAHIA_COORDINATES: [number, number][] = [
  [-45.810, -12.095],
  [-45.795, -12.090],
  [-45.790, -12.105],
  [-45.805, -12.115],
  [-45.815, -12.105],
  [-45.810, -12.095],
];

export const PARANA_COORDINATES: [number, number][] = [
  [-53.465, -24.950],
  [-53.450, -24.945],
  [-53.445, -24.960],
  [-53.460, -24.970],
  [-53.470, -24.960],
  [-53.465, -24.950],
];

export const GOIAS_COORDINATES: [number, number][] = [
  [-50.930, -17.790],
  [-50.915, -17.785],
  [-50.910, -17.800],
  [-50.925, -17.810],
  [-50.935, -17.800],
  [-50.930, -17.790],
];

export const REAL_BURITIS_PARCELS: LandParcel[] = [
  {
    id: "buritis-gleba-sede",
    name: "Fazenda Buritis — Gleba Total (217,12 ha)",
    owner_id: "33333333-3333-3333-3333-333333333333",
    org_id: "11111111-1111-1111-1111-111111111111",
    car_code: "MG-3109300-4829A0D7314B4A45A7C49102B94C7192",
    matricula_code: "Matrícula 18.492 - CRI Buritis/MG",
    municipality: "Buritis",
    state_uf: "MG",
    geojson_boundary: {
      type: "Feature",
      properties: {
        id: "buritis-gleba-sede",
        name: "Fazenda Buritis — Gleba Total",
        nomenclature: "Polígono Cadastrado (Gleba)",
        category: "parcel",
        area_ha: 217.12,
        areaHa: 217.12,
        perimeter_m: 8420.0,
      },
      geometry: {
        type: "Polygon",
        coordinates: [EXACT_BURITIS_COORDINATES],
      },
    },
    layers: {
      app_zones: [
        {
          type: "Feature",
          properties: {
            id: "buritis-app-hidrica",
            name: "APP Hídrica (Rio Urucuia)",
            nomenclature: "APP Hídrica (Rio Urucuia)",
            category: "app",
            areaHa: 26.91,
            watershed: "Bacia do Rio São Francisco / Sub-bacia Rio Urucuia",
          },
          geometry: {
            type: "Polygon",
            coordinates: [BURITIS_APP_COORDINATES],
          },
        },
      ],
      legal_reserve: [
        {
          type: "Feature",
          properties: {
            id: "buritis-reserva-legal",
            name: "Reserva Legal Cerrado",
            nomenclature: "Reserva Legal Cerrado",
            category: "legal_reserve",
            areaHa: 43.42,
            biome: "Cerrado Nativo (Preservação 20%)",
          },
          geometry: {
            type: "Polygon",
            coordinates: [BURITIS_RESERVA_LEGAL_COORDINATES],
          },
        },
      ],
    },
    sub_layers: [
      {
        id: "buritis-gleba-total",
        type: "gleba",
        name: "Fazenda Buritis — Gleba Total",
        nomenclature: "Polígono Cadastrado (Gleba)",
        strokeColor: [0, 230, 118, 255],
        fillColor: [0, 230, 118, 40],
        strokeHex: "#00e676",
        linePattern: "solid",
        areaHa: 217.12,
        geometry: {
          type: "Polygon",
          coordinates: [EXACT_BURITIS_COORDINATES],
        },
      },
      {
        id: "buritis-sub-app",
        type: "app",
        name: "APP Hídrica (Rio Urucuia)",
        nomenclature: "APP Hídrica (Rio Urucuia)",
        strokeColor: [0, 229, 255, 255],
        fillColor: [0, 229, 255, 75],
        strokeHex: "#00e5ff",
        linePattern: "dashed",
        dashArray: [8, 4],
        areaHa: 26.91,
        geometry: {
          type: "Polygon",
          coordinates: [BURITIS_APP_COORDINATES],
        },
      },
      {
        id: "buritis-sub-reserve",
        type: "reserva_legal",
        name: "Reserva Legal Cerrado",
        nomenclature: "Reserva Legal Cerrado",
        strokeColor: [21, 128, 61, 255],
        fillColor: [21, 128, 61, 90],
        strokeHex: "#15803d",
        linePattern: "dotted",
        dashArray: [2, 3],
        areaHa: 43.42,
        geometry: {
          type: "Polygon",
          coordinates: [BURITIS_RESERVA_LEGAL_COORDINATES],
        },
      },
    ],
    metrics_json: {
      total_area_ha: 217.12,
      app_area_ha: 26.91,
      legal_reserve_area_ha: 43.42,
      consolidated_area_ha: 146.79,
      slope_avg_percent: 6.8,
      max_elevation_m: 1164.2,
      min_elevation_m: 768.9,
      carbon_stock_tco2e: 14280,
    },
    compliance_sicar: {
      status: "Ativo / Regular",
      has_app: true,
      legal_reserve_deficit_ha: 0,
      car_overlap_detected: false,
      last_sync: "2026-03-01T10:00:00Z",
    },
    compliance_sigef: {
      certified: true,
      code: "INCRA-SIGEF-MG-884219",
      tenure_status: "Titulação Registrada em Cartório (CRI Buritis)",
      technical_responsible: "Eng. Agrônomo CREA-MG 48192",
    },
    compliance_ibama: {
      is_embargoed: false,
      embargos_count: 0,
      records: [],
    },
    environmental_context: {
      biome: "Cerrado",
      watershed: "Bacia do Rio São Francisco / Sub-bacia Rio Urucuia",
      soil_type: "Latossolo Vermelho-Amarelo Distrófico",
      indigenous_overlap: false,
      conservation_unit_overlap: false,
    },
    model_3d_url: "https://dashboard-ui-liart-ten.vercel.app/",
    model_type: "glb",
    created_at: "2026-01-15T14:30:00Z",
    updated_at: "2026-03-01T10:00:00Z",
  },
];

export const REAL_UBERABA_PARCEL: LandParcel = {
  id: "uberaba-gleba-tres-barras",
  name: "Fazenda Três Barras — Gleba Grãos & Pecuária (646,48 ha)",
  owner_id: null,
  org_id: "11111111-1111-1111-1111-111111111111",
  car_code: "MG-3170107-59A30E418BF44B9E95B821A77E41C102",
  matricula_code: "Matrícula 45.819 - 1º CRI Uberaba/MG",
  municipality: "Uberaba",
  state_uf: "MG",
  geojson_boundary: {
    type: "Feature",
    properties: {
      id: "uberaba-gleba-tres-barras",
      name: "Fazenda Três Barras — Uberaba",
      nomenclature: "Polígono Cadastrado (Gleba)",
      category: "parcel",
      area_ha: 646.48,
      areaHa: 646.48,
      perimeter_m: 10240.0,
    },
    geometry: {
      type: "Polygon",
      coordinates: [UBERABA_COORDINATES],
    },
  },
  metrics_json: {
    total_area_ha: 646.48,
    app_area_ha: 52.30,
    legal_reserve_area_ha: 129.30,
    consolidated_area_ha: 464.88,
    slope_avg_percent: 4.2,
    max_elevation_m: 815.0,
    min_elevation_m: 742.0,
    carbon_stock_tco2e: 42100,
  },
  compliance_sicar: {
    status: "Ativo / Regular",
    has_app: true,
    legal_reserve_deficit_ha: 0,
    car_overlap_detected: false,
    last_sync: "2026-03-01T10:00:00Z",
  },
  compliance_sigef: {
    certified: true,
    code: "INCRA-SIGEF-MG-714092",
    tenure_status: "Titulação Registrada em Cartório (1º CRI Uberaba)",
    technical_responsible: "Eng. Agrônomo CREA-MG 62410",
  },
  compliance_ibama: {
    is_embargoed: false,
    embargos_count: 0,
    records: [],
  },
  environmental_context: {
    biome: "Cerrado (Triângulo Mineiro)",
    watershed: "Bacia Hidrográfica do Rio Grande / Sub-bacia Rio Uberaba",
    soil_type: "Latossolo Vermelho Distroférrico (Argiloso)",
    indigenous_overlap: false,
    conservation_unit_overlap: false,
  },
  model_3d_url: "https://dashboard-ui-liart-ten.vercel.app/",
  model_type: "glb",
  created_at: "2026-01-20T11:00:00Z",
  updated_at: "2026-03-01T10:00:00Z",
};

export const REAL_SAO_PAULO_PARCEL: LandParcel = {
  id: "ribeirao-preto-gleba-bela-vista",
  name: "Fazenda Bela Vista — Polo Agro Ribeirão Preto (623,25 ha)",
  owner_id: null,
  org_id: "11111111-1111-1111-1111-111111111111",
  car_code: "SP-3543402-99D812A45C674109B3E88172901AF3B4",
  matricula_code: "Matrícula 82.140 - 2º CRI Ribeirão Preto/SP",
  municipality: "Ribeirão Preto",
  state_uf: "SP",
  geojson_boundary: {
    type: "Feature",
    properties: {
      id: "ribeirao-preto-gleba-bela-vista",
      name: "Fazenda Bela Vista — Ribeirão Preto",
      nomenclature: "Polígono Cadastrado (Gleba)",
      category: "parcel",
      area_ha: 623.25,
      areaHa: 623.25,
      perimeter_m: 9860.0,
    },
    geometry: {
      type: "Polygon",
      coordinates: [SAO_PAULO_COORDINATES],
    },
  },
  metrics_json: {
    total_area_ha: 623.25,
    app_area_ha: 41.10,
    legal_reserve_area_ha: 124.65,
    consolidated_area_ha: 457.50,
    slope_avg_percent: 3.5,
    max_elevation_m: 610.0,
    min_elevation_m: 535.0,
    carbon_stock_tco2e: 38900,
  },
  compliance_sicar: {
    status: "Ativo / Regular",
    has_app: true,
    legal_reserve_deficit_ha: 0,
    car_overlap_detected: false,
    last_sync: "2026-03-01T10:00:00Z",
  },
  compliance_sigef: {
    certified: true,
    code: "INCRA-SIGEF-SP-912834",
    tenure_status: "Titulação Registrada em Cartório (2º CRI Ribeirão Preto)",
    technical_responsible: "Eng. Agrônomo CREA-SP 189204",
  },
  compliance_ibama: {
    is_embargoed: false,
    embargos_count: 0,
    records: [],
  },
  environmental_context: {
    biome: "Mata Atlântica / Transição Cerrado",
    watershed: "Bacia do Rio Pardo / Rio Mogi-Guaçu",
    soil_type: "Latossolo Vermelho Eutroférrico (Terra Roxa)",
    indigenous_overlap: false,
    conservation_unit_overlap: false,
  },
  model_3d_url: "https://dashboard-ui-liart-ten.vercel.app/",
  model_type: "glb",
  created_at: "2026-01-22T09:15:00Z",
  updated_at: "2026-03-01T10:00:00Z",
};

export const REAL_MATO_GROSSO_PARCEL: LandParcel = {
  id: "sorriso-gleba-ouro-verde",
  name: "Fazenda Ouro Verde — Polo Soja & Milho (1.240,00 ha)",
  owner_id: null,
  org_id: "11111111-1111-1111-1111-111111111111",
  car_code: "MT-5107909-6C8E91A0B2C3D4E5F67890123456789A",
  matricula_code: "Matrícula 31.402 - 1º CRI Sorriso/MT",
  municipality: "Sorriso",
  state_uf: "MT",
  geojson_boundary: {
    type: "Feature",
    properties: {
      id: "sorriso-gleba-ouro-verde",
      name: "Fazenda Ouro Verde — Sorriso",
      nomenclature: "Polígono Cadastrado (Gleba)",
      category: "parcel",
      area_ha: 1240.0,
      areaHa: 1240.0,
      perimeter_m: 14500.0,
    },
    geometry: {
      type: "Polygon",
      coordinates: [MATO_GROSSO_COORDINATES],
    },
  },
  metrics_json: {
    total_area_ha: 1240.0,
    app_area_ha: 112.4,
    legal_reserve_area_ha: 434.0, // 35% Cerrado Legal Reserve in Legal Amazon
    consolidated_area_ha: 693.6,
    slope_avg_percent: 2.1,
    max_elevation_m: 385.0,
    min_elevation_m: 350.0,
    carbon_stock_tco2e: 86400,
  },
  compliance_sicar: {
    status: "Ativo / Regular",
    has_app: true,
    legal_reserve_deficit_ha: 0,
    car_overlap_detected: false,
    last_sync: "2026-03-01T10:00:00Z",
  },
  compliance_sigef: {
    certified: true,
    code: "INCRA-SIGEF-MT-394012",
    tenure_status: "Titulação Plena Georreferenciada (CRI Sorriso)",
    technical_responsible: "Eng. Agrônomo CREA-MT 12948",
  },
  compliance_ibama: {
    is_embargoed: false,
    embargos_count: 0,
    records: [],
  },
  environmental_context: {
    biome: "Amazônia / Cerrado (Ecotono Norte MT)",
    watershed: "Bacia Hidrográfica do Rio Teles Pires",
    soil_type: "Latossolo Vermelho-Amarelo Eutrófico",
    indigenous_overlap: false,
    conservation_unit_overlap: false,
  },
  model_3d_url: "https://dashboard-ui-liart-ten.vercel.app/",
  model_type: "glb",
  created_at: "2026-02-01T10:00:00Z",
  updated_at: "2026-03-01T10:00:00Z",
};

export const REAL_BAHIA_PARCEL: LandParcel = {
  id: "lem-gleba-rio-janeiro",
  name: "Fazenda Rio de Janeiro — Fronteira Agrícola MATOPIBA (1.420,00 ha)",
  owner_id: null,
  org_id: "11111111-1111-1111-1111-111111111111",
  car_code: "BA-2919553-7F19D3B2E4A56C7D8E9F012345678901",
  matricula_code: "Matrícula 14.892 - CRI Luís Eduardo Magalhães/BA",
  municipality: "Luís Eduardo Magalhães",
  state_uf: "BA",
  geojson_boundary: {
    type: "Feature",
    properties: {
      id: "lem-gleba-rio-janeiro",
      name: "Fazenda Rio de Janeiro — LEM",
      nomenclature: "Polígono Cadastrado (Gleba)",
      category: "parcel",
      area_ha: 1420.0,
      areaHa: 1420.0,
      perimeter_m: 16200.0,
    },
    geometry: {
      type: "Polygon",
      coordinates: [BAHIA_COORDINATES],
    },
  },
  metrics_json: {
    total_area_ha: 1420.0,
    app_area_ha: 98.6,
    legal_reserve_area_ha: 284.0, // 20% Cerrado
    consolidated_area_ha: 1037.4,
    slope_avg_percent: 1.8,
    max_elevation_m: 780.0,
    min_elevation_m: 740.0,
    carbon_stock_tco2e: 79200,
  },
  compliance_sicar: {
    status: "Ativo / Regular",
    has_app: true,
    legal_reserve_deficit_ha: 0,
    car_overlap_detected: false,
    last_sync: "2026-03-01T10:00:00Z",
  },
  compliance_sigef: {
    certified: true,
    code: "INCRA-SIGEF-BA-481920",
    tenure_status: "Escritura Pública com Certificação INCRA",
    technical_responsible: "Eng. Cartógrafo CREA-BA 55190",
  },
  compliance_ibama: {
    is_embargoed: false,
    embargos_count: 0,
    records: [],
  },
  environmental_context: {
    biome: "Cerrado (Oeste Baiano / MATOPIBA)",
    watershed: "Bacia do Rio Grande / Afluente Rio São Francisco",
    soil_type: "Latossolo Vermelho-Amarelo Álico Arenoso",
    indigenous_overlap: false,
    conservation_unit_overlap: false,
  },
  model_3d_url: "https://dashboard-ui-liart-ten.vercel.app/",
  model_type: "glb",
  created_at: "2026-02-05T14:20:00Z",
  updated_at: "2026-03-01T10:00:00Z",
};

export const REAL_PARANA_PARCEL: LandParcel = {
  id: "cascavel-gleba-terra-roxa",
  name: "Fazenda Terra Roxa — Oeste Paranaense (530,00 ha)",
  owner_id: null,
  org_id: "11111111-1111-1111-1111-111111111111",
  car_code: "PR-4104808-1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D",
  matricula_code: "Matrícula 28.190 - 2º CRI Cascavel/PR",
  municipality: "Cascavel",
  state_uf: "PR",
  geojson_boundary: {
    type: "Feature",
    properties: {
      id: "cascavel-gleba-terra-roxa",
      name: "Fazenda Terra Roxa — Cascavel",
      nomenclature: "Polígono Cadastrado (Gleba)",
      category: "parcel",
      area_ha: 530.0,
      areaHa: 530.0,
      perimeter_m: 8900.0,
    },
    geometry: {
      type: "Polygon",
      coordinates: [PARANA_COORDINATES],
    },
  },
  metrics_json: {
    total_area_ha: 530.0,
    app_area_ha: 38.5,
    legal_reserve_area_ha: 106.0, // 20% Mata Atlântica
    consolidated_area_ha: 385.5,
    slope_avg_percent: 5.4,
    max_elevation_m: 720.0,
    min_elevation_m: 660.0,
    carbon_stock_tco2e: 49800,
  },
  compliance_sicar: {
    status: "Ativo / Regular",
    has_app: true,
    legal_reserve_deficit_ha: 0,
    car_overlap_detected: false,
    last_sync: "2026-03-01T10:00:00Z",
  },
  compliance_sigef: {
    certified: true,
    code: "INCRA-SIGEF-PR-901842",
    tenure_status: "Propriedade Registrada Plena (CRI Cascavel)",
    technical_responsible: "Eng. Agrônomo CREA-PR 41092",
  },
  compliance_ibama: {
    is_embargoed: false,
    embargos_count: 0,
    records: [],
  },
  environmental_context: {
    biome: "Mata Atlântica (Floresta Estacional Semidecidual)",
    watershed: "Bacia Hidrográfica do Rio Paraná / Sub-bacia Rio Piquiri",
    soil_type: "Nitossolo Vermelho Eutroférrico (Terra Roxa Legítima)",
    indigenous_overlap: false,
    conservation_unit_overlap: false,
  },
  model_3d_url: "https://dashboard-ui-liart-ten.vercel.app/",
  model_type: "glb",
  created_at: "2026-02-10T11:45:00Z",
  updated_at: "2026-03-01T10:00:00Z",
};

export const REAL_GOIAS_PARCEL: LandParcel = {
  id: "rio-verde-gleba-planalto",
  name: "Fazenda Planalto Central — Sudoeste Goiano (890,00 ha)",
  owner_id: null,
  org_id: "11111111-1111-1111-1111-111111111111",
  car_code: "GO-5218805-3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E",
  matricula_code: "Matrícula 52.190 - CRI Rio Verde/GO",
  municipality: "Rio Verde",
  state_uf: "GO",
  geojson_boundary: {
    type: "Feature",
    properties: {
      id: "rio-verde-gleba-planalto",
      name: "Fazenda Planalto Central — Rio Verde",
      nomenclature: "Polígono Cadastrado (Gleba)",
      category: "parcel",
      area_ha: 890.0,
      areaHa: 890.0,
      perimeter_m: 11800.0,
    },
    geometry: {
      type: "Polygon",
      coordinates: [GOIAS_COORDINATES],
    },
  },
  metrics_json: {
    total_area_ha: 890.0,
    app_area_ha: 68.2,
    legal_reserve_area_ha: 178.0, // 20% Cerrado
    consolidated_area_ha: 643.8,
    slope_avg_percent: 3.8,
    max_elevation_m: 850.0,
    min_elevation_m: 790.0,
    carbon_stock_tco2e: 61500,
  },
  compliance_sicar: {
    status: "Ativo / Regular",
    has_app: true,
    legal_reserve_deficit_ha: 0,
    car_overlap_detected: false,
    last_sync: "2026-03-01T10:00:00Z",
  },
  compliance_sigef: {
    certified: true,
    code: "INCRA-SIGEF-GO-678901",
    tenure_status: "Titulação Registrada em Cartório (CRI Rio Verde)",
    technical_responsible: "Eng. Agrônomo CREA-GO 29104",
  },
  compliance_ibama: {
    is_embargoed: false,
    embargos_count: 0,
    records: [],
  },
  environmental_context: {
    biome: "Cerrado (Planalto Central Goiano)",
    watershed: "Bacia do Rio Paranaíba / Sub-bacia Rio Verdão",
    soil_type: "Latossolo Vermelho Acriférrico (Muito Argiloso)",
    indigenous_overlap: false,
    conservation_unit_overlap: false,
  },
  model_3d_url: "https://dashboard-ui-liart-ten.vercel.app/",
  model_type: "glb",
  created_at: "2026-02-15T09:30:00Z",
  updated_at: "2026-03-01T10:00:00Z",
};

/**
 * Nationwide Portfolio representing Brazilian agricultural powerhouses:
 * - MG: Fazenda Buritis (217,12 ha) [Featured Benchmark Parcel]
 * - MG: Fazenda Três Barras (646,48 ha, Uberaba)
 * - SP: Fazenda Bela Vista (623,25 ha, Ribeirão Preto)
 * - MT: Fazenda Ouro Verde (1.240 ha, Sorriso)
 * - BA: Fazenda Rio de Janeiro (1.420 ha, LEM / MATOPIBA)
 * - PR: Fazenda Terra Roxa (530 ha, Cascavel)
 * - GO: Fazenda Planalto Central (890 ha, Rio Verde)
 */
export const ALL_PARCELS: LandParcel[] = [
  REAL_BURITIS_PARCELS[0],
  REAL_UBERABA_PARCEL,
  REAL_SAO_PAULO_PARCEL,
  REAL_MATO_GROSSO_PARCEL,
  REAL_BAHIA_PARCEL,
  REAL_PARANA_PARCEL,
  REAL_GOIAS_PARCEL,
];

export const MOCK_LAND_PARCELS = ALL_PARCELS;
