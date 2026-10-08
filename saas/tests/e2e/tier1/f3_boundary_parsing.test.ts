/**
 * Tier 1 — Feature 3: Property, APP, and Reserva Legal Boundary Parsing & Structure
 * Requirement: ORIGINAL_REQUEST.md §R1 & PROJECT.md Feature 3
 */

import { testTier1, assertEqual, assertTrue, assertApprox } from "../harness";
import { RegistroRuralClient } from "@/lib/registrorural/client";
import { REFERENCE_CAR_CODES, FAZENDA_BURITIS_FIXTURE } from "../fixtures/reference_data";
import fs from "fs";
import path from "path";

export function registerF3Tests(): void {
  testTier1(
    "F3-01",
    "F3.1: Gross property perimeter parsing extracts total area, modulos fiscais, and WGS84 centroid",
    async () => {
      const client = new RegistroRuralClient({ apiKey: "test_key", isDemo: true });
      const result = await client.consultarDemonstrativo(REFERENCE_CAR_CODES.BURITIS);
      const cab = result.data.dados.cabecalho;

      assertApprox(cab.area, FAZENDA_BURITIS_FIXTURE.gross_area_ha, 0.1);
      assertTrue(cab.modulosFiscais > 0);
      assertApprox(cab.centroideX, -46.603, 0.05); // Buritis longitude
      assertApprox(cab.centroideY, -15.435, 0.05); // Buritis latitude
    }
  );

  testTier1(
    "F3-02",
    "F3.2: Permanent Preservation Area (APP) boundary metrics are correctly parsed",
    async () => {
      const client = new RegistroRuralClient({ apiKey: "test_key", isDemo: true });
      const result = await client.consultarDemonstrativo(REFERENCE_CAR_CODES.BURITIS);
      const areas = result.data.dados.areas;

      assertTrue(areas.areaAPP > 20 && areas.areaAPP < 35, `Parsed APP area: ${areas.areaAPP}`);
      assertTrue(typeof areas.areaAPPRecompor === "number");
    }
  );

  testTier1(
    "F3-03",
    "F3.3: Reserva Legal boundary metrics and Art. 15 APP overlap are parsed",
    async () => {
      const client = new RegistroRuralClient({ apiKey: "test_key", isDemo: true });
      const result = await client.consultarDemonstrativo(REFERENCE_CAR_CODES.BURITIS);
      const areas = result.data.dados.areas;

      assertTrue(areas.areaRLP > 40 && areas.areaRLP < 50, `Parsed RL area: ${areas.areaRLP}`);
      assertTrue(typeof areas.areaRLEmAPP === "number");
    }
  );

  testTier1(
    "F3-04",
    "F3.4: Reference GeoJSON polygon coordinates are topologically closed (p0 === pn)",
    () => {
      const polygonFilePath = path.join(process.cwd(), "buritis_real_polygon.json");
      assertTrue(fs.existsSync(polygonFilePath), "buritis_real_polygon.json must exist in project root");

      const fileContent = JSON.parse(fs.readFileSync(polygonFilePath, "utf8"));
      assertTrue(fileContent.geometry && fileContent.geometry.coordinates);

      const rings = fileContent.geometry.coordinates;
      assertTrue(Array.isArray(rings) && rings.length > 0);

      const exteriorRing = rings[0];
      assertTrue(exteriorRing.length >= 4, "Exterior ring must contain at least 4 coordinates");

      const firstPoint = exteriorRing[0];
      const lastPoint = exteriorRing[exteriorRing.length - 1];

      assertApprox(firstPoint[0], lastPoint[0], 0.0000001, "First and last longitude must match exactly");
      assertApprox(firstPoint[1], lastPoint[1], 0.0000001, "First and last latitude must match exactly");
    }
  );

  testTier1(
    "F3-05",
    "F3.5: Administrative easements and restricted use areas parse as non-negative quantities",
    async () => {
      const client = new RegistroRuralClient({ apiKey: "test_key", isDemo: true });
      const result = await client.consultarDemonstrativo(REFERENCE_CAR_CODES.BURITIS);
      const areas = result.data.dados.areas;

      assertTrue(areas.areaServidaoAdministrativa >= 0);
      assertTrue(areas.areaUsoRestrito >= 0);
      assertTrue(areas.areaSobreposicaoOutrosImoveis >= 0);
    }
  );
}
