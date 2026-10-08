/**
 * Authoritative Reference Fixtures for Agrostech E2E Tests
 * Derived from ORIGINAL_REQUEST.md, PROJECT.md, and Official Regulatory Specs
 */

export const REFERENCE_CAR_CODES = {
  BURITIS: "MG-3109300-4829A0D7314B4A45A7C49102B94C7192",
  MATO_GROSSO_GRAIN: "MT-5107909-ABCD1234EF567890ABCD1234EF567890",
  IBAMA_EMBARGOED: "PA-1507300-FC136733C09E4DEE9BFDBE8C016B2FE7",
  SUSPENDED_AMAZON: "AM-1304104-CFC3C82E13654D0C8F6F71B025E1FBBA",
  CLEAN_SOUTHERN: "RS-4300406-AD3BD4B621624DE4B3073DE8675E08A1",
  INVALID_FORMAT: "INVALID-CAR-CODE-999",
  NON_EXISTENT: "SP-3550308-00000000000000000000000000000000",
};

export const FAZENDA_BURITIS_FIXTURE = {
  car_code: REFERENCE_CAR_CODES.BURITIS,
  municipality: "Buritis",
  state_uf: "MG",
  gross_area_ha: 217.12,
  app_area_ha: 28.40,
  legal_reserve_area_ha: 43.42,
  rl_in_app_ha: 2.30,
  easements_ha: 0.00,
  restricted_use_ha: 0.00,
  disputed_area_ha: 0.00,
  public_overlaps_ha: 0.00,
  embargoes_ha: 0.00,
  consolidated_use_ha: 150.00,
  app_recompor_ha: 0.00,
  rl_recompor_ha: 0.00,
  // Derived expected metrics:
  // A_conservacao = 28.40 + 43.42 - 2.30 = 69.52 ha
  // D_total = 69.52 ha
  // A_dedutivo = 217.12 - 69.52 = 147.60 ha
  // A_consolidado = 150.00 ha
  // A_net = min(147.60, 150.00) = 147.60 ha
  expected_net_plantable_ha: 147.60,
  expected_preservation_ratio: 0.3202, // 69.52 / 217.12
  expected_net_arable_ratio: 0.6798,  // 147.60 / 217.12
  expected_credit_eligible: true,
  expected_cmn_5267_mandatory: false, // 217.12 ha <= 300 ha
};

export const MATO_GROSSO_GRAIN_FIXTURE = {
  car_code: REFERENCE_CAR_CODES.MATO_GROSSO_GRAIN,
  municipality: "Sorriso",
  state_uf: "MT",
  gross_area_ha: 1450.00,
  app_area_ha: 110.00,
  legal_reserve_area_ha: 507.50, // 35% in Cerrado Legal Amazon
  rl_in_app_ha: 15.00,
  easements_ha: 12.00,
  restricted_use_ha: 0.00,
  disputed_area_ha: 0.00,
  public_overlaps_ha: 0.00,
  embargoes_ha: 0.00,
  consolidated_use_ha: 850.00,
  expected_net_plantable_ha: 835.50, // 1450 - (110 + 507.5 - 15 + 12) = 1450 - 614.5 = 835.50 ha
  expected_cmn_5267_mandatory: true, // 1450.00 ha > 300 ha
  expected_credit_eligible: true,
};

export const EMBARGOED_PROPERTY_FIXTURE = {
  car_code: REFERENCE_CAR_CODES.IBAMA_EMBARGOED,
  municipality: "São Félix do Xingu",
  state_uf: "PA",
  gross_area_ha: 19993.21,
  app_area_ha: 1845.20,
  legal_reserve_area_ha: 15994.57, // 80% Amazon biome
  rl_in_app_ha: 0.00,
  embargoes_ha: 2450.00, // Active IBAMA embargo
  restricoes: [
    {
      id: 5,
      origem: "IBAMA",
      descricao: "Infração: Destruir, desmatar, danificar florestas nativas em área de preservação",
      area_conflito: 2450.00,
      data_registro: "13/03/2024",
    },
  ],
  expected_credit_eligible: false,
  expected_mcr_2_9_verdict: "IMPEDIDO",
};

export const SENTINEL_1_BURITIS_SERIES = [
  {
    date: "2025-11-15",
    gamma0_vv_db: -12.0,
    gamma0_vh_db: -18.2,
    vh_vv_ratio_db: -6.2,
    pixelCount: 2170,
    stage: "Planting / Early Emergence",
  },
  {
    date: "2025-12-09",
    gamma0_vv_db: -10.5,
    gamma0_vh_db: -15.8,
    vh_vv_ratio_db: -5.3,
    pixelCount: 2170,
    stage: "Vegetative Canopy Development",
  },
  {
    date: "2026-01-14",
    gamma0_vv_db: -9.8,
    gamma0_vh_db: -14.2,
    vh_vv_ratio_db: -4.4,
    pixelCount: 2170,
    stage: "Peak Reproductive Biomass (Soybean R5)",
  },
  {
    date: "2026-02-07",
    gamma0_vv_db: -10.2,
    gamma0_vh_db: -14.9,
    vh_vv_ratio_db: -4.7,
    pixelCount: 2170,
    stage: "Senescence / Field Desiccation",
  },
  {
    date: "2026-02-19",
    gamma0_vv_db: -14.8,
    gamma0_vh_db: -20.6, // Delta: -14.9 to -20.6 = -5.7 dB (<= -4.5 dB drop!)
    vh_vv_ratio_db: -5.8,
    pixelCount: 2170,
    stage: "Post-Harvest Bare Soil Event",
  },
  {
    date: "2026-03-03",
    gamma0_vv_db: -15.1,
    gamma0_vh_db: -21.0,
    vh_vv_ratio_db: -5.9,
    pixelCount: 2170,
    stage: "Confirmed Bare Soil (Persistent)",
  },
];

export const VALID_UMBRA_TASKING_PAYLOAD = {
  provider: "umbra" as const,
  farm_id: "550e8400-e29b-41d4-a716-446655440000",
  car_code: REFERENCE_CAR_CODES.BURITIS,
  geometry: {
    type: "Polygon" as const,
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
  resolution_mode: "SPOTLIGHT_0_25M" as const,
  polarization: "HH" as const,
  acquisition_window: {
    start_datetime: "2026-10-01T00:00:00Z",
    end_datetime: "2026-10-05T23:59:59Z",
  },
  geometric_constraints: {
    min_grazing_angle_deg: 40,
    max_grazing_angle_deg: 70,
    pass_direction: "ANY" as const,
  },
  priority: "EMERGENCY_JUDICIAL" as const,
};

export const VALID_TERRASAR_TASKING_PAYLOAD = {
  provider: "terrasar_x" as const,
  farm_id: "770e8400-e29b-41d4-a716-446655440001",
  car_code: REFERENCE_CAR_CODES.MATO_GROSSO_GRAIN,
  geometry: {
    type: "Polygon" as const,
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
  resolution_mode: "SPOTLIGHT_1_00M" as const,
  polarization: "DUAL_VV_VH" as const,
  acquisition_window: {
    start_datetime: "2026-10-02T00:00:00Z",
    end_datetime: "2026-10-08T23:59:59Z",
  },
  geometric_constraints: {
    min_grazing_angle_deg: 35,
    max_grazing_angle_deg: 65,
    pass_direction: "DESCENDING" as const,
  },
  priority: "RUSH" as const,
};
