-- ==============================================================================
-- AGROSTECH SAAS - SEED DATA FOR TESTING & EVALUATION
-- ==============================================================================

-- 1. Insert Sample B2B Organization
INSERT INTO public.organizations (id, name, type, cnpj)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Banco AgroInvest S/A - Crédito Rural & ESG', 'bank', '12.345.678/0001-90'),
    ('22222222-2222-2222-2222-222222222222', 'Cerrado Capital Asset Management', 'investment_fund', '98.765.432/0001-10')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert IBAMA Embargos (Real spatial coordinates in Cerrado/Amazon for testing spatial intersections)
INSERT INTO public.ibama_embargos (id, process_num, infraction_term, cpf_cnpj, offender_name, embargo_date, municipality, state_uf, geom, description)
VALUES 
    (
        '99999999-9999-9999-9999-999999999991',
        '02001.004912/2023-14',
        'TAD-892182-E',
        '***.492.108-**',
        'Agropecuária Vale Verde Ltda',
        '2023-08-14',
        'Buritis',
        'MG',
        ST_Multi(ST_GeomFromGeoJSON('{
            "type": "Polygon",
            "coordinates": [[
                [-46.425, -15.620],
                [-46.415, -15.620],
                [-46.415, -15.610],
                [-46.425, -15.610],
                [-46.425, -15.620]
            ]]
        }')),
        'Supressão não autorizada de vegetação nativa no Bioma Cerrado'
    ),
    (
        '99999999-9999-9999-9999-999999999992',
        '02001.011293/2024-88',
        'TAD-991204-A',
        '***.821.391-**',
        'Fazenda Sol Nascente EIRELI',
        '2024-03-22',
        'Sorriso',
        'MT',
        ST_Multi(ST_GeomFromGeoJSON('{
            "type": "Polygon",
            "coordinates": [[
                [-55.720, -12.560],
                [-55.700, -12.560],
                [-55.700, -12.540],
                [-55.720, -12.540],
                [-55.720, -12.560]
            ]]
        }')),
        'Desmatamento em Área de Preservação Permanente (APP) hídrica'
    )
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Land Parcels (Fazenda Buritis - 217 ha, Fazenda Rio Preto - 1,420 ha)
INSERT INTO public.land_parcels (
    id,
    name,
    owner_id,
    org_id,
    car_code,
    matricula_code,
    municipality,
    state_uf,
    geom,
    geojson_boundary,
    metrics_json,
    compliance_sicar,
    compliance_sigef,
    compliance_ibama,
    environmental_context,
    model_3d_url,
    model_type
) VALUES 
(
    'a1b2c3d4-0001-4000-8000-000000000001',
    'Fazenda Buritis (Gleba Central)',
    '33333333-3333-3333-3333-333333333333', -- B2C Owner
    NULL,
    'MG-3109300-4829A0D7314B4A45A7C49102B94C7192',
    'Matrícula 18.492 - CRI Buritis/MG',
    'Buritis',
    'MG',
    ST_PolygonFromText('POLYGON((-46.438 -15.635, -46.418 -15.635, -46.415 -15.618, -46.432 -15.615, -46.438 -15.635))', 4326),
    '{
        "type": "Feature",
        "properties": { "name": "Fazenda Buritis" },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [-46.438, -15.635],
                [-46.418, -15.635],
                [-46.415, -15.618],
                [-46.432, -15.615],
                [-46.438, -15.635]
            ]]
        }
    }'::jsonb,
    '{
        "total_area_ha": 217.12,
        "app_area_ha": 26.91,
        "legal_reserve_area_ha": 43.42,
        "consolidated_area_ha": 146.79,
        "slope_avg_percent": 6.8,
        "max_elevation_m": 892.4,
        "min_elevation_m": 784.1
    }'::jsonb,
    '{
        "status": "Ativo / Regular",
        "has_app": true,
        "legal_reserve_deficit_ha": 0,
        "car_overlap_detected": false,
        "last_sync": "2026-03-01T10:00:00Z"
    }'::jsonb,
    '{
        "certified": true,
        "code": "INCRA-SIGEF-MG-884219",
        "tenure_status": "Titulação Registrada",
        "technical_responsible": "Eng. Agrônomo CREA-MG 48192"
    }'::jsonb,
    '{
        "is_embargoed": false,
        "embargos_count": 0,
        "records": []
    }'::jsonb,
    '{
        "biome": "Cerrado",
        "watershed": "Bacia do Rio São Francisco / Sub-bacia Rio Urucuia",
        "soil_type": "Latossolo Vermelho-Amarelo Distrófico",
        "indigenous_overlap": false,
        "conservation_unit_overlap": false
    }'::jsonb,
    'https://assets.agrostech.xyz/models/fazenda-buritis.glb',
    'glb'
),
(
    'a1b2c3d4-0002-4000-8000-000000000002',
    'Fazenda Rio Preto (Safra 2026)',
    NULL,
    '11111111-1111-1111-1111-111111111111', -- B2B Banco AgroInvest
    'MT-5107909-6C8E91A0B2C3D4E5F67890123456789A',
    'Matrícula 42.104 - CRI Sorriso/MT',
    'Sorriso',
    'MT',
    ST_PolygonFromText('POLYGON((-55.750 -12.580, -55.710 -12.580, -55.705 -12.535, -55.745 -12.530, -55.750 -12.580))', 4326),
    '{
        "type": "Feature",
        "properties": { "name": "Fazenda Rio Preto" },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [-55.750, -12.580],
                [-55.710, -12.580],
                [-55.705, -12.535],
                [-55.745, -12.530],
                [-55.750, -12.580]
            ]]
        }
    }'::jsonb,
    '{
        "total_area_ha": 1420.50,
        "app_area_ha": 112.40,
        "legal_reserve_area_ha": 497.10,
        "consolidated_area_ha": 811.00,
        "slope_avg_percent": 3.2,
        "max_elevation_m": 412.0,
        "min_elevation_m": 378.5
    }'::jsonb,
    '{
        "status": "Em Análise",
        "has_app": true,
        "legal_reserve_deficit_ha": 0,
        "car_overlap_detected": false
    }'::jsonb,
    '{
        "certified": true,
        "code": "INCRA-SIGEF-MT-994102",
        "tenure_status": "Certificação Georreferenciada Aprovada"
    }'::jsonb,
    '{
        "is_embargoed": true,
        "embargos_count": 1,
        "records": [
            {
                "process_num": "02001.011293/2024-88",
                "infraction_term": "TAD-991204-A",
                "embargo_date": "2024-03-22",
                "intersection_area_ha": 14.8,
                "reason": "Sobreposição parcial com zona de amortecimento fiscalizada"
            }
        ]
    }'::jsonb,
    '{
        "biome": "Amazônia / Transição Cerrado",
        "watershed": "Bacia do Rio Teles Pires",
        "soil_type": "Latossolo Vermelho Eutrófico",
        "indigenous_overlap": false,
        "conservation_unit_overlap": false
    }'::jsonb,
    'https://assets.agrostech.xyz/tilesets/rio-preto/tileset.json',
    '3dtiles'
),
(
    'a1b2c3d4-0003-4000-8000-000000000003',
    'Fazenda Santa Fé dos Cristais',
    NULL,
    '11111111-1111-1111-1111-111111111111', -- B2B Banco AgroInvest
    'GO-5205109-8812A4B789C01D2E3F45678901234567',
    'Matrícula 09.815 - CRI Cristalina/GO',
    'Cristalina',
    'GO',
    ST_PolygonFromText('POLYGON((-47.640 -16.790, -47.600 -16.790, -47.595 -16.750, -47.635 -16.745, -47.640 -16.790))', 4326),
    '{
        "type": "Feature",
        "properties": { "name": "Fazenda Santa Fé" },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [-47.640, -16.790],
                [-47.600, -16.790],
                [-47.595, -16.750],
                [-47.635, -16.745],
                [-47.640, -16.790]
            ]]
        }
    }'::jsonb,
    '{
        "total_area_ha": 890.30,
        "app_area_ha": 78.50,
        "legal_reserve_area_ha": 178.00,
        "consolidated_area_ha": 633.80,
        "slope_avg_percent": 4.5,
        "max_elevation_m": 980.0,
        "min_elevation_m": 915.0
    }'::jsonb,
    '{
        "status": "Ativo / Regular",
        "has_app": true,
        "legal_reserve_deficit_ha": 0,
        "car_overlap_detected": false
    }'::jsonb,
    '{
        "certified": true,
        "code": "INCRA-SIGEF-GO-330192",
        "tenure_status": "Concluído e averbado em cartório"
    }'::jsonb,
    '{
        "is_embargoed": false,
        "embargos_count": 0,
        "records": []
    }'::jsonb,
    '{
        "biome": "Cerrado",
        "watershed": "Bacia do Rio Paranaíba",
        "soil_type": "Latossolo Vermelho Argiloso",
        "indigenous_overlap": false,
        "conservation_unit_overlap": false
    }'::jsonb,
    'https://assets.agrostech.xyz/models/fazenda-santa-fe.glb',
    'glb'
),
(
    'a1b2c3d4-0004-4000-8000-000000000004',
    'Fazenda Três Barras (Uberaba/MG)',
    NULL,
    '11111111-1111-1111-1111-111111111111', -- B2B Banco AgroInvest
    'MG-3170107-59A30E418BF44B9E95B821A77E41C102',
    'Matrícula 45.819 - 1º CRI Uberaba/MG',
    'Uberaba',
    'MG',
    ST_PolygonFromText('POLYGON((-47.92072 -19.742, -47.92086 -19.73637, -47.92562 -19.73299, -47.93070 -19.73204, -47.935 -19.73024, -47.94046 -19.72932, -47.94654 -19.73091, -47.94913 -19.73637, -47.94826 -19.742, -47.94442 -19.74575, -47.94293 -19.74962, -47.94007 -19.75377, -47.935 -19.7567, -47.92875 -19.75648, -47.92490 -19.75170, -47.92274 -19.74687, -47.92072 -19.742))', 4326),
    '{
        "type": "Feature",
        "properties": { "name": "Fazenda Três Barras" },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
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
                [-47.92072, -19.742]
            ]]
        }
    }'::jsonb,
    '{
        "total_area_ha": 646.48,
        "app_area_ha": 52.30,
        "legal_reserve_area_ha": 129.30,
        "consolidated_area_ha": 464.88,
        "slope_avg_percent": 4.2,
        "max_elevation_m": 815.0,
        "min_elevation_m": 742.0
    }'::jsonb,
    '{
        "status": "Ativo / Regular",
        "has_app": true,
        "legal_reserve_deficit_ha": 0,
        "car_overlap_detected": false
    }'::jsonb,
    '{
        "certified": true,
        "code": "INCRA-SIGEF-MG-714092",
        "tenure_status": "Titulação Registrada em Cartório (1º CRI Uberaba)"
    }'::jsonb,
    '{
        "is_embargoed": false,
        "embargos_count": 0,
        "records": []
    }'::jsonb,
    '{
        "biome": "Cerrado (Triângulo Mineiro)",
        "watershed": "Bacia Hidrográfica do Rio Grande / Sub-bacia Rio Uberaba",
        "soil_type": "Latossolo Vermelho Distroférrico (Argiloso)",
        "indigenous_overlap": false,
        "conservation_unit_overlap": false
    }'::jsonb,
    'https://dashboard-ui-liart-ten.vercel.app/',
    'glb'
),
(
    'a1b2c3d4-0005-4000-8000-000000000005',
    'Fazenda Bela Vista (Ribeirão Preto/SP)',
    NULL,
    '11111111-1111-1111-1111-111111111111', -- B2B Banco AgroInvest
    'SP-3543402-99D812A45C674109B3E88172901AF3B4',
    'Matrícula 82.140 - 2º CRI Ribeirão Preto/SP',
    'Ribeirão Preto',
    'SP',
    ST_PolygonFromText('POLYGON((-47.8024 -21.175, -47.8014 -21.1699, -47.8031 -21.1642, -47.8089 -21.1618, -47.815 -21.1626, -47.8194 -21.1653, -47.8224 -21.1682, -47.8237 -21.1717, -47.8265 -21.175, -47.8276 -21.1797, -47.8261 -21.1850, -47.8218 -21.1899, -47.815 -21.1902, -47.8093 -21.1872, -47.8053 -21.1837, -47.8033 -21.1793, -47.8024 -21.175))', 4326),
    '{
        "type": "Feature",
        "properties": { "name": "Fazenda Bela Vista" },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
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
                [-47.8024, -21.175]
            ]]
        }
    }'::jsonb,
    '{
        "total_area_ha": 623.25,
        "app_area_ha": 41.10,
        "legal_reserve_area_ha": 124.65,
        "consolidated_area_ha": 457.50,
        "slope_avg_percent": 3.5,
        "max_elevation_m": 610.0,
        "min_elevation_m": 535.0
    }'::jsonb,
    '{
        "status": "Ativo / Regular",
        "has_app": true,
        "legal_reserve_deficit_ha": 0,
        "car_overlap_detected": false
    }'::jsonb,
    '{
        "certified": true,
        "code": "INCRA-SIGEF-SP-912834",
        "tenure_status": "Titulação Registrada em Cartório (2º CRI Ribeirão Preto)"
    }'::jsonb,
    '{
        "is_embargoed": false,
        "embargos_count": 0,
        "records": []
    }'::jsonb,
    '{
        "biome": "Mata Atlântica / Transição Cerrado",
        "watershed": "Bacia do Rio Pardo / Rio Mogi-Guaçu",
        "soil_type": "Latossolo Vermelho Eutroférrico (Terra Roxa)",
        "indigenous_overlap": false,
        "conservation_unit_overlap": false
    }'::jsonb,
    'https://dashboard-ui-liart-ten.vercel.app/',
    'glb'
)
ON CONFLICT (id) DO NOTHING;
