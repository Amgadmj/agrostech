/**
 * Airbus Defence and Space TerraSAR-X / TanDEM-X Adapter
 * Modes: Staring Spotlight (0.25m), High Resolution Spotlight (1.0m), Stripmap (3.0m)
 */

import {
  CommercialTaskingParams,
  CommercialTaskingOrder,
} from "@/types/sar";
import { TaskingStateMachine } from "./stateMachine";

export class TerraSarXAdapter {
  readonly providerName = "terrasar_x" as const;

  /**
   * Calculates pricing for Airbus TerraSAR-X tasking
   */
  calculateEstimatedCostUsd(params: CommercialTaskingParams): number {
    let basePrice = 2800; // Stripmap 3.0m base
    if (params.resolutionMode === "SPOTLIGHT_0_25M") {
      basePrice = 6800; // Staring Spotlight
    } else if (params.resolutionMode === "SPOTLIGHT_1_00M") {
      basePrice = 4800; // High Resolution Spotlight
    }

    // Priority multiplier
    if (params.priority === "EMERGENCY_JUDICIAL") {
      basePrice += 3800;
    } else if (params.priority === "RUSH") {
      basePrice += 1800;
    }

    // Dual polarization surcharge
    if (params.polarization.startsWith("DUAL")) {
      basePrice += 1000;
    }

    return basePrice;
  }

  /**
   * Evaluates orbital pass feasibility for TerraSAR-X
   */
  evaluateFeasibility(params: CommercialTaskingParams): {
    feasible: boolean;
    orbitPassDirection: "ASCENDING" | "DESCENDING";
    nextPassWindowStart: string;
    nextPassWindowEnd: string;
  } {
    const start = new Date(params.acquisitionWindow.startDatetime);
    const end = new Date(params.acquisitionWindow.endDatetime);

    // TerraSAR-X has an 11-day repeat orbit, with 2.5-day repeat at varying incidence angles
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const feasible = diffHours >= 24;

    const passStart = new Date(start.getTime() + 12 * 3600 * 1000).toISOString();
    const passEnd = new Date(start.getTime() + 18 * 3600 * 1000).toISOString();

    return {
      feasible,
      orbitPassDirection: "ASCENDING",
      nextPassWindowStart: passStart,
      nextPassWindowEnd: passEnd,
    };
  }

  /**
   * Schedules a tasking order with Airbus TerraSAR-X
   */
  scheduleTasking(params: CommercialTaskingParams): CommercialTaskingOrder {
    const cost = this.calculateEstimatedCostUsd(params);
    const feasibility = this.evaluateFeasibility(params);

    if (!feasibility.feasible) {
      throw new Error(
        "TerraSAR-X orbital pass infeasible: acquisition window requires at least 24h orbital opportunity."
      );
    }

    const order = TaskingStateMachine.createOrder(params, cost, true);

    // Transition to SCHEDULED state
    TaskingStateMachine.transitionOrder(
      order.orderId,
      "SCHEDULED",
      `Airbus TerraSAR-X tasking accepted. Pass confirmed for ${feasibility.nextPassWindowStart}.`
    );

    return TaskingStateMachine.getOrder(order.orderId)!;
  }
}

export const terraSarXAdapter = new TerraSarXAdapter();
