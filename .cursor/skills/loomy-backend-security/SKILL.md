---
name: loomy-backend-security
description: >-
  Hardens LOOMY backend security: Supabase RLS, Stripe Connect server logic, and
  Edge Functions with strict tenant isolation between customer, store, and
  rider. Use when designing migrations, policies, APIs, webhooks, or reviewing
  data access for the three-sided marketplace.
---

# LOOMY Backend Security

## Threat model (baseline)

Assume **hostile or buggy clients** and leaked anon keys. **Postgres RLS** is the last line for row isolation; the API layer must not trust query parameters alone. **Stripe secrets** never ship to the browser; Connect money movement stays **server-side** with verified webhooks.

## Supabase Row Level Security (RLS)

- **Enable RLS** on every user-facing table; default **deny**; add explicit policies per role.
- **Isolate by actor:**
  - **Customer:** only rows where `customer_id = auth.uid()` (or via `profiles.id`), unless public catalog rules say otherwise.
  - **Store staff:** only rows tied to `store_id` where the user is in `store_staff` (or equivalent); no cross-store reads/writes.
  - **Rider:** only deliveries/orders assigned to that rider; location writes scoped to **own** `rider_id` / user id.
- **No broad `USING (true)`** on sensitive tables. Avoid `service_role` in client code—**server only**.
- Prefer **`auth.uid()`** in policies; use **security definer** functions sparingly and only with fixed `search_path`, minimal surface, and explicit checks.
- **INSERT/UPDATE policies** must constrain assignable columns (e.g. riders cannot flip `store_id` or reassign others’ orders).
- **Realtime:** same isolation—subscriptions must not leak other tenants’ rows; validate Supabase Realtime RLS behavior per table.

## Stripe Connect

- **Webhook signature verification** on every route; **idempotent** handling (store Stripe event ids or use idempotent replay pattern).
- **Never** trust client-reported payment success; **fulfillment** advances only after webhook or server-confirmed PaymentIntent state.
- **Connected accounts:** respect platform vs connected charges; keep **transfer/split** logic in Route Handlers or Edge Functions with secrets—not in RLS (RLS guards **data**, Stripe guards **money**).
- Log and handle **disputes/refunds** without exposing other parties’ PII across roles.

## Edge Functions & server routes

- **Validate input** (Zod or equivalent) at the boundary; reject unknown fields where relevant.
- **Authenticate** every invokable function; map JWT to role and **re-check** store/rider membership in SQL or a trusted lookup—do not trust role claims from the client alone if they can be forged.
- **Least privilege:** separate service-role operations into narrow code paths; avoid “god” admin endpoints on public domains.
- **Secrets:** env only; no logging of tokens, card data, or full PII.

## Cross-tenant isolation checklist

Before merging schema or API changes, confirm:

- [ ] Customer A cannot `SELECT`/`UPDATE` Customer B’s orders, addresses, or payment artifacts.
- [ ] Store X cannot read or mutate Store Y’s orders, staff, or payouts metadata.
- [ ] Rider R cannot read unassigned or other riders’ full delivery payloads beyond what the product explicitly allows (e.g. no PII leakage pre-assignment).
- [ ] **API routes** mirror RLS intent (defense in depth); dangerous operations use RPC/Edge with explicit checks.
- [ ] **Tests or manual policy matrix** updated when new tables or columns appear.

## Documentation habit

When changing access patterns, note **which role** may touch **which table** and **which Edge Function** owns privileged transitions (assign, cancel post-pickup, refund).

## Deep dives

For Postgres/RLS performance and patterns, use the Supabase Postgres best-practices skill when present; for product-wide Supabase usage, use the main Supabase skill when present.
