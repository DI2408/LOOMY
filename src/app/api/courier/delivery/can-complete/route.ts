import { getDeliveryCompletionFlow } from "@/server/delivery/deliveryCompletionSingleton";

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
  if (!orderId || !courierId) {
    return new Response(
      JSON.stringify({ error: "orderId and courierId required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const result = await getDeliveryCompletionFlow().canConfirmDelivery(
      orderId,
      courierId,
      body.courierLat ?? NaN,
      body.courierLng ?? NaN
    );
    return Response.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
