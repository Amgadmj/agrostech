import { NextRequest, NextResponse } from "next/server";
import { Mcr29DossierGenerator } from "@/lib/dossier/generator";
import { DossierInputData } from "@/lib/dossier/types";
import { generateDossierPdfBuffer } from "@/lib/dossier/pdfGenerator";
import { checkApiAuth, unauthorizedResponse } from "@/lib/supabase/auth-guard";

export async function POST(req: NextRequest) {
  const auth = await checkApiAuth(req);
  if (!auth.authenticated) {
    return unauthorizedResponse();
  }
  try {
    const searchParams = req.nextUrl.searchParams;
    const formatQuery = searchParams.get("format");

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const carCode = body.carCode || body.car_code;
    if (!carCode || typeof carCode !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameter 'carCode' (or 'car_code')",
        },
        { status: 400 }
      );
    }

    const grossAreaHa = Number(body.grossAreaHa ?? body.gross_area_ha ?? 217.12);
    if (isNaN(grossAreaHa) || grossAreaHa <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Parameter 'grossAreaHa' must be a positive number",
        },
        { status: 400 }
      );
    }

    const inputData: DossierInputData = {
      carCode,
      farmName: body.farmName || body.farm_name || "Fazenda Buritis",
      municipality: body.municipality || "Buritis",
      stateUf: body.stateUf || body.state_uf || "MG",
      matricula: body.matricula || "MAT-29104-CRI-BURITIS",
      cprCode: body.cprCode || body.cpr_code,
      creditorName: body.creditorName || body.creditor_name,
      debtorName: body.debtorName || body.debtor_name,
      grossAreaHa,
      appAreaHa: body.appAreaHa ?? body.app_area_ha,
      legalReserveAreaHa: body.legalReserveAreaHa ?? body.legal_reserve_area_ha,
      rlInAppAreaHa: body.rlInAppAreaHa ?? body.rl_in_app_ha,
      easementsHa: body.easementsHa ?? body.easements_ha,
      restrictedUseHa: body.restrictedUseHa ?? body.restricted_use_ha,
      netPlantableAreaHa: body.netPlantableAreaHa ?? body.net_plantable_area_ha,
      sicarStatus: body.sicarStatus || body.sicar_status || "Ativo",
      embargoCount: body.embargoCount ?? body.embargo_count ?? 0,
      embargoesHa: body.embargoesHa ?? body.embargoes_ha ?? 0,
      hasIndigenousOverlap: body.hasIndigenousOverlap ?? body.has_indigenous_overlap ?? false,
      hasConservationUnitOverlap: body.hasConservationUnitOverlap ?? body.has_conservation_unit_overlap ?? false,
      hasSlaveLabor: body.hasSlaveLabor ?? body.has_slave_labor ?? false,
      sarSeriesPoints: body.sarSeriesPoints ?? body.sar_series_points ?? 6,
      sarHarvestDetected: body.sarHarvestDetected ?? body.sar_harvest_detected,
      sarHarvestDate: body.sarHarvestDate || body.sar_harvest_date,
      sarBaselineVerified: body.sarBaselineVerified ?? body.sar_baseline_verified ?? true,
      issuedAt: body.issuedAt || body.issued_at,
      caAuthority: body.caAuthority || body.ca_authority || "SERPRO",
    };

    const report = await Mcr29DossierGenerator.generateDossier(inputData);

    const requestedFormat = (formatQuery || body.format || "json").toLowerCase();

    if (requestedFormat === "pdf") {
      const pdfBuffer = generateDossierPdfBuffer(report);
      const safeCarCode = carCode.replace(/[^a-zA-Z0-9]/g, "_");
      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="dossie_mcr29_${safeCarCode}.pdf"`,
          "X-Dossier-SHA256": report.sha256Checksum,
          "X-MCR29-Status": report.mcr29Status,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error("Error generating MCR 2-9 dossier:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error while generating MCR 2-9 compliance report",
      },
      { status: 500 }
    );
  }
}
