import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cancelUnpaidOrderById } from "@/lib/stripe/cancel-unpaid-order";

function orderIdFromCheckoutSession(session: Stripe.Checkout.Session): string {
  return (session.metadata?.order_id ?? session.client_reference_id ?? "").trim();
}

/**
 * Mark payment succeeded when Stripe confirms funds (sync or async Checkout).
 */
export async function markPaymentSucceededForOrder(
  admin: SupabaseClient,
  orderId: string,
  extras: {
    stripePaymentIntentId?: string | null;
    stripeCheckoutSessionId?: string | null;
    eventType: string;
  },
): Promise<void> {
  if (!orderId) return;
  const row: Record<string, unknown> = {
    status: "succeeded",
    updated_at: new Date().toISOString(),
    metadata: {
      source: "stripe-webhook",
      eventType: extras.eventType,
      ...(extras.stripeCheckoutSessionId
        ? { checkout_session_id: extras.stripeCheckoutSessionId }
        : {}),
    },
  };
  if (extras.stripePaymentIntentId) {
    row.stripe_payment_intent_id = extras.stripePaymentIntentId;
  }
  if (extras.stripeCheckoutSessionId) {
    row.stripe_checkout_session_id = extras.stripeCheckoutSessionId;
  }
  await admin.from("payments").update(row).eq("order_id", orderId);
}

export async function handleCheckoutSessionCompleted(
  admin: SupabaseClient,
  session: Stripe.Checkout.Session,
  eventType: string,
): Promise<void> {
  const orderId = orderIdFromCheckoutSession(session);
  if (!orderId) {
    throw new Error("checkout.session completed without order_id / client_reference_id.");
  }
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const paid =
    session.payment_status === "paid" || session.payment_status === "no_payment_required";

  if (paid) {
    await markPaymentSucceededForOrder(admin, orderId, {
      stripePaymentIntentId: paymentIntentId,
      stripeCheckoutSessionId: session.id,
      eventType,
    });
    return;
  }

  if (session.payment_status === "unpaid" && paymentIntentId) {
    await admin
      .from("payments")
      .update({
        status: "processing",
        stripe_payment_intent_id: paymentIntentId,
        stripe_checkout_session_id: session.id,
        updated_at: new Date().toISOString(),
        metadata: {
          source: "stripe-webhook",
          eventType,
          checkout_session_id: session.id,
          note: "awaiting_async_confirmation",
        },
      })
      .eq("order_id", orderId);
  }
}

export async function handleCheckoutSessionAsyncPaymentSucceeded(
  admin: SupabaseClient,
  session: Stripe.Checkout.Session,
  eventType: string,
): Promise<void> {
  const orderId = orderIdFromCheckoutSession(session);
  if (!orderId) return;
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;
  await markPaymentSucceededForOrder(admin, orderId, {
    stripePaymentIntentId: paymentIntentId,
    stripeCheckoutSessionId: session.id,
    eventType,
  });
}

export async function handleCheckoutSessionAsyncPaymentFailed(
  admin: SupabaseClient,
  session: Stripe.Checkout.Session,
): Promise<void> {
  const orderId = orderIdFromCheckoutSession(session);
  if (orderId) await cancelUnpaidOrderById(admin, orderId);
}

export async function handlePaymentIntentSucceeded(
  admin: SupabaseClient,
  pi: Stripe.PaymentIntent,
  eventType: string,
): Promise<void> {
  const orderId = (pi.metadata?.order_id ?? "").trim();
  if (orderId) {
    await markPaymentSucceededForOrder(admin, orderId, {
      stripePaymentIntentId: pi.id,
      stripeCheckoutSessionId: null,
      eventType,
    });
    return;
  }
  await admin
    .from("payments")
    .update({
      status: "succeeded",
      stripe_payment_intent_id: pi.id,
      updated_at: new Date().toISOString(),
      metadata: { source: "stripe-webhook", eventType },
    })
    .eq("stripe_payment_intent_id", pi.id);
}

export async function handleChargeRefunded(admin: SupabaseClient, charge: Stripe.Charge): Promise<void> {
  const piId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!piId) return;
  const { data: pay } = await admin.from("payments").select("order_id").eq("stripe_payment_intent_id", piId).maybeSingle();
  const oid = (pay as { order_id?: string } | null)?.order_id;
  await admin
    .from("payments")
    .update({
      status: "refunded",
      updated_at: new Date().toISOString(),
      metadata: { source: "stripe-webhook", eventType: "charge.refunded", order_id: oid ?? null },
    })
    .eq("stripe_payment_intent_id", piId);
}
