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

function validateSecret(request: Request): boolean {
  const expected = process.env.STORE_DASHBOARD_SECRET;
  if (!expected) return false;
  const url = new URL(request.url);
  return url.searchParams.get("secret") === expected;
}

export async function GET(request: Request): Promise<Response> {
  if (!validateSecret(request)) {
    return unauthorized();
  }

  const url = new URL(request.url);
  const storeId = url.searchParams.get("storeId")?.trim();
  if (!storeId) {
    return new Response(JSON.stringify({ error: "Missing storeId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const repo = createSupabaseOrderManagerRepository(createServiceSupabase());
    const orders = await repo.listPaidByStore(storeId);
    return Response.json({
      storeId,
      orders: orders.map((o) => ({
        id: o.id,
        status: o.status,
        updatedAt: o.updatedAt,
        orderDetails: o.orderDetails,
        offlinePushQueued: o.offlinePushQueued,
      })),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
