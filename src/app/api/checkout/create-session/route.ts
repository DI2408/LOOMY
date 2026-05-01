import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import { getStripeServerClient } from "@/lib/stripe/server";
import {
  applicationFeeAmountMinor,
  getApplicationFeeBps,
  getStripeConnectAccountIdForStore,
} from "@/lib/stripe/connect-accounts";
import { getUserFromBearerToken } from "@/lib/stripe/supabase-server-auth";

export const runtime = "nodejs";

const bodySchema = z.object({
  orderId: z.string().min(1),
});

export async function POST(request: Request) {
  const stripe = getStripeServerClient();
  const admin = getSupabaseServiceRoleClient();
  if (!stripe || !admin) {
    return NextResponse.json({ error: "Stripe eller Supabase service er ikke konfigureret." }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!appUrl) {
    return NextResponse.json({ error: "Sæt NEXT_PUBLIC_APP_URL (base URL til success/cancel)." }, { status: 500 });
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
    return NextResponse.json({ error: "orderId mangler eller er ugyldig." }, { status: 400 });
  }
  const { orderId } = parsed.data;

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id, customer_user_id, store_id, status, total_minor, currency")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) {
    return NextResponse.json({ error: "Ordre findes ikke." }, { status: 404 });
  }

  const o = order as {
    id: string;
    customer_user_id: string;
    store_id: string;
    status: string;
    total_minor: number | null;
    currency: string;
  };

  if (o.customer_user_id !== user.id) {
    return NextResponse.json({ error: "Ingen adgang til denne ordre." }, { status: 403 });
  }

  if (o.status !== "order_placed") {
    return NextResponse.json({ error: "Ordren kan ikke betales i denne status." }, { status: 409 });
  }

  const destination = getStripeConnectAccountIdForStore(o.store_id);
  const useConnect = Boolean(destination);

  const amountMinor = o.total_minor ?? 0;
  if (amountMinor <= 0) {
    return NextResponse.json({ error: "Ordrebeløb mangler eller er ugyldigt." }, { status: 400 });
  }

  const { data: payRow, error: payErr } = await admin
    .from("payments")
    .select("id, status, stripe_checkout_session_id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (payErr || !payRow) {
    return NextResponse.json({ error: "Betalingspost findes ikke." }, { status: 404 });
  }
  const pay = payRow as { id: string; status: string; stripe_checkout_session_id: string | null };
  if (pay.status === "succeeded") {
    return NextResponse.json({ error: "Ordren er allerede betalt." }, { status: 409 });
  }

  const bps = getApplicationFeeBps();
  const fee = useConnect ? applicationFeeAmountMinor(amountMinor, bps) : 0;

  if (useConnect && fee >= amountMinor) {
    return NextResponse.json({ error: "Platform fee er for høj i forhold til ordrebeløbet." }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      client_reference_id: orderId,
      metadata: {
        order_id: orderId,
        user_id: user.id,
        store_id: o.store_id,
        stripe_mode: useConnect ? "connect" : "platform",
      },
      ...(useConnect && destination
        ? {
            payment_intent_data: {
              application_fee_amount: fee,
              transfer_data: { destination },
              metadata: { order_id: orderId, user_id: user.id },
            },
          }
        : {
            payment_intent_data: {
              metadata: { order_id: orderId, user_id: user.id, stripe_mode: "platform" },
            },
          }),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: (o.currency || "dkk").toLowerCase(),
            unit_amount: amountMinor,
            product_data: { name: `LOOMY ordre ${orderId}` },
          },
        },
      ],
      success_url: `${appUrl}/checkout?order_id=${encodeURIComponent(orderId)}&checkout=success`,
      cancel_url: `${appUrl}/checkout?order_id=${encodeURIComponent(orderId)}&checkout=cancel`,
    });

    await admin
      .from("payments")
      .update({
        stripe_checkout_session_id: session.id,
        stripe_connect_account_id: useConnect ? destination : null,
        status: "processing",
        updated_at: new Date().toISOString(),
        metadata: {
          checkout_session_id: session.id,
          ...(useConnect
            ? { application_fee_minor: fee, platform_fee_bps: bps }
            : { stripe_checkout_mode: "platform" }),
        },
      })
      .eq("order_id", orderId);

    return NextResponse.json({ url: session.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Kunne ikke oprette Checkout Session.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
