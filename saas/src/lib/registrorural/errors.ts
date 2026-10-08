/**
 * Diagnostic Error Catalogue for Registro Rural & SICAR Gateway
 * Adheres to Requirement R1 and BCB Resolução CMN 5.267/2025 audit standards.
 */

export const DiagnosticErrorCode = {
  CONFIG_MISSING_API_KEY: "CONFIG_MISSING_API_KEY",
  AUTH_UNAUTHORIZED: "AUTH_UNAUTHORIZED",
  BILLING_INSUFFICIENT_CREDITS: "BILLING_INSUFFICIENT_CREDITS",
  INVALID_CAR_FORMAT: "INVALID_CAR_FORMAT",
  CAR_NOT_FOUND: "CAR_NOT_FOUND",
  SICAR_POLLING_TIMEOUT: "SICAR_POLLING_TIMEOUT",
  POLLING_TIMEOUT: "POLLING_TIMEOUT",
  RATE_LIMITED: "RATE_LIMITED",
  NETWORK_ERROR: "NETWORK_ERROR",
} as const;

export type DiagnosticErrorCode = typeof DiagnosticErrorCode[keyof typeof DiagnosticErrorCode];

export class RegistroRuralError extends Error {
  public readonly code: DiagnosticErrorCode;
  public readonly statusCode: number;
  public readonly carCode?: string;
  public readonly details?: unknown;

  constructor(
    code: DiagnosticErrorCode,
    message: string,
    statusCode = 500,
    carCode?: string,
    details?: unknown
  ) {
    super(message);
    this.name = "RegistroRuralError";
    this.code = code;
    this.statusCode = statusCode;
    this.carCode = carCode;
    this.details = details;

    // Maintain proper stack trace for V8/Node.js
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RegistroRuralError);
    }
  }

  static missingApiKey(): RegistroRuralError {
    return new RegistroRuralError(
      DiagnosticErrorCode.CONFIG_MISSING_API_KEY,
      "HALT: Missing REGISTRO_RURAL_API_KEY in environment configuration. Required for Strict Production Mode.",
      500
    );
  }

  static unauthorized(carCode?: string, details?: unknown): RegistroRuralError {
    return new RegistroRuralError(
      DiagnosticErrorCode.AUTH_UNAUTHORIZED,
      "HALT: Unauthorized: Invalid, expired, or deactivated REGISTRO_RURAL_API_KEY.",
      401,
      carCode,
      details
    );
  }

  static insufficientCredits(carCode?: string): RegistroRuralError {
    return new RegistroRuralError(
      DiagnosticErrorCode.BILLING_INSUFFICIENT_CREDITS,
      "HALT: Registro Rural account credit balance exhausted. Add credits via dashboard.registrorural.com.br.",
      402,
      carCode
    );
  }

  static invalidCarFormat(carCode: string): RegistroRuralError {
    return new RegistroRuralError(
      DiagnosticErrorCode.INVALID_CAR_FORMAT,
      `CAR code does not match federal format (e.g. UF-0000000-HEX32). Received: '${carCode}'`,
      400,
      carCode
    );
  }

  static carNotFound(carCode: string): RegistroRuralError {
    return new RegistroRuralError(
      DiagnosticErrorCode.CAR_NOT_FOUND,
      `CAR não encontrado: Imóvel inexistente na base do SICAR/Registro Rural (${carCode}).`,
      404,
      carCode
    );
  }

  static pollingTimeout(carCode: string, timeoutMs: number): RegistroRuralError {
    return new RegistroRuralError(
      DiagnosticErrorCode.SICAR_POLLING_TIMEOUT,
      `SICAR upstream synchronization timed out after ${Math.round(timeoutMs / 1000)}s for CAR ${carCode}.`,
      504,
      carCode
    );
  }

  static rateLimited(carCode?: string): RegistroRuralError {
    return new RegistroRuralError(
      DiagnosticErrorCode.RATE_LIMITED,
      "Registro Rural rate limit exceeded. Retry after backoff interval.",
      429,
      carCode
    );
  }
}
