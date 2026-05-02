import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/server-admin";
import { getSupabaseForRequest } from "@/lib/supabase/server-user";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  product_id: z.string().min(1),
  size: z.enum(["XS", "S", "M", "L"]),
  quantity: z.number().int().min(0).max(99999),
});

export async function PATCH(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Supabase admin is not configured." }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!token) {
    return NextResponse.json({ error: "Missing Authorization bearer token." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { product_id, size, quantity } = parsed.data;

  try {
    const userClient = getSupabaseForRequest(token);
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user?.email) {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }

    const email = userData.user.email.trim().toLowerCase();
    const admin = getSupabaseAdmin();

    const { data: profile, error: profileErr } = await admin
      .from("partner_profiles")
      .select("store_id, role")
      .eq("role", "store")
      .ilike("email", email)
      .maybeSingle();

    if (profileErr || !profile?.store_id) {
      return NextResponse.json({ error: "Not a store partner account." }, { status: 403 });
    }

    const { data: product, error: productErr } = await admin
      .from("products")
      .select("id, store_id")
      .eq("id", product_id)
      .maybeSingle();

    if (productErr || !product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    if (product.store_id !== profile.store_id) {
      return NextResponse.json({ error: "Product does not belong to your store." }, { status: 403 });
    }

    const { error: updErr } = await admin
      .from("inventory_levels")
      .update({ quantity })
      .eq("product_id", product_id)
      .eq("size", size);

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
