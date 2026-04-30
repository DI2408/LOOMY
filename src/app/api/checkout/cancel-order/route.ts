import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import { getUserFromBearerToken } from "@/lib/stripe/supabase-server-auth";
import { cancelUnpaidOrderById } from "@/lib/stripe/cancel-unpaid-order";

export const runtime = "nodejs";

const bodySchema = z.object({
  orderId: z.string().min(1),
});

export async function POST(request: Request) {
  const admin = getSupabaseServiceRoleClient();
  if (!admin) {
    return NextResponse.json({ error: "Supabase service er ikke konfigureret." }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  const { user, error: authError } = await getUserFromBearerToken(authHeader);
  if (!user?.id || authError) {
    return NextResponse.json({ error: authError ?? "Ikke autoriseret." }, { status: 401 });
  }

  let bodyJson: unknown;
  try {
    bodyJson = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(bodyJson);
  if (!parsed.success) {
    return NextResponse.json({ error: "orderId mangler." }, { status: 400 });
  }

  const { orderId } = parsed.data;

  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select("customer_user_id")
    .eq("id", orderId)
    .maybeSingle();
  if (orderErr || !order) {
    return NextResponse.json({ error: "Ordre findes ikke." }, { status: 404 });
  }
  if ((order as { customer_user_id: string }).customer_user_id !== user.id) {
    return NextResponse.json({ error: "Ingen adgang." }, { status: 403 });
  }

  const result = await cancelUnpaidOrderById(admin, orderId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Annullering mislykkedes." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
