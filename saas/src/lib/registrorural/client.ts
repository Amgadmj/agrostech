/**
 * Registro Rural API Gateway V2 Client
 * Handles authenticated SICAR demonstrativo extraction, asynchronous polling,
 * and R2C regulatory compliance checks (situação and restrições).
 *
 * Law 12.651/2012 & BCB Resolução CMN nº 5.267/2025 compliance.
 */

import {
  CarDemonstrativoResponse,
  CarDemonstrativoResult,
  DemonstrativoOptions,
  R2cRestricoesOptions,
  R2cRestricoesResponse,
  R2cSituacaoOptions,
  R2cSituacaoResponse,
} from "./types";
import { RegistroRuralError } from "./errors";
import { getFixtureForCar } from "./fixtures";

export class RegistroRuralClient {
  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly isDemoMode: boolean;

  constructor(config?: {
    apiKey?: string;
    baseUrl?: string;
    isDemo?: boolean;
  }) {
    this.apiKey = config?.apiKey ?? process.env.REGISTRO_RURAL_API_KEY;
    this.baseUrl = (
      config?.baseUrl ??
      process.env.REGISTRO_RURAL_BASE_URL ??
      "https://api-gateway-v2.registrorural.com.br"
    ).replace(/\/+$/, "");

    this.isDemoMode =
      config?.isDemo ??
      (process.env.INTEGRITY_MODE === "demo" ||
        process.env.ALLOW_MOCK_FALLBACK === "true" ||
        process.env.NODE_ENV === "test");
  }

  /**
   * Validate federal CAR alphanumeric format: UF-0000000-HEX32
   */
  public static isValidCarFormat(carCode: string): boolean {
    if (!carCode || typeof carCode !== "string") return false;
    const trimmed = carCode.trim();
    const federalCarPattern = /^[A-Z]{2}-\d{7}-[A-F0-9]{32}$/i;
    return federalCarPattern.test(trimmed);
  }

  /**
   * Helper sleep for async backoff
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check whether key is missing or invalid in strict mode
   */
  private checkAuth(strict?: boolean, allowFallback?: boolean): void {
    const isStrict = strict === true || (!this.isDemoMode && allowFallback !== true);

    if (!this.apiKey || this.apiKey.trim() === "") {
      if (isStrict) {
        throw RegistroRuralError.missingApiKey();
      }
    } else if (
      this.apiKey === "INVALID_KEY" ||
      this.apiKey === "EXPIRED" ||
      this.apiKey.startsWith("INVALID_")
    ) {
      if (isStrict) {
        throw RegistroRuralError.unauthorized(undefined, {
          reason: "Invalid API key provided",
        });
      }
    }
  }

  /**
   * Query official SICAR demonstrativo (GET /car/consulta/{numero_car}/demonstrativo)
   * Handles asynchronous polling from PENDING to COMPLETE with exponential backoff.
   */
  public async consultarDemonstrativo(
    carCode: string,
    options?: DemonstrativoOptions
  ): Promise<CarDemonstrativoResult> {
    const startTime = Date.now();

    // 1. CAR format validation
    if (!RegistroRuralClient.isValidCarFormat(carCode)) {
      throw RegistroRuralError.invalidCarFormat(carCode);
    }

    // 2. Strict Authentication check
    this.checkAuth(options?.strict, options?.allowDemoFallback);

    // 3. Fallback resolution if in demo mode or without live key
    const shouldFallback =
      (!this.apiKey || this.apiKey === "demo" || this.isDemoMode) &&
      options?.strict !== true;

    if (shouldFallback) {
      // Diagnostic log
      console.warn(
        `[RegistroRuralClient] Demo/Fallback mode active: resolving verified SICAR fixture for CAR ${carCode}.`
      );

      // Simulate network roundtrip latency if specified
      if (options?.initialDelayMs && options.initialDelayMs > 0) {
        await RegistroRuralClient.sleep(Math.min(options.initialDelayMs, 100));
      }

      const fixture = getFixtureForCar(carCode);
      if (!fixture) {
        throw RegistroRuralError.carNotFound(carCode);
      }
      return {
        status: "COMPLETE",
        data: fixture.demonstrativo,
        source: "demo_fallback",
        attempts: 1,
        elapsedMs: Date.now() - startTime,
      };
    }

    // 4. Live Gateway Query with Asynchronous Polling
    const maxAge = options?.maxAge ?? 7;
    const initialDelay = options?.initialDelayMs ?? 2000;
    const pollInterval = options?.pollIntervalMs ?? 3000;
    const backoffMultiplier = options?.backoffMultiplier ?? 1.2;
    const maxInterval = options?.maxIntervalMs ?? 6000;
    const maxAttempts = options?.maxAttempts ?? 20;
    const timeoutCeiling = options?.timeoutMs ?? 60000;

    let currentInterval = pollInterval;
    let attempt = 0;

    const requestUrl = `${this.baseUrl}/car/consulta/${encodeURIComponent(
      carCode
    )}/demonstrativo?max_age=${maxAge}`;

    // Initial delay before first poll if specified
    if (initialDelay > 0) {
      await RegistroRuralClient.sleep(initialDelay);
    }

    while (attempt < maxAttempts) {
      attempt++;
      const elapsed = Date.now() - startTime;
      if (elapsed >= timeoutCeiling) {
        throw RegistroRuralError.pollingTimeout(carCode, timeoutCeiling);
      }

      try {
        const response = await fetch(requestUrl, {
          method: "GET",
          headers: {
            "X-API-Key": this.apiKey!,
            Accept: "application/json",
          },
        });

        if (response.status === 401 || response.status === 403) {
          throw RegistroRuralError.unauthorized(carCode);
        }
        if (response.status === 402) {
          throw RegistroRuralError.insufficientCredits(carCode);
        }
        if (response.status === 404) {
          throw RegistroRuralError.carNotFound(carCode);
        }
        if (response.status === 429) {
          throw RegistroRuralError.rateLimited(carCode);
        }
        if (!response.ok) {
          throw new RegistroRuralError(
            "NETWORK_ERROR",
            `Upstream gateway error HTTP ${response.status}: ${response.statusText}`,
            response.status,
            carCode
          );
        }

        const json: CarDemonstrativoResponse = await response.json();

        if ((json as any).error) {
          const errMsg = String((json as any).error);
          if (errMsg.includes("Saldo insuficiente") || errMsg.includes("saldo")) {
            throw RegistroRuralError.insufficientCredits(carCode);
          }
          if (errMsg.includes("não encontrado")) {
            throw RegistroRuralError.carNotFound(carCode);
          }
        }

        const statusUpper = (json.status || "").toUpperCase();

        if (statusUpper.startsWith("COMPLET") && json.data) {
          return {
            status: "COMPLETE",
            data: json.data,
            source: "live",
            attempts: attempt,
            elapsedMs: Date.now() - startTime,
          };
        }

        // Status is PENDING or processing
        if (attempt >= maxAttempts) {
          throw RegistroRuralError.pollingTimeout(carCode, timeoutCeiling);
        }

        await RegistroRuralClient.sleep(currentInterval);
        currentInterval = Math.min(currentInterval * backoffMultiplier, maxInterval);
      } catch (err: unknown) {
        if (err instanceof RegistroRuralError) {
          throw err;
        }

        // Network error handling: fallback if permitted
        if (options?.allowDemoFallback !== false && this.isDemoMode) {
          console.warn(
            `[RegistroRuralClient] Live upstream fetch failed (${(err as Error).message}). Falling back to fixture for ${carCode}.`
          );
          const fixture = getFixtureForCar(carCode);
          if (!fixture) {
            throw RegistroRuralError.carNotFound(carCode);
          }
          return {
            status: "COMPLETE",
            data: fixture.demonstrativo,
            source: "demo_fallback",
            attempts: attempt,
            elapsedMs: Date.now() - startTime,
          };
        }

        throw new RegistroRuralError(
          "NETWORK_ERROR",
          `Falha de conexão com Registro Rural: ${(err as Error).message}`,
          502,
          carCode,
          err
        );
      }
    }

    throw RegistroRuralError.pollingTimeout(carCode, timeoutCeiling);
  }

  /**
   * Validate CAR legal status (/r2c/car/{numero_car}/situacao_car)
   * Resolves PASSED (Ativo/Pendente) or FAILED (Suspenso/Cancelado).
   */
  public async consultarSituacaoCar(
    carCode: string,
    options?: R2cSituacaoOptions
  ): Promise<R2cSituacaoResponse> {
    if (!RegistroRuralClient.isValidCarFormat(carCode)) {
      throw RegistroRuralError.invalidCarFormat(carCode);
    }

    this.checkAuth(options?.strict, options?.allowDemoFallback);

    const shouldFallback =
      (!this.apiKey || this.apiKey === "demo" || this.isDemoMode) &&
      options?.strict !== true;

    if (shouldFallback) {
      const fixture = getFixtureForCar(carCode);
      if (!fixture) {
        throw RegistroRuralError.carNotFound(carCode);
      }
      return fixture.situacao;
    }

    const maxAge = options?.dataMaxAge ?? 7;
    const approvedStatuses = options?.approvedStatuses ?? ["Ativo", "Pendente"];
    const requestUrl = `${this.baseUrl}/r2c/car/${encodeURIComponent(
      carCode
    )}/situacao_car?data_max_age=${maxAge}`;

    try {
      const response = await fetch(requestUrl, {
        method: "GET",
        headers: {
          "X-API-Key": this.apiKey!,
          Accept: "application/json",
        },
      });

      if (response.status === 401 || response.status === 403) {
        throw RegistroRuralError.unauthorized(carCode);
      }
      if (response.status === 404) {
        throw RegistroRuralError.carNotFound(carCode);
      }

      const json: R2cSituacaoResponse = await response.json();

      if ((json as any).error) {
        const errMsg = String((json as any).error);
        if (errMsg.includes("Saldo insuficiente") || errMsg.includes("saldo")) {
          throw RegistroRuralError.insufficientCredits(carCode);
        }
        if (errMsg.includes("não encontrado")) {
          throw RegistroRuralError.carNotFound(carCode);
        }
      }

      const statusCar = json.data?.situacao_car || "Ativo";
      const isApproved = approvedStatuses.includes(statusCar);

      return {
        status: "COMPLETED",
        result: isApproved ? "PASSED" : "FAILED",
        data: json.data,
        _metadata: {
          numero_car: carCode,
          data_max_age: maxAge,
          approved_statuses: approvedStatuses,
        },
      };
    } catch (err: unknown) {
      if (err instanceof RegistroRuralError) throw err;
      if (options?.allowDemoFallback !== false && this.isDemoMode) {
        const fixture = getFixtureForCar(carCode);
        if (!fixture) {
          throw RegistroRuralError.carNotFound(carCode);
        }
        return fixture.situacao;
      }
      throw new RegistroRuralError(
        "NETWORK_ERROR",
        `Erro ao consultar situação do CAR: ${(err as Error).message}`,
        502,
        carCode,
        err
      );
    }
  }

  /**
   * Validate SFB & environmental restrictions (/r2c/car/{numero_car}/restricoes_sicar)
   * Resolves PASSED (clean) or FAILED (active embargoes/overlaps).
   */
  public async consultarRestricoesSicar(
    carCode: string,
    options?: R2cRestricoesOptions
  ): Promise<R2cRestricoesResponse> {
    if (!RegistroRuralClient.isValidCarFormat(carCode)) {
      throw RegistroRuralError.invalidCarFormat(carCode);
    }

    this.checkAuth(options?.strict, options?.allowDemoFallback);

    const shouldFallback =
      (!this.apiKey || this.apiKey === "demo" || this.isDemoMode) &&
      options?.strict !== true;

    if (shouldFallback) {
      const fixture = getFixtureForCar(carCode);
      if (!fixture) {
        throw RegistroRuralError.carNotFound(carCode);
      }
      return fixture.restricoes;
    }

    const maxAge = options?.dataMaxAge ?? 7;
    const requestUrl = `${this.baseUrl}/r2c/car/${encodeURIComponent(
      carCode
    )}/restricoes_sicar?data_max_age=${maxAge}`;

    try {
      const response = await fetch(requestUrl, {
        method: "GET",
        headers: {
          "X-API-Key": this.apiKey!,
          Accept: "application/json",
        },
      });

      if (response.status === 401 || response.status === 403) {
        throw RegistroRuralError.unauthorized(carCode);
      }
      if (response.status === 404) {
        throw RegistroRuralError.carNotFound(carCode);
      }

      const json: R2cRestricoesResponse = await response.json();

      if ((json as any).error) {
        const errMsg = String((json as any).error);
        if (errMsg.includes("Saldo insuficiente") || errMsg.includes("saldo")) {
          throw RegistroRuralError.insufficientCredits(carCode);
        }
        if (errMsg.includes("não encontrado")) {
          throw RegistroRuralError.carNotFound(carCode);
        }
      }

      const hasRestrictions = (json.data?.restricoes?.length ?? 0) > 0;

      return {
        status: "COMPLETED",
        result: hasRestrictions ? "FAILED" : "PASSED",
        data: json.data,
        _metadata: {
          numero_car: carCode,
          data_max_age: maxAge,
        },
      };
    } catch (err: unknown) {
      if (err instanceof RegistroRuralError) throw err;
      if (options?.allowDemoFallback !== false && this.isDemoMode) {
        const fixture = getFixtureForCar(carCode);
        if (!fixture) {
          throw RegistroRuralError.carNotFound(carCode);
        }
        return fixture.restricoes;
      }
      throw new RegistroRuralError(
        "NETWORK_ERROR",
        `Erro ao consultar restrições do CAR: ${(err as Error).message}`,
        502,
        carCode,
        err
      );
    }
  }

  /**
   * Check wallet balance in Registro Rural account (GET /wallet/balance)
   */
  public async consultarSaldo(): Promise<{ balance: number }> {
    this.checkAuth(true);
    const requestUrl = `${this.baseUrl}/wallet/balance`;

    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        "X-API-Key": this.apiKey!,
        Accept: "application/json",
      },
    });

    if (response.status === 401 || response.status === 403) {
      throw RegistroRuralError.unauthorized();
    }

    if (!response.ok) {
      throw new RegistroRuralError(
        "NETWORK_ERROR",
        `Erro ao consultar saldo: HTTP ${response.status}`,
        response.status
      );
    }

    return response.json();
  }

  /**
   * Search real CAR codes by municipality/state (GET /car/busca/municipio_uf)
   */
  public async buscarPorMunicipio(
    municipio: string,
    uf: string
  ): Promise<{ total: number; data: string[] }> {
    this.checkAuth(true);
    const requestUrl = `${this.baseUrl}/car/busca/municipio_uf?municipio=${encodeURIComponent(
      municipio
    )}&uf=${encodeURIComponent(uf)}`;

    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        "X-API-Key": this.apiKey!,
        Accept: "application/json",
      },
    });

    if (response.status === 401 || response.status === 403) {
      throw RegistroRuralError.unauthorized();
    }

    return response.json();
  }

  // Static convenience delegates
  public static async consultarDemonstrativo(
    carCode: string,
    options?: DemonstrativoOptions
  ): Promise<CarDemonstrativoResult> {
    const client = new RegistroRuralClient();
    return client.consultarDemonstrativo(carCode, options);
  }

  public static async consultarSituacaoCar(
    carCode: string,
    options?: R2cSituacaoOptions
  ): Promise<R2cSituacaoResponse> {
    const client = new RegistroRuralClient();
    return client.consultarSituacaoCar(carCode, options);
  }

  public static async consultarRestricoesSicar(
    carCode: string,
    options?: R2cRestricoesOptions
  ): Promise<R2cRestricoesResponse> {
    const client = new RegistroRuralClient();
    return client.consultarRestricoesSicar(carCode, options);
  }
}

export const registroRuralClient = new RegistroRuralClient();
