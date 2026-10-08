/**
 * Tier 1 — Feature 1: Registro Rural Authentication & Diagnostic Error Codes
 * Requirement: ORIGINAL_REQUEST.md §R1 & PROJECT.md Feature 1
 */

import { testTier1, assertEqual, assertTrue, assertThrows, assertRejects } from "../harness";
import { RegistroRuralClient } from "@/lib/registrorural/client";
import { RegistroRuralError, DiagnosticErrorCode } from "@/lib/registrorural/errors";
import { REFERENCE_CAR_CODES } from "../fixtures/reference_data";

export function registerF1Tests(): void {
  testTier1(
    "F1-01",
    "F1.1: Missing REGISTRO_RURAL_API_KEY in strict mode throws CONFIG_MISSING_API_KEY with status 500",
    async () => {
      const client = new RegistroRuralClient({ apiKey: "", isDemo: false });
      await assertRejects(
        () => client.consultarDemonstrativo(REFERENCE_CAR_CODES.BURITIS),
        DiagnosticErrorCode.CONFIG_MISSING_API_KEY
      );
    }
  );

  testTier1(
    "F1-02",
    "F1.2: Invalid/expired API key in strict mode throws AUTH_UNAUTHORIZED with status 401",
    async () => {
      const client = new RegistroRuralClient({ apiKey: "INVALID_KEY", isDemo: false });
      await assertRejects(
        () => client.consultarDemonstrativo(REFERENCE_CAR_CODES.BURITIS),
        DiagnosticErrorCode.AUTH_UNAUTHORIZED
      );
    }
  );

  testTier1(
    "F1-03",
    "F1.3: Malformed CAR code format throws INVALID_CAR_FORMAT before network dispatch",
    async () => {
      const client = new RegistroRuralClient({ apiKey: "valid_dummy_key_12345678901234567890123456789012" });
      await assertRejects(
        () => client.consultarDemonstrativo("INVALID-CAR-CODE"),
        DiagnosticErrorCode.INVALID_CAR_FORMAT
      );
    }
  );

  testTier1(
    "F1-04",
    "F1.4: isValidCarFormat static validator enforces UF-0000000-HEX32 federal format",
    () => {
      // Valid Federal CAR format
      assertTrue(RegistroRuralClient.isValidCarFormat(REFERENCE_CAR_CODES.BURITIS));
      assertTrue(RegistroRuralClient.isValidCarFormat(REFERENCE_CAR_CODES.MATO_GROSSO_GRAIN));
      assertTrue(RegistroRuralClient.isValidCarFormat(REFERENCE_CAR_CODES.IBAMA_EMBARGOED));

      // Invalid formats
      assertEqual(RegistroRuralClient.isValidCarFormat(""), false);
      assertEqual(RegistroRuralClient.isValidCarFormat("BURITIS-MG"), false);
      assertEqual(RegistroRuralClient.isValidCarFormat("MG-123456-123456"), false);
      assertEqual(RegistroRuralClient.isValidCarFormat("MG-3109300-4829A0D7314B4A45A7C49102B94C719"), false); // 31 hex chars
    }
  );

  testTier1(
    "F1-05",
    "F1.5: Non-existent CAR code throws CAR_NOT_FOUND with status 404 in diagnostic error catalog",
    () => {
      const err = RegistroRuralError.carNotFound(REFERENCE_CAR_CODES.NON_EXISTENT);
      assertEqual(err.code, DiagnosticErrorCode.CAR_NOT_FOUND);
      assertEqual(err.statusCode, 404);
      assertTrue(err.message.includes("não encontrado"));
    }
  );

  testTier1(
    "F1-06",
    "F1.6: RegistroRuralError encapsulates HTTP status, diagnostic code, and maintains proper stack trace",
    () => {
      const error = RegistroRuralError.insufficientCredits("MG-3109300-4829A0D7314B4A45A7C49102B94C7192");
      assertEqual(error.code, DiagnosticErrorCode.BILLING_INSUFFICIENT_CREDITS);
      assertEqual(error.statusCode, 402);
      assertTrue(error.message.includes("credit balance exhausted"));
      assertTrue(error instanceof Error);
      assertTrue(error instanceof RegistroRuralError);
    }
  );
}
