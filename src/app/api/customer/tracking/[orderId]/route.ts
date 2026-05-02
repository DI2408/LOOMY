import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized(): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
): Promise<Response> {
  const expected = process.env.CUSTOMER_TRACKING_SECRET;
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!expected || token !== expected) {
    return unauthorized();
  }

  const { orderId } = await context.params;
  if (!orderId?.trim()) {
    return new Response(JSON.stringify({ error: "Missing orderId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("loomy_orders")
      .select("id, store_id, status, order_details")
      .eq("id", orderId.trim())
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const details = (data.order_details ?? {}) as Record<string, unknown>;
    const num = (k: string): number | null => {
      const v = details[k];
      const n = typeof v === "number" ? v : Number(v);
      return Number.isFinite(n) ? n : null;
    };

    return Response.json({
      orderId: data.id as string,
      storeId: data.store_id as string,
      status: data.status as string,
      storeLat: num("storeLat"),
      storeLng: num("storeLng"),
      customerLat: num("customerLat") ?? num("dropoffLat"),
      customerLng: num("customerLng") ?? num("dropoffLng"),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
