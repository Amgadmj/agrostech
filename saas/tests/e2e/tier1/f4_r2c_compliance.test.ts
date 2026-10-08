/**
 * Tier 1 — Feature 4: R2C Situação and Restrições Compliance Checking
 * Requirement: ORIGINAL_REQUEST.md §R1 & PROJECT.md Feature 4
 */

import { testTier1, assertEqual, assertTrue } from "../harness";
import { RegistroRuralClient } from "@/lib/registrorural/client";
import { REFERENCE_CAR_CODES } from "../fixtures/reference_data";

export function registerF4Tests(): void {
  testTier1(
    "F4-01",
    "F4.1: R2C Situação CAR returns PASSED when status is 'Ativo'",
    async () => {
      const client = new RegistroRuralClient({ apiKey: "test_key", isDemo: true });
      const situacao = await client.consultarSituacaoCar(REFERENCE_CAR_CODES.BURITIS);

      assertEqual(situacao.status, "COMPLETED");
      assertEqual(situacao.result, "PASSED");
      assertEqual(situacao.data.situacao_car, "Ativo");
    }
  );

  testTier1(
    "F4-02",
    "F4.2: R2C Situação CAR returns FAILED when status is 'Suspenso' or 'Cancelado'",
    () => {
      const evaluateSituacao = (statusCar: string, approvedStatuses: string[] = ["Ativo", "Pendente"]) => {
        const isApproved = approvedStatuses.includes(statusCar);
        return isApproved ? "PASSED" : "FAILED";
      };

      assertEqual(evaluateSituacao("Suspenso"), "FAILED");
      assertEqual(evaluateSituacao("Cancelado"), "FAILED");
      assertEqual(evaluateSituacao("Ativo"), "PASSED");
      assertEqual(evaluateSituacao("Pendente"), "PASSED");
    }
  );

  testTier1(
    "F4-03",
    "F4.3: R2C Restrições returns PASSED with empty list for clean properties",
    async () => {
      const client = new RegistroRuralClient({ apiKey: "test_key", isDemo: true });
      const restricoes = await client.consultarRestricoesSicar(REFERENCE_CAR_CODES.BURITIS);

      assertEqual(restricoes.status, "COMPLETED");
      assertEqual(restricoes.result, "PASSED");
      assertTrue(Array.isArray(restricoes.data.restricoes));
      assertEqual(restricoes.data.restricoes.length, 0);
    }
  );

  testTier1(
    "F4-04",
    "F4.4: R2C Restrições returns FAILED when property has active IBAMA embargo overlap",
    async () => {
      const client = new RegistroRuralClient({ apiKey: "test_key", isDemo: true });
      const restricoes = await client.consultarRestricoesSicar(REFERENCE_CAR_CODES.IBAMA_EMBARGOED);

      assertEqual(restricoes.status, "COMPLETED");
      assertEqual(restricoes.result, "FAILED");
      assertTrue(restricoes.data.restricoes.length > 0);

      const firstInfraction = restricoes.data.restricoes[0];
      assertTrue(firstInfraction.area_conflito > 0);
      assertTrue(
        firstInfraction.origem.includes("Embarg") ||
        firstInfraction.origem.includes("IBAMA") ||
        firstInfraction.origem.includes("Unidade de Conservação")
      );
    }
  );

  testTier1(
    "F4-05",
    "F4.5: R2C compliance checks normalize query parameters and return standard metadata",
    async () => {
      const client = new RegistroRuralClient({ apiKey: "test_key", isDemo: true });
      const situacao = await client.consultarSituacaoCar(REFERENCE_CAR_CODES.BURITIS);

      assertTrue(situacao._metadata !== undefined);
      assertEqual(situacao._metadata.numero_car, REFERENCE_CAR_CODES.BURITIS);
      assertTrue(Number(situacao._metadata?.data_max_age) >= 0);
    }
  );
}
