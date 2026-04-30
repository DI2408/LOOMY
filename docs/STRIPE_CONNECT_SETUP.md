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

## 3) Stripe Dashboard

1. Create **Connect** accounts for each merchant (or use Connect Onboarding later).
2. Add webhook endpoint: `https://your-domain.com/api/stripe/webhook`
3. Subscribe to at least:

- `checkout.session.completed`
- `checkout.session.expired`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.canceled`
- `charge.refunded`

## 4) Customer flow (shopping)

1. Customer must be **logged in** (Supabase session).
2. Place order → **“Fortsæt til sikker betaling”** → Stripe Checkout.
3. Success → return to `/shopping?checkout=success&order_id=…`
4. Cancel → `/shopping?checkout=cancel&order_id=…` (order cancelled + inventory restored server-side).

## 5) Store flow

After webhook marks `payments.status = succeeded`, the store can slide/accept to move from `order_placed` → `store_packing`.

## Notes / limitations (honest)

- This is a **production-grade skeleton** for Connect Checkout + gating. You still need legal/tax onboarding flows, dispute handling depth, and reconciliation reporting for full commercial operations.
- `LOOMY_STORE_STRIPE_ACCOUNTS` is intentionally simple; long-term you should store `stripe_account_id` on `stores` in Postgres and manage onboarding in-app.
