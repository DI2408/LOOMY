import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import { getStripeServerClient } from "@/lib/stripe/server";
import { cancelUnpaidOrderById } from "@/lib/stripe/cancel-unpaid-order";

export const runtime = "nodejs";

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

  const { data: existing } = await admin
    .from("stripe_events")
    .select("processed_at")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (existing && (existing as { processed_at: string | null }).processed_at) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const { error: insertErr } = await admin.from("stripe_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
    livemode: event.livemode,
    payload: event as unknown as Record<string, unknown>,
    processed_at: null,
    error_message: null,
  });

  if (insertErr) {
    if (insertErr.code === "23505") {
      const { data: again } = await admin
        .from("stripe_events")
        .select("processed_at")
        .eq("stripe_event_id", event.id)
        .maybeSingle();
      if (again && (again as { processed_at: string | null }).processed_at) {
        return NextResponse.json({ ok: true, duplicate: true });
      }
    }
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id ?? session.client_reference_id ?? "";
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? "";

      if (!orderId) {
        throw new Error("checkout.session.completed missing order_id metadata.");
      }

      await admin
        .from("payments")
        .update({
          status: "succeeded",
          stripe_payment_intent_id: paymentIntentId || null,
          stripe_checkout_session_id: session.id,
          updated_at: new Date().toISOString(),
          metadata: {
            source: "stripe-webhook",
            eventType: event.type,
            checkout_session_id: session.id,
          },
        })
        .eq("order_id", orderId);
    } else if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id ?? session.client_reference_id ?? "";
      if (orderId) {
        await cancelUnpaidOrderById(admin, orderId);
      }
    } else if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata?.order_id ?? "";
      if (orderId) {
        await admin
          .from("payments")
          .update({
            status: "succeeded",
            stripe_payment_intent_id: pi.id,
            updated_at: new Date().toISOString(),
            metadata: { source: "stripe-webhook", eventType: event.type },
          })
          .eq("order_id", orderId);
      } else {
        await admin
          .from("payments")
          .update({
            status: "succeeded",
            updated_at: new Date().toISOString(),
            metadata: { source: "stripe-webhook", eventType: event.type },
          })
          .eq("stripe_payment_intent_id", pi.id);
      }
    } else if (
      event.type === "payment_intent.payment_failed" ||
      event.type === "payment_intent.canceled"
    ) {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata?.order_id ?? "";
      if (orderId) {
        await cancelUnpaidOrderById(admin, orderId);
      } else {
        const { data: pay } = await admin
          .from("payments")
          .select("order_id")
          .eq("stripe_payment_intent_id", pi.id)
          .maybeSingle();
        const oid = (pay as { order_id?: string } | null)?.order_id;
        if (oid) await cancelUnpaidOrderById(admin, oid);
      }
    } else if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const piId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
      if (piId) {
        await admin
          .from("payments")
          .update({
            status: "refunded",
            updated_at: new Date().toISOString(),
            metadata: { source: "stripe-webhook", eventType: event.type },
          })
          .eq("stripe_payment_intent_id", piId);
      }
    } else if (event.type === "payment_intent.processing") {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata?.order_id ?? "";
      if (orderId) {
        await admin
          .from("payments")
          .update({
            status: "processing",
            stripe_payment_intent_id: pi.id,
            updated_at: new Date().toISOString(),
          })
          .eq("order_id", orderId);
      }
    }

    await admin
      .from("stripe_events")
      .update({ processed_at: new Date().toISOString(), error_message: null })
      .eq("stripe_event_id", event.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    await admin
      .from("stripe_events")
      .update({ error_message: message })
      .eq("stripe_event_id", event.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
