import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import { getStripeServerClient } from "@/lib/stripe/server";

export const runtime = "nodejs";

function paymentStatusFromEvent(eventType: string): string | null {
  if (eventType === "payment_intent.succeeded") return "succeeded";
  if (eventType === "payment_intent.payment_failed") return "failed";
  if (eventType === "payment_intent.canceled") return "cancelled";
  if (eventType === "charge.refunded") return "refunded";
  return null;
}

export async function POST(request: Request) {
  const stripe = getStripeServerClient();
  const admin = getSupabaseServiceRoleClient();
  if (!stripe || !admin) {
    return NextResponse.json(
      { error: "Stripe/Supabase service env not configured." },
      { status: 500 },
    );
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET." }, { status: 500 });
  }

  const signature = (await headers()).get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Idempotency gate: if event_id already handled we exit cleanly.
  const { data: idemRow, error: idemLookupError } = await admin
    .from("stripe_events")
    .select("event_id, processed_at")
    .eq("event_id", event.id)
    .maybeSingle();
  if (idemLookupError) {
    return NextResponse.json({ error: idemLookupError.message }, { status: 500 });
  }
  if (idemRow?.processed_at) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const status = paymentStatusFromEvent(event.type);
  const object = event.data.object as { id?: string; metadata?: Record<string, string> };
  const paymentIntentId = object.id ?? "";
  const orderId = object.metadata?.order_id ?? "";

  try {
    await admin.from("stripe_events").upsert({
      stripe_event_id: event.id,
      event_type: event.type,
      livemode: Boolean(event.livemode),
      payload: event as unknown as Record<string, unknown>,
      processed_at: new Date().toISOString(),
    });

    if (status && paymentIntentId) {
      await admin
        .from("payments")
        .update({
          status,
          stripe_payment_intent_id: paymentIntentId,
          updated_at: new Date().toISOString(),
          metadata: {
            source: "stripe-webhook",
            eventType: event.type,
            orderId: orderId || null,
          },
        })
        .eq("stripe_payment_intent_id", paymentIntentId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    await admin
      .from("stripe_events")
      .update({
        payload: {
          ...(event as unknown as Record<string, unknown>),
          processing_error: message,
        },
      })
      .eq("stripe_event_id", event.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
