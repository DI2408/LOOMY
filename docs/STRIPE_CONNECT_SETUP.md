# LOOMY — Stripe Connect (Checkout) setup

This app uses **Stripe Checkout** with **Connect destination charges**:

- Customer pays on Stripe-hosted Checkout.
- Funds route to the store’s **Connected Account** (`acct_…`).
- LOOMY keeps an **application fee** (platform cut).

## 1) Environment variables (Vercel / `.env.local`)

```env
# Public
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Stripe (server)
STRIPE_SECRET_KEY=sk_live_… or sk_test_…
STRIPE_WEBHOOK_SECRET=whsec_…

# Map each LOOMY store_id to a Stripe Connect account id
LOOMY_STORE_STRIPE_ACCOUNTS={"strom-boutique":"acct_…","naked-copenhagen-edit":"acct_…"}

# Optional: platform fee in basis points (default 100 = 1%)
# LOOMY_PLATFORM_FEE_BPS=100
```

## 2) Supabase SQL (run in order)

Include `supabase/loomy_checkout_payments.sql` **after** `loomy_orders_rpc.sql` so that:

- each order gets a `payments` row at creation
- `payments.stripe_checkout_session_id` exists
- store cannot start packing until payment is `succeeded`

Then run `supabase/loomy_cart_order.sql` so the **shopping cart** can create **one order** with **multiple `order_items`** and a single `payments` row (`place_loomy_cart_order`).

## 3) Stripe Dashboard — payment methods (MobilePay, cards, wallets)

Checkout sessions are created with **`payment_method_types`: `card`, `link`, `mobilepay`** (see `src/lib/stripe/checkout-payment-methods.ts`). Override with env **`LOOMY_CHECKOUT_PAYMENT_METHOD_TYPES`** as a JSON array, e.g. `["card","link","mobilepay"]`.

- **Kort:** always available when `card` is included. **Apple Pay / Google Pay** appear as wallet buttons on Stripe Checkout when the customer’s device and region support them (not a separate type in Checkout).
- **MobilePay:** enable **MobilePay** under [Settings → Payment methods](https://dashboard.stripe.com/settings/payment_methods) for your platform (and ensure your Stripe account / Connect setup supports it for Denmark).
- **Link:** enable **Link** in the same place if you want one-click saved details.

Without enabling these methods in the Dashboard (or if your account is not eligible), Stripe may omit them from the Checkout page.

## 4) Stripe Dashboard — webhooks & Connect

1. Create **Connect** accounts for each merchant (or use Connect Onboarding later).
2. Add webhook endpoint: `https://your-domain.com/api/stripe/webhook` (use the **signing secret** as `STRIPE_WEBHOOK_SECRET` in Vercel).
3. Subscribe to at least:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded` (MobilePay / delayed methods)
- `checkout.session.async_payment_failed`
- `checkout.session.expired`
- `payment_intent.succeeded`
- `payment_intent.processing`
- `payment_intent.payment_failed`
- `payment_intent.canceled`
- `charge.refunded`

**Vercel:** redeploy after changing env vars. **Stripe test mode** uses a different webhook secret than live — use the matching `whsec_…` per endpoint.

## 5) Customer flow (shopping)

1. Customer must be **logged in** (Supabase session).
2. Add items to **kurv** (header) → **Gå til betaling** → creates order server-side → redirects to **`/checkout?order_id=…`**
3. On checkout page → **Betal med Stripe** → Stripe Checkout.
4. Success → return to `/checkout?order_id=…&checkout=success`
5. Cancel → `/checkout?order_id=…&checkout=cancel` (order cancelled + inventory restored server-side).

## 6) Store flow

After webhook marks `payments.status = succeeded`, the store can slide/accept to move from `order_placed` → `store_packing`.

## Notes / limitations (honest)

- This is a **production-grade skeleton** for Connect Checkout + gating. You still need legal/tax onboarding flows, dispute handling depth, and reconciliation reporting for full commercial operations.
- `LOOMY_STORE_STRIPE_ACCOUNTS` is intentionally simple; long-term you should store `stripe_account_id` on `stores` in Postgres and manage onboarding in-app.
