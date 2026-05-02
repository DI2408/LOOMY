import { getOrderManager } from "@/server/courier/courierDispatchSingleton";
import { OrderTransitionError } from "@/server/orders/orderManagerTypes";
import { createServiceSupabase } from "@/lib/supabase/service";
import { createSupabaseOrderManagerRepository } from "@/server/orders/orderManagerRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized(): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

function validateSecret(secret: string | undefined): boolean {
  const expected = process.env.STORE_DASHBOARD_SECRET;
  if (!expected) return false;
  return secret === expected;
}

type Body = {
  orderId?: string;
  storeId?: string;
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
  const storeId = body.storeId?.trim();
  if (!orderId || !storeId) {
    return new Response(
      JSON.stringify({ error: "orderId and storeId are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const repo = createSupabaseOrderManagerRepository(createServiceSupabase());
    const row = await repo.getById(orderId);
    if (!row) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (row.storeId !== storeId) {
      return new Response(JSON.stringify({ error: "Store mismatch" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updated = await getOrderManager().transitionToReady(orderId);
    return Response.json({
      ok: true,
      order: {
        id: updated.id,
        status: updated.status,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (e) {
    if (e instanceof OrderTransitionError) {
      return new Response(
        JSON.stringify({
          error: e.message,
          currentStatus: e.currentStatus,
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }
    const message = e instanceof Error ? e.message : "Server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
