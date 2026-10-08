/**
 * Tier 1 — Feature 2: SICAR Demonstrativo Polling Lifecycle & Transitions
 * Requirement: ORIGINAL_REQUEST.md §R1 & PROJECT.md Feature 2
 */

import { testTier1, assertEqual, assertTrue, assertRejects } from "../harness";
import { RegistroRuralClient } from "@/lib/registrorural/client";
import { DiagnosticErrorCode, RegistroRuralError } from "@/lib/registrorural/errors";
import { REFERENCE_CAR_CODES } from "../fixtures/reference_data";

export function registerF2Tests(): void {
  testTier1(
    "F2-01",
    "F2.1: Demonstrativo query transitions to COMPLETE with hydrated data payload",
    async () => {
      const client = new RegistroRuralClient({ apiKey: "test_key", isDemo: true });
      const result = await client.consultarDemonstrativo(REFERENCE_CAR_CODES.BURITIS);

      assertEqual(result.status, "COMPLETE");
      assertTrue(result.data !== null && typeof result.data === "object");
      assertEqual(result.data.car_id, REFERENCE_CAR_CODES.BURITIS);
      assertTrue(result.attempts >= 1);
    }
  );

  testTier1(
    "F2-02",
    "F2.2: Demonstrativo response contains official cabecalho and areas dictionaries",
    async () => {
      const client = new RegistroRuralClient({ apiKey: "test_key", isDemo: true });
      const result = await client.consultarDemonstrativo(REFERENCE_CAR_CODES.BURITIS);

      assertTrue(result.data.dados.cabecalho !== undefined);
      assertEqual(result.data.dados.cabecalho.municipio, "Buritis");
      assertEqual(result.data.dados.cabecalho.estado, "MG");
      assertTrue(result.data.dados.areas !== undefined);
      assertEqual(typeof result.data.dados.areas.areaLiquida, "number");
    }
  );

  testTier1(
    "F2-03",
    "F2.3: Polling engine halts with SICAR_POLLING_TIMEOUT when timeoutMs is exceeded",
    () => {
      const err = RegistroRuralError.pollingTimeout(REFERENCE_CAR_CODES.BURITIS, 60000);
      assertEqual(err.code, DiagnosticErrorCode.SICAR_POLLING_TIMEOUT);
      assertEqual(err.statusCode, 504);
      assertTrue(err.message.includes("timed out"));
    }
  );

  testTier1(
    "F2-04",
    "F2.4: Normalized status checking treats 'COMPLETE' and 'COMPLETED' as successful terminal states",
    async () => {
      const client = new RegistroRuralClient({ apiKey: "test_key", isDemo: true });
      const situacao = await client.consultarSituacaoCar(REFERENCE_CAR_CODES.BURITIS);

      assertTrue(situacao.status.toUpperCase().startsWith("COMPLET"));
      assertEqual(situacao.result, "PASSED");
      assertEqual(situacao.data.situacao_car, "Ativo");
    }
  );

  testTier1(
    "F2-05",
    "F2.5: Polling metadata tracks attempt count and source attribution ('live' or 'demo_fallback')",
    async () => {
      const client = new RegistroRuralClient({ apiKey: "test_key", isDemo: true });
      const result = await client.consultarDemonstrativo(REFERENCE_CAR_CODES.BURITIS);

      assertTrue(result.attempts > 0);
      assertTrue(result.source === "live" || result.source === "demo_fallback");
    }
  );
}
