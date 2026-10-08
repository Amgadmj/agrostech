/**
 * Umbra Space Canopy API Adapter
 * Sub-meter X-band Commercial SAR Tasking (0.25m - 1.0m Spotlight)
 */

import {
  CommercialTaskingParams,
  CommercialTaskingOrder,
} from "@/types/sar";
import { TaskingStateMachine } from "./stateMachine";

export class UmbraCanopyAdapter {
  readonly providerName = "umbra" as const;

  /**
   * Calculates pricing for Umbra Canopy tasking
   */
  calculateEstimatedCostUsd(params: CommercialTaskingParams): number {
    let basePrice = 3500; // 1.0m Spotlight base
    if (params.resolutionMode === "SPOTLIGHT_0_25M") {
      basePrice = 7500; // Ultra high-res 25cm
    } else if (params.resolutionMode === "SPOTLIGHT_0_50M") {
      basePrice = 5000; // 50cm
    }

    // Priority multiplier
    if (params.priority === "EMERGENCY_JUDICIAL") {
      basePrice += 4000;
    } else if (params.priority === "RUSH") {
      basePrice += 2000;
    }

    // Dual polarization surcharge
    if (params.polarization.startsWith("DUAL")) {
      basePrice += 1200;
    }

    return basePrice;
  }

  /**
   * Evaluates orbital pass feasibility for Umbra constellation
   */
  evaluateFeasibility(params: CommercialTaskingParams): {
    feasible: boolean;
    orbitPassDirection: "ASCENDING" | "DESCENDING";
    nextPassWindowStart: string;
    nextPassWindowEnd: string;
  } {
    const start = new Date(params.acquisitionWindow.startDatetime);
    const end = new Date(params.acquisitionWindow.endDatetime);

    // Revisit window: Umbra constellation has rapid daily revisit
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const feasible = diffHours >= 12;

    const passStart = new Date(start.getTime() + 4 * 3600 * 1000).toISOString();
    const passEnd = new Date(start.getTime() + 8 * 3600 * 1000).toISOString();

    return {
      feasible,
      orbitPassDirection: "DESCENDING",
      nextPassWindowStart: passStart,
      nextPassWindowEnd: passEnd,
    };
  }

  /**
   * Schedules a tasking order with Umbra Canopy
   */
  scheduleTasking(params: CommercialTaskingParams): CommercialTaskingOrder {
    const cost = this.calculateEstimatedCostUsd(params);
    const feasibility = this.evaluateFeasibility(params);

    if (!feasibility.feasible) {
      throw new Error(
        "Umbra orbital pass infeasible: acquisition window is shorter than constellation revisit window (min 12h)."
      );
    }

    const order = TaskingStateMachine.createOrder(params, cost, true);

    // Immediately schedule order
    TaskingStateMachine.transitionOrder(
      order.orderId,
      "SCHEDULED",
      `Umbra Canopy tasking confirmed. Satellite pass locked for ${feasibility.nextPassWindowStart}.`
    );

    return TaskingStateMachine.getOrder(order.orderId)!;
  }
}

export const umbraCanopyAdapter = new UmbraCanopyAdapter();
