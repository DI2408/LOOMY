import { NextResponse } from "next/server";
import { getSupabaseForRequest } from "@/lib/supabase/server-user";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ orderId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { orderId } = await context.params;

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!token) {
    return NextResponse.json({ error: "Missing Authorization bearer token." }, { status: 401 });
  }

  try {
    const client = getSupabaseForRequest(token);
    const { data, error } = await client.rpc("rpc_courier_advance_order", {
      p_order_id: orderId,
    });

    if (error) {
      const msg = error.message;
      if (msg.includes("not_authenticated")) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      }
      if (msg.includes("not_courier_partner") || msg.includes("courier_mismatch")) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }
      if (msg.includes("order_not_found")) {
        return NextResponse.json({ error: "Order not found." }, { status: 404 });
      }
      if (msg.includes("invalid_status_transition")) {
        return NextResponse.json({ error: "Invalid status transition." }, { status: 409 });
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({ result: data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
