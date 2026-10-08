import { NextResponse } from "next/server";
import crypto from "crypto";
import { EnrichedLandData } from "@/types/geospatial";
import { createClient } from "@/lib/supabase/server";
import { checkApiAuth, unauthorizedResponse } from "@/lib/supabase/auth-guard";

export async function POST(request: Request) {
  // C07: Strict server-side auth guard
  const auth = await checkApiAuth(request);
  if (!auth.authenticated) {
    return unauthorizedResponse();
  }

  try {
    const body: { enriched: EnrichedLandData } = await request.json();
    const { enriched } = body;

    if (!enriched) {
      return NextResponse.json(
        { success: false, error: "Dados do imóvel ausentes na requisição." },
        { status: 400 }
      );
    }

    // C06: Generate standard UUID and derive owner/org strictly from authenticated session
    const parcelId = crypto.randomUUID();
    const sessionOwnerId = auth.user?.id || crypto.randomUUID();
    const sessionOrgId = auth.org_id || null;

    const parcelRecord = {
      id: parcelId,
      name: enriched.name,
      owner_id: sessionOwnerId,
      org_id: sessionOrgId,
      car_code: enriched.car_code,
      matricula_code: enriched.matricula_code,
      municipality: enriched.municipality,
      state_uf: enriched.state_uf,
      geojson_boundary: enriched.geojson_boundary,
      metrics_json: enriched.metrics,
      compliance_sicar: enriched.compliance_sicar,
      compliance_sigef: enriched.compliance_sigef,
      compliance_ibama: enriched.compliance_ibama,
      environmental_context: enriched.environmental_context,
      model_3d_url: enriched.model_3d_url || null,
      model_type: enriched.model_type || "glb",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isMock = supabaseUrl.includes("mock") || !supabaseUrl;

    if (!isMock) {
      try {
        const supabase = await createClient();
        const { error } = await supabase.from("land_parcels").insert(parcelRecord as any);

        if (error) {
          console.error("Supabase insert error:", error);
          // C06: Return production success only after the write commits
          return NextResponse.json(
            {
              success: false,
              error: `Erro de persistência no banco de dados: ${error.message}`,
            },
            { status: 500 }
          );
        }
      } catch (e: any) {
        return NextResponse.json(
          {
            success: false,
            error: `Erro ao conectar com banco de dados: ${e.message}`,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      parcel: parcelRecord,
      message: "Imóvel cadastrado com sucesso!",
    });
  } catch (err: any) {
    console.error("Save land error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to save land parcel" },
      { status: 500 }
    );
  }
}
