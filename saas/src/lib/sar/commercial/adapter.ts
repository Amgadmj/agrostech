/**
 * Unified Commercial SAR Tasking Adapter
 * Manages multi-provider dispatch (Umbra Space & Airbus TerraSAR-X)
 * Enforces Zod validation, feasibility checks, and order lifecycle transitions
 */

import {
  CommercialTaskingParams,
  CommercialTaskingOrder,
  CommercialTaskingStatus,
} from "@/types/sar";
import { CommercialTaskingRequestSchema, ValidatedCommercialTaskingParams } from "./schema";
import { umbraCanopyAdapter } from "./umbraAdapter";
import { terraSarXAdapter } from "./terrasarxAdapter";
import { TaskingStateMachine } from "./stateMachine";

export class CommercialSarTaskingAdapter {
  /**
   * Validates raw input parameters using Zod schema.
   * Throws ZodError or formatting error if constraints fail.
   */
  validateTaskingRequest(input: unknown): ValidatedCommercialTaskingParams {
    return CommercialTaskingRequestSchema.parse(input);
  }

  /**
   * Validates parameters and schedules a commercial tasking order.
   * Conforms to PROJECT.md interface contract:
   * CommercialSarTaskingAdapter.validateAndScheduleTasking(params)
   */
  validateAndScheduleTasking(params: CommercialTaskingParams): CommercialTaskingOrder {
    // 1. Zod runtime validation
    const validated = this.validateTaskingRequest(params);

    // 2. Dispatch to designated provider adapter
    if (validated.provider === "umbra") {
      return umbraCanopyAdapter.scheduleTasking(validated as CommercialTaskingParams);
    } else if (validated.provider === "terrasar_x") {
      return terraSarXAdapter.scheduleTasking(validated as CommercialTaskingParams);
    } else {
      throw new Error(`Unsupported commercial SAR provider: '${(params as any).provider}'`);
    }
  }

  /**
   * Static method conforming directly to PROJECT.md:
   * CommercialSarTaskingAdapter.validateAndScheduleTasking(params)
   */
  static validateAndScheduleTasking(params: CommercialTaskingParams): CommercialTaskingOrder {
    const adapter = new CommercialSarTaskingAdapter();
    return adapter.validateAndScheduleTasking(params);
  }

  /**
   * Look up order by ID
   */
  getOrder(orderId: string): CommercialTaskingOrder | null {
    return TaskingStateMachine.getOrder(orderId);
  }

  /**
   * Advance order status through the lifecycle
   */
  transitionOrder(
    orderId: string,
    targetStatus: CommercialTaskingStatus,
    comment?: string
  ): CommercialTaskingOrder {
    return TaskingStateMachine.transitionOrder(orderId, targetStatus, comment);
  }

  /**
   * List all stored orders
   */
  listOrders(filter?: {
    provider?: string;
    status?: CommercialTaskingStatus;
  }): CommercialTaskingOrder[] {
    return TaskingStateMachine.listOrders(filter);
  }
}

export const commercialSarTaskingAdapter = new CommercialSarTaskingAdapter();
