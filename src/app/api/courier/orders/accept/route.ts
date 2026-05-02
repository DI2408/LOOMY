import { getCourierDispatchSystem } from "@/server/courier/courierDispatchSingleton";
import { OrderClaimError } from "@/server/orders/orderManagerTypes";

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
  courierId?: string;
  orderId?: string;
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

  const courierId = body.courierId?.trim();
  const orderId = body.orderId?.trim();
  if (!courierId || !orderId) {
    return new Response(
      JSON.stringify({ error: "courierId and orderId are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const row = await getCourierDispatchSystem().acceptOrder(courierId, orderId);
    return Response.json({
      ok: true,
      order: {
        id: row.id,
        status: row.status,
        courierId: row.courierId,
        updatedAt: row.updatedAt,
      },
    });
  } catch (e) {
    if (e instanceof OrderClaimError) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }
    const message = e instanceof Error ? e.message : "Server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
