import { createServiceSupabase } from "@/lib/supabase/service";
import { getETACalculator } from "@/server/tracking/etaCalculator";
import { readCustomerLocationFromOrderDetails } from "@/server/tracking/orderDetailsCoords";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized(): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

type Body = {
  orderId?: string;
  courierLat?: number;
  courierLng?: number;
  token?: string;
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

  const expected = process.env.CUSTOMER_TRACKING_SECRET;
  if (!expected || body.token !== expected) {
    return unauthorized();
  }

  const orderId = body.orderId?.trim();
  if (!orderId) {
    return new Response(JSON.stringify({ error: "orderId required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const lat = body.courierLat;
  const lng = body.courierLng;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return new Response(JSON.stringify({ error: "courierLat/courierLng required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("loomy_orders")
      .select("order_details")
      .eq("id", orderId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const details = (data.order_details ?? {}) as Record<string, unknown>;
    const customer = readCustomerLocationFromOrderDetails(details);
    if (!customer) {
      return new Response(
        JSON.stringify({ error: "Missing customer coordinates on order" }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }

    const phrase = await getETACalculator().getEtaPhrase(
      { lat: lat!, lng: lng! },
      customer
    );

    return Response.json({ etaPhrase: phrase });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
