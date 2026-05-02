import { getDeliveryCompletionFlow } from "@/server/delivery/deliveryCompletionSingleton";
import { DeliveryCompletionError } from "@/server/delivery/deliveryCompletionTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized(): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

function validateSecret(secret: string | undefined): boolean {
  const expected = process.env.COURIER_DISPATCH_SECRET;
  if (!expected) return false;
  return secret === expected;
}

type Body = {
  orderId?: string;
  courierId?: string;
  courierLat?: number;
  courierLng?: number;
  mode?: "handed_to_customer" | "left_at_door";
  customerHandoffCode?: string;
  proofImageBase64?: string;
  secret?: string;
};

export async function POST(request: Request): Promise<Response> {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!validateSecret(body.secret)) {
    return unauthorized();
  }

  const orderId = body.orderId?.trim();
  const courierId = body.courierId?.trim();
  const mode = body.mode;

  if (!orderId || !courierId || !mode) {
    return new Response(
      JSON.stringify({
        error: "orderId, courierId, and mode are required",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    await getDeliveryCompletionFlow().completeDelivery({
      orderId,
      courierId,
      courierLat: body.courierLat ?? NaN,
      courierLng: body.courierLng ?? NaN,
      mode,
      customerHandoffCode: body.customerHandoffCode,
      proofImageBase64: body.proofImageBase64,
    });

    return Response.json({
      ok: true,
      orderId,
      status: "delivered" as const,
    });
  } catch (e) {
    if (e instanceof DeliveryCompletionError) {
      const status =
        e.code === "OUTSIDE_GEOFENCE" || e.code === "INVALID_HANDOFF_CODE"
          ? 422
          : e.code === "FORBIDDEN"
            ? 403
            : e.code === "ORDER_NOT_FOUND"
              ? 404
              : 400;
      return new Response(
        JSON.stringify({ error: e.message, code: e.code }),
        { status, headers: { "Content-Type": "application/json" } }
      );
    }
    const message = e instanceof Error ? e.message : "Server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
