import { NextResponse } from "next/server";
import { z } from "zod";
import type { PlaceOrderGuestResult } from "@/lib/loomy-api-types";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/server-admin";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  store_id: z.string().min(1),
  product_id: z.string().min(1),
  size: z.enum(["XS", "S", "M", "L"]),
  customer_name: z.string().min(1).max(200),
  customer_address: z.string().min(1).max(500),
  customer_user_id: z.string().uuid().optional().nullable(),
  nearby_eta_minutes: z.number().int().min(1).max(240).optional().nullable(),
});

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Supabase admin is not configured." }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const {
    store_id,
    product_id,
    size,
    customer_name,
    customer_address,
    customer_user_id,
    nearby_eta_minutes,
  } = parsed.data;

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.rpc("rpc_place_order_guest", {
      p_store_id: store_id,
      p_product_id: product_id,
      p_size: size,
      p_customer_name: customer_name,
      p_customer_address: customer_address,
      p_customer_user_id: customer_user_id ?? null,
      p_nearby_eta_minutes: nearby_eta_minutes ?? null,
    });

    if (error) {
      const msg = error.message;
      if (msg.includes("out_of_stock")) {
        return NextResponse.json({ error: "out_of_stock" }, { status: 409 });
      }
      if (msg.includes("product_not_found")) {
        return NextResponse.json({ error: "product_not_found" }, { status: 404 });
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({ result: data as PlaceOrderGuestResult });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
