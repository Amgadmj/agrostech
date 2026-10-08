import { NextResponse } from "next/server";
import { commercialSarTaskingAdapter } from "@/lib/sar/commercial/adapter";
import { ZodError } from "zod";
import { checkApiAuth, unauthorizedResponse } from "@/lib/supabase/auth-guard";

export async function POST(request: Request) {
  const auth = await checkApiAuth(request);
  if (!auth.authenticated) {
    return unauthorizedResponse();
  }
  try {
    const body = await request.json();

    // Check if this is an order lifecycle status transition request
    if (body.action === "transition" && body.orderId && body.targetStatus) {
      const updatedOrder = commercialSarTaskingAdapter.transitionOrder(
        body.orderId,
        body.targetStatus,
        body.comment
      );
      return NextResponse.json({
        success: true,
        order: updatedOrder,
      });
    }

    // Standard tasking order creation: validate and schedule
    const order = commercialSarTaskingAdapter.validateAndScheduleTasking(body);

    return NextResponse.json(
      {
        success: true,
        message: `Commercial SAR tasking scheduled successfully with ${order.provider.toUpperCase()}.`,
        order,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed for commercial SAR tasking parameters.",
          validationErrors: error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
            code: e.code,
          })),
        },
        { status: 400 }
      );
    }

    console.error("Commercial SAR Tasking API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to schedule commercial SAR tasking.",
      },
      { status: error.message?.includes("not found") ? 404 : 400 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const provider = searchParams.get("provider") || undefined;
    const status = (searchParams.get("status") as any) || undefined;

    if (orderId) {
      const order = commercialSarTaskingAdapter.getOrder(orderId);
      if (!order) {
        return NextResponse.json(
          {
            success: false,
            error: `Order with ID '${orderId}' not found.`,
          },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        order,
      });
    }

    const orders = commercialSarTaskingAdapter.listOrders({
      provider,
      status,
    });

    return NextResponse.json({
      success: true,
      ordersCount: orders.length,
      orders,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to query commercial SAR orders.",
      },
      { status: 500 }
    );
  }
}
