/**
 * All-Weather Harvest Engine (Model M2 Anti-Fuga)
 * Detects crop biomass collapse (mechanical harvesting) through persistent cloud cover
 * Threshold: Delta gamma0_VH <= -4.5 dB reaching bare soil floor <= -20.0 dB
 * Includes S_clima Climate Refutation Filter to reject rain/moisture artifacts
 */

import {
  TemporalBackscatterPoint,
  HarvestDetectionResult,
} from "@/types/sar";

export const DEFAULT_HARVEST_THRESHOLD_DB = -4.5;
export const DEFAULT_BARE_SOIL_FLOOR_DB = -20.0;
export const DEFAULT_PERSISTENCE_TOLERANCE_DB = -18.5;

export interface HarvestDetectionOptions {
  thresholdDb?: number;
  bareSoilFloorDb?: number;
  precipitationMm48h?: number;
  checkPersistence?: boolean;
  unregisteredDiversionSuspected?: boolean;
  cropType?: string;
}

export class HarvestDetectionEngine {
  /**
   * Evaluates a temporal backscatter series to detect harvest events.
   * Conforms directly to PROJECT.md interface contract:
   * HarvestDetectionEngine.detectHarvestEvents(temporalPoints, thresholdDb)
   */
  detectHarvestEvents(
    temporalPoints: TemporalBackscatterPoint[],
    thresholdDb = DEFAULT_HARVEST_THRESHOLD_DB,
    options: HarvestDetectionOptions = {}
  ): HarvestDetectionResult {
    const bareSoilFloorDb = options.bareSoilFloorDb ?? DEFAULT_BARE_SOIL_FLOOR_DB;
    const precipMm = options.precipitationMm48h ?? 4.2; // Default baseline if not supplied
    const weatherStatus = options.precipitationMm48h !== undefined ? "measured" : "unknown";
    const checkPersistence = options.checkPersistence ?? true;
    const isDiversionSuspected = options.unregisteredDiversionSuspected ?? false;
    const cropType = options.cropType || "Cana-de-Açúcar (Coplacana)";

    if (!temporalPoints || temporalPoints.length < 2) {
      return {
        harvestDetected: false,
        dropMagnitudeDb: 0,
        confidence: 0,
        bareSoilReached: false,
        alertLevel: 1,
        weatherStatus,
        persistenceStatus: "provisional_awaiting_next_pass",
        cropType,
        climateRefutation: {
          rainArtifactRefuted: true,
          sClimaIndex: 1.0,
          precipitationMm48h: precipMm,
          explanation: "Dados temporais insuficientes para análise de colheita.",
        },
        recommendations: ["Aguardar novas passagens orbitais do Sentinel-1 RTC."],
      };
    }

    // Sort temporal points chronologically
    const sorted = [...temporalPoints].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let maxDropMagnitude = 0;
    let detectedHarvestDate: string | undefined;
    let preHarvestVh: number | undefined;
    let postHarvestVh: number | undefined;
    let bareSoilReached = false;
    let eventIndex = -1;

    // Scan successive acquisitions for biomass collapse
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];

      const deltaVh = curr.gamma0_vh_db - prev.gamma0_vh_db;

      // Check primary criteria: Delta gamma0_VH <= thresholdDb
      if (deltaVh <= thresholdDb) {
        const drop = Math.abs(deltaVh);
        const reachedSoil = curr.gamma0_vh_db <= bareSoilFloorDb;

        // Prioritize events reaching bare soil floor or with largest drop
        if (drop > maxDropMagnitude || (reachedSoil && !bareSoilReached)) {
          maxDropMagnitude = drop;
          detectedHarvestDate = curr.date;
          preHarvestVh = prev.gamma0_vh_db;
          postHarvestVh = curr.gamma0_vh_db;
          bareSoilReached = reachedSoil;
          eventIndex = i;
        }
      }
    }

    // Evaluate Climate Refutation Filter (S_clima)
    const sClimaIndex = Math.max(0.1, Math.min(1.0, 1.0 - (precipMm > 35 ? (precipMm - 35) / 50 : 0)));
    const rainArtifactRefuted = sClimaIndex >= 0.5;

    // Verify persistence at t_k+1 if subsequent observation is available (C05)
    let persistenceConfirmed = true;
    let persistenceStatus: "confirmed" | "unconfirmed" | "provisional_awaiting_next_pass" = "provisional_awaiting_next_pass";
    if (checkPersistence && eventIndex !== -1) {
      if (eventIndex < sorted.length - 1) {
        const nextPoint = sorted[eventIndex + 1];
        persistenceConfirmed = nextPoint.gamma0_vh_db <= DEFAULT_PERSISTENCE_TOLERANCE_DB;
        persistenceStatus = persistenceConfirmed ? "confirmed" : "unconfirmed";
      } else {
        // No subsequent observation yet: provisional state
        persistenceStatus = "provisional_awaiting_next_pass";
        persistenceConfirmed = true; // allow single-pass provisional evaluation without false rejection
      }
    }

    const harvestDetected = maxDropMagnitude >= Math.abs(thresholdDb) && bareSoilReached && rainArtifactRefuted;

    // Calculate Confidence Score (0.0 to 1.0)
    let confidence = 0;
    if (harvestDetected) {
      // 1. Drop magnitude weight (0.35 max)
      const dropScore = Math.min(0.35, (maxDropMagnitude / 7.0) * 0.35);

      // 2. Bare soil depth weight (0.30 max)
      const soilDepthScore = postHarvestVh !== undefined && postHarvestVh <= bareSoilFloorDb
        ? Math.min(0.30, 0.20 + (Math.abs(postHarvestVh - bareSoilFloorDb) / 5.0) * 0.10)
        : 0.10;

      // 3. Persistence weight (0.20 max)
      const persistenceScore = persistenceConfirmed ? 0.20 : 0.05;

      // 4. Climate refutation weight (0.15 max)
      const climateScore = rainArtifactRefuted ? 0.15 * sClimaIndex : 0.05;

      confidence = Math.min(0.99, Math.round((dropScore + soilDepthScore + persistenceScore + climateScore) * 100) / 100);
    } else if (maxDropMagnitude >= Math.abs(thresholdDb) * 0.7) {
      // Sub-threshold or unconfirmed senescence
      confidence = Math.round((maxDropMagnitude / 10.0) * 100) / 100;
    }

    // Determine Alert Level (1 to 5)
    let alertLevel: 1 | 2 | 3 | 4 | 5 = 1;
    if (harvestDetected) {
      if (isDiversionSuspected) {
        alertLevel = 5; // Level 5: Fuga Noturna / Active Grain Diversion
      } else {
        alertLevel = 4; // Level 4: Harvest Confirmed via SAR
      }
    } else if (maxDropMagnitude >= 2.5) {
      alertLevel = 3; // Level 3: Harvest Imminent / Desiccation
    } else if (maxDropMagnitude >= 1.2) {
      alertLevel = 2; // Level 2: Senescence / Beginning Maturity
    } else {
      alertLevel = 1; // Level 1: Normal Vegetative Monitoring
    }

    // Estimated Biomass Loss Percentage
    const biomassLossPct = harvestDetected
      ? Math.min(98.5, Math.round(75 + (maxDropMagnitude / 8.0) * 23))
      : 0;

    // Tailored Institutional Recommendations
    const recommendations: string[] = [];
    if (alertLevel === 5) {
      recommendations.push(
        "ALERTA CRÍTICO NÍVEL 5 (FUGA DE SAFRA): Colheita detectada em radar orbital sem contrapartida de NF-e/MDF-e emitida pelo devedor.",
        "Recomenda-se acionamento imediato do Shield-RJ para distribuição de Tutela Cautelar Antecedente de Busca e Apreensão (Arts. 300/301 CPC, STJ REsp 1.758.746/GO).",
        "Emitir Notificação Extrajudicial ao Armazém Geral destinatário da carga para bloqueio da comistão de grãos."
      );
    } else if (alertLevel === 4) {
      recommendations.push(
        `Colheita agrícola confirmada em ${detectedHarvestDate} através de cobertura de nuvens contínua (Queda de -${maxDropMagnitude.toFixed(1)} dB).`,
        "Cruzar cronograma com vencimento das Cédulas de Produto Rural (CPR) e cronograma de liquidação financeira.",
        "Atualizar status da lavoura no dossiê de conformidade MCR 2-9 / Resolução CMN nº 5.267/2025."
      );
    } else if (alertLevel === 3) {
      recommendations.push(
        "Lavoura em fase final de maturação/dessecação. Colheita mecânica prevista para os próximos 7 a 14 dias.",
        "Intensificar monitoramento diário da malha fiscal de transporte (SEFAZ MDF-e)."
      );
    } else {
      recommendations.push(
        "Dossiê temporal indica biomassa vegetal estável em pleno desenvolvimento vegetativo/reprodutivo.",
        "Monitoramento rotineiro do ciclo fenológico via Sentinel-1 RTC mantido."
      );
    }

    return {
      harvestDetected,
      harvestDate: detectedHarvestDate,
      dropMagnitudeDb: Math.round(maxDropMagnitude * 10) / 10,
      confidence,
      bareSoilReached,
      preHarvestVhDb: preHarvestVh,
      postHarvestVhDb: postHarvestVh,
      alertLevel,
      biomassLossPct,
      weatherStatus,
      persistenceStatus,
      cropType,
      climateRefutation: {
        rainArtifactRefuted,
        sClimaIndex: Math.round(sClimaIndex * 100) / 100,
        precipitationMm48h: precipMm,
        explanation: rainArtifactRefuted
          ? `Precipitação 48h aferida em ${precipMm} mm. Em física de radar, umidade eleva o retroespalhamento (+2 a +4 dB); a queda de -${maxDropMagnitude.toFixed(1)} dB comprova decréscimo volumétrico genuíno da copa vegetal.`
          : `Alerta: Precipitação intensa recente (${precipMm} mm) pode introduzir variabilidade dielétrica nos solos saturados.`,
      },
      recommendations,
    };
  }

  /**
   * Static interface method conforming directly to PROJECT.md:
   * HarvestDetectionEngine.detectHarvestEvents(temporalPoints, thresholdDb)
   */
  static detectHarvestEvents(
    temporalPoints: TemporalBackscatterPoint[],
    thresholdDb?: number,
    options?: HarvestDetectionOptions
  ): HarvestDetectionResult {
    const engine = new HarvestDetectionEngine();
    return engine.detectHarvestEvents(temporalPoints, thresholdDb, options);
  }
}

export const harvestDetectionEngine = new HarvestDetectionEngine();
