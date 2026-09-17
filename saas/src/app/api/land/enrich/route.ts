import { NextResponse } from "next/server";
import { EnrichmentRequest, EnrichedLandData, EnrichmentStepLog, GeoJsonFeature } from "@/types/geospatial";
import { calculatePolygonAreaHa } from "@/lib/spatialUtils";

export async function POST(request: Request) {
  try {
    const body: EnrichmentRequest = await request.json();
    const { car_code, matricula_code, geojson, name } = body;

    // Simulate real-time concurrent spatial queries
    // In production with Supabase PostGIS, this calls `check_ibama_intersection` RPC
    // and queries public WFS/APIs. Here we simulate the concurrent fusion pipeline.

    const startTime = Date.now();
    const steps: EnrichmentStepLog[] = [];

    // Check if the car_code or geometry indicates an embargoed test scenario
    const isEmbargoedScenario = Boolean(
      car_code?.includes("MT-") ||
      car_code?.includes("EMBARGO") ||
      (geojson && JSON.stringify(geojson).includes("-55."))
    );

    // Step 1: SICAR Layer
    const sicarStart = Date.now();
    await new Promise((r) => setTimeout(r, 600)); // Latency simulation
    steps.push({
      id: "sicar-layer",
      layer: "SICAR",
      title: "SICAR Nacional (Cadastro Ambiental Rural)",
      detail: "Perímetro fundiário e demarcações de APP/Reserva Legal validados no sistema nacional.",
      status: "success",
      duration_ms: Date.now() - sicarStart,
      timestamp: new Date().toISOString(),
    });

    // Step 2: SIGEF / INCRA Layer
    const sigefStart = Date.now();
    await new Promise((r) => setTimeout(r, 500));
    steps.push({
      id: "sigef-layer",
      layer: "SIGEF",
      title: "SIGEF / INCRA (Malha Fundiária Certificada)",
      detail: "Georreferenciamento aprovado pelo INCRA e sem sobreposição com terras públicas.",
      status: "success",
      duration_ms: Date.now() - sigefStart,
      timestamp: new Date().toISOString(),
    });

    // Step 3: Environmental Context (IBGE/CPRM)
    const envStart = Date.now();
    await new Promise((r) => setTimeout(r, 450));
    steps.push({
      id: "ibge-layer",
      layer: "IBGE_CPRM",
      title: "IBGE & CPRM (Biomas & Recursos Hídricos)",
      detail: "Intersecção territorial com Bioma Cerrado. Bacia do Rio São Francisco identificada.",
      status: "success",
      duration_ms: Date.now() - envStart,
      timestamp: new Date().toISOString(),
    });

    // Step 4: IBAMA Embargo Compliance
    const ibamaStart = Date.now();
    await new Promise((r) => setTimeout(r, 700));
    steps.push({
      id: "ibama-layer",
      layer: "IBAMA",
      title: "IBAMA (Base Pública de Embargos Ambientais)",
      detail: isEmbargoedScenario
        ? "ALERTA CRÍTICO: 1 registro de embargo ambiental ativo interceptado pelo polígono do imóvel."
        : "Nenhum embargo ambiental ativo intersecta os limites da propriedade.",
      status: isEmbargoedScenario ? "danger" : "success",
      duration_ms: Date.now() - ibamaStart,
      timestamp: new Date().toISOString(),
    });

    // Establish GeoJSON polygon boundary
    let landBoundary: GeoJsonFeature;
    if (geojson && "geometry" in geojson && geojson.geometry) {
      landBoundary = geojson as GeoJsonFeature;
    } else if (geojson && "features" in geojson && geojson.features.length > 0) {
      landBoundary = geojson.features[0];
    } else {
      // Default to Buritis/MG realistic polygon coordinates
      landBoundary = {
        type: "Feature",
        properties: { name: name || "Gleba Rural Verificada" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-46.438, -15.635],
              [-46.418, -15.635],
              [-46.415, -15.618],
              [-46.432, -15.615],
              [-46.438, -15.635],
            ],
          ],
        },
      };
    }

    const calculatedArea =
      calculatePolygonAreaHa((landBoundary.geometry.coordinates as any)[0]) || 217.12;
    const appArea = Math.round(calculatedArea * 0.124 * 100) / 100;
    const reserveArea = Math.round(calculatedArea * 0.2 * 100) / 100;
    const consolidatedArea =
      Math.round((calculatedArea - appArea - reserveArea) * 100) / 100;

    // Derived APP sub-polygon (e.g. river buffer in blue)
    const appFeature: GeoJsonFeature = {
      type: "Feature",
      properties: { name: "APP Hídrica (Rio Urucuia)", category: "app" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-46.432, -15.630],
            [-46.422, -15.630],
            [-46.420, -15.626],
            [-46.430, -15.626],
            [-46.432, -15.630],
          ],
        ],
      },
    };

    // Derived Reserva Legal sub-polygon (in emerald green)
    const reserveFeature: GeoJsonFeature = {
      type: "Feature",
      properties: { name: "Reserva Legal Cerrado", category: "legal_reserve" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-46.428, -15.622],
            [-46.416, -15.622],
            [-46.415, -15.618],
            [-46.427, -15.618],
            [-46.428, -15.622],
          ],
        ],
      },
    };

    // Optional embargo polygon if flagged
    const embargoFeatures: GeoJsonFeature[] = isEmbargoedScenario
      ? [
          {
            type: "Feature",
            properties: {
              name: "Embargo IBAMA TAD-991204-A",
              category: "embargo",
            },
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [-46.424, -15.624],
                  [-46.418, -15.624],
                  [-46.418, -15.620],
                  [-46.424, -15.620],
                  [-46.424, -15.624],
                ],
              ],
            },
          },
        ]
      : [];

    const enrichedResult: EnrichedLandData = {
      name: name || "Fazenda Nova Esperança",
      car_code:
        car_code || "MG-3109300-4829A0D7314B4A45A7C49102B94C7192",
      matricula_code: matricula_code || "Matrícula 18.492 - CRI Buritis/MG",
      municipality: "Buritis",
      state_uf: "MG",
      geojson_boundary: landBoundary,
      layers: {
        app_zones: [appFeature],
        legal_reserve: [reserveFeature],
        ibama_embargos: embargoFeatures,
      },
      metrics: {
        total_area_ha: calculatedArea,
        app_area_ha: appArea,
        legal_reserve_area_ha: reserveArea,
        consolidated_area_ha: consolidatedArea,
        slope_avg_percent: 6.8,
        max_elevation_m: 892.4,
        min_elevation_m: 784.1,
        carbon_stock_tco2e: Math.round(calculatedArea * 65.7),
      },
      compliance_sicar: {
        status: "Ativo / Regular",
        has_app: true,
        legal_reserve_deficit_ha: 0,
        car_overlap_detected: false,
        last_sync: new Date().toISOString(),
      },
      compliance_sigef: {
        certified: true,
        code: "INCRA-SIGEF-MG-884219",
        tenure_status: "Certificação Georreferenciada Aprovada",
        technical_responsible: "Eng. Agrônomo CREA-MG 48192",
      },
      compliance_ibama: {
        is_embargoed: isEmbargoedScenario,
        embargos_count: isEmbargoedScenario ? 1 : 0,
        records: isEmbargoedScenario
          ? [
              {
                process_num: "02001.011293/2024-88",
                infraction_term: "TAD-991204-A",
                embargo_date: "2024-03-22",
                intersection_area_ha: 14.8,
                reason: "Sobreposição parcial com zona fiscalizada de proteção",
              },
            ]
          : [],
      },
      environmental_context: {
        biome: "Cerrado",
        watershed: "Bacia do Rio São Francisco / Sub-bacia Rio Urucuia",
        soil_type: "Latossolo Vermelho-Amarelo Distrófico",
        indigenous_overlap: false,
        conservation_unit_overlap: false,
      },
      scorecard: {
        overall_status: isEmbargoedScenario ? "BLOQUEADO" : "VERIFICADO",
        score_esg: isEmbargoedScenario ? 38 : 96,
        risk_level: isEmbargoedScenario ? "CRÍTICO" : "BAIXO",
        credit_passport_eligible: !isEmbargoedScenario,
        recommendations: isEmbargoedScenario
          ? [
              "Regularizar termo de embargo TAD-991204-A junto ao IBAMA antes de pleitear crédito.",
              "Solicitar desmembramento da gleba embargada ou termo de ajustamento de conduta (TAC).",
            ]
          : [
              "Propriedade 100% elegível para linhas de Crédito Rural Verde (Plano Safra / CRA Verde).",
              "Apto para geração de créditos de carbono por desmatamento evitado (REDD+).",
              "Cadastrar no Radar de Monitoramento Contínuo para alertas de invasão e fogo.",
            ],
      },
      model_3d_url: "https://assets.agrostech.xyz/models/fazenda-buritis.glb",
      model_type: "glb",
    };

    return NextResponse.json({
      success: true,
      data: enrichedResult,
      steps,
      elapsed_ms: Date.now() - startTime,
    });
  } catch (err: any) {
    console.error("Enrichment API error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to enrich land data" },
      { status: 500 }
    );
  }
}
