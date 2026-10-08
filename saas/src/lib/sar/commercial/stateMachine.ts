/**
 * Commercial SAR Tasking Order Lifecycle State Machine
 * States: SUBMITTED -> SCHEDULED -> ACQUIRING -> COMPLETED
 * Supports intermediate and terminal states: FEASIBILITY_REQUESTED, PROCESSING_L2_RTC, REJECTED, CANCELLED
 */

import {
  CommercialTaskingOrder,
  CommercialTaskingStatus,
  CommercialTaskingParams,
} from "@/types/sar";
import { calculatePolygonAreaHa } from "@/lib/spatialUtils";
import { durableJobStore } from "@/lib/jobs/durableJobStore";

export const ALLOWED_STATUS_TRANSITIONS: Record<
  CommercialTaskingStatus,
  CommercialTaskingStatus[]
> = {
  SUBMITTED: ["FEASIBILITY_REQUESTED", "SCHEDULED", "REJECTED"],
  FEASIBILITY_REQUESTED: ["SCHEDULED", "REJECTED", "CANCELLED"],
  SCHEDULED: ["ACQUIRING", "CANCELLED"],
  ACQUIRING: ["PROCESSING_L2_RTC", "COMPLETED", "CANCELLED"],
  PROCESSING_L2_RTC: ["COMPLETED"],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
};

export class TaskingStateMachine {
  private static ordersStore: Map<string, CommercialTaskingOrder> = new Map();

  /**
   * Checks whether a status transition is permitted.
   */
  static canTransition(
    currentStatus: CommercialTaskingStatus,
    targetStatus: CommercialTaskingStatus
  ): boolean {
    const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
    return allowed.includes(targetStatus);
  }

  /**
   * Creates a new Commercial SAR tasking order in SUBMITTED state.
   */
  static createOrder(
    params: CommercialTaskingParams,
    estimatedCostUsd: number,
    feasible = true
  ): CommercialTaskingOrder {
    const orderId = `SAR-ORD-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;
    const now = new Date().toISOString();

    let areaKm2 = 2.17;
    try {
      const ring = (params.geometry.coordinates[0] || []) as unknown as number[][];
      const areaHa = calculatePolygonAreaHa(ring);
      areaKm2 = Math.round((areaHa / 100) * 100) / 100;
    } catch {
      // Fallback area
    }

    const order: CommercialTaskingOrder = {
      orderId,
      provider: params.provider,
      status: "SUBMITTED",
      createdAt: now,
      updatedAt: now,
      params,
      feasibilityReport: {
        feasible,
        nextPassWindowStart: params.acquisitionWindow.startDatetime,
        nextPassWindowEnd: params.acquisitionWindow.endDatetime,
        orbitPassDirection: "DESCENDING",
        estimatedCostUsd,
        footprintAreaKm2: areaKm2,
      },
      statusHistory: [
        {
          status: "SUBMITTED",
          timestamp: now,
          comment: `Order initiated for ${params.provider.toUpperCase()} (${params.resolutionMode}).`,
        },
      ],
    };

    this.ordersStore.set(orderId, order);
    try {
      durableJobStore.submitJob({
        jobType: "commercial_tasking",
        idempotencyKey: `TASKING-${orderId}`,
        params: order,
      });
    } catch {
      // Non-fatal
    }
    return order;
  }

  /**
   * Advances the order to the next lifecycle state.
   */
  static transitionOrder(
    orderId: string,
    targetStatus: CommercialTaskingStatus,
    comment?: string
  ): CommercialTaskingOrder {
    const order = this.ordersStore.get(orderId);
    if (!order) {
      throw new Error(`Commercial SAR tasking order '${orderId}' not found.`);
    }

    if (!this.canTransition(order.status, targetStatus)) {
      throw new Error(
        `Invalid status transition: cannot move from '${order.status}' to '${targetStatus}'. Allowed transitions: ${ALLOWED_STATUS_TRANSITIONS[order.status].join(", ") || "none"}.`
      );
    }

    const now = new Date().toISOString();
    order.status = targetStatus;
    order.updatedAt = now;
    order.statusHistory.push({
      status: targetStatus,
      timestamp: now,
      comment: comment || `Transitioned to ${targetStatus}`,
    });

    // If order reaches COMPLETED, attach delivery payload
    if (targetStatus === "COMPLETED") {
      const resolutionM = order.params.resolutionMode.includes("0_25M")
        ? 0.25
        : order.params.resolutionMode.includes("0_50M")
        ? 0.5
        : order.params.resolutionMode.includes("1_00M")
        ? 1.0
        : 3.0;

      order.delivery = {
        productFormat: "COG",
        downloadUrl: `https://storage.googleapis.com/agrostech-sar-commercial/${order.provider}/${order.orderId}_L2_RTC.tif`,
        targetResolutionM: resolutionM,
        checksumSha256: `sha256_${Date.now().toString(16)}e8f9a2c3`,
      };
    }

    this.ordersStore.set(orderId, order);
    try {
      const jobState =
        targetStatus === "COMPLETED"
          ? "succeeded"
          : targetStatus === "REJECTED" || targetStatus === "CANCELLED"
          ? "failed"
          : "running";
      durableJobStore.updateState(orderId, jobState, {
        result: order.delivery,
      });
    } catch {
      // Non-fatal
    }
    return order;
  }

  /**
   * Retrieve order by ID
   */
  static getOrder(orderId: string): CommercialTaskingOrder | null {
    return this.ordersStore.get(orderId) || null;
  }

  /**
   * List all stored orders
   */
  static listOrders(filter?: {
    provider?: string;
    status?: CommercialTaskingStatus;
  }): CommercialTaskingOrder[] {
    let orders = Array.from(this.ordersStore.values());
    if (filter?.provider) {
      orders = orders.filter((o) => o.provider === filter.provider);
    }
    if (filter?.status) {
      orders = orders.filter((o) => o.status === filter.status);
    }
    return orders.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Clear in-memory orders (useful for test suites)
   */
  static clearOrders(): void {
    this.ordersStore.clear();
  }
}
