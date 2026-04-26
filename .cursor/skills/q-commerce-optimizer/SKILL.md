---
name: q-commerce-optimizer
description: >-
  Applies LOOMY q-commerce patterns for order flows, courier tracking, and merchant
  dashboards. Use when implementing or changing orders, statuses, ETAs, merchant
  acceptance timeouts, rider location, Supabase Realtime subscriptions, or map
  features. Triggers include courier tracking, merchant dashboard, order pipeline,
  delivery ETA, expired orders, and live order updates.
---

# Q-Commerce Optimizer

Use this skill whenever you build or refactor **order flows**, **courier (rider) tracking**, or **merchant dashboards** in LOOMY. Stack defaults: Next.js App Router, Supabase (Postgres + Realtime), TypeScript.

## 1. Real-time is default

- Every **order status change** visible to customers, merchants, or riders must propagate without manual refresh.
- Prefer **Supabase Realtime**: `postgres_changes` on the orders table (and related tables that drive UI state), or **Broadcast** when aggregating multiple rows is cheaper than many channel subscriptions.
- On the client: subscribe in a focused hook or server-driven pattern; **unsubscribe on unmount**; handle reconnect (channel `subscribe` status).
- Do not rely on polling alone for status; polling may supplement (e.g. backup) but must not be the primary UX path.

## 2. ETA logic (standard model)

Unless product explicitly defines different windows, implement **ETA** from:

**`eta = order_accepted_at + 15 minutes (prep) + 15 minutes (delivery)`**

- Persist **`order_accepted_at`** (or equivalent) when the merchant accepts; derive ETA in the UI or expose a computed field/API—**do not** silently use `created_at` as a substitute.
- Show loading/error states when `order_accepted_at` is missing (e.g. pending acceptance).
- If prep or delivery windows become configurable later, read them from config or DB constants—keep the **30-minute total** split explicit in code or schema comments until then.

## 3. Failure prevention: expired orders

- If the **merchant does not accept within 5 minutes** of order placement (or defined `pending_at`), transition the order to an **expired** (or `cancelled_merchant_timeout`) state.
- Implement **one authoritative path**: DB constraint + scheduled job (Supabase **pg_cron** / Edge Function) **or** transition on next read with a clear cutoff timestamp—avoid duplicate competing timers in client-only code.
- Release inventory/reservations and notify customer according to existing product patterns.
- Ensure Realtime listeners receive the terminal state so all clients update immediately.

## 4. Data precision: courier coordinates

- Store and query positions as **PostGIS** (`geography(Point,4326)` or `geometry(Point,4326)`) **or** as **`numeric` / `double precision` lat,lng** with enough precision for routing (avoid rounding to fewer than ~5–6 decimal places for last-mile).
- Never use low-precision floats for persistence without documenting tolerance; validate lat ∈ [-90, 90], lng ∈ [-180, 180].
- For “rider near customer” or distance sorts, use **PostGIS** (`ST_DWithin`, `ST_Distance`) rather than ad-hoc Haversine in application code unless profiling shows a justified exception.

## Quick verification checklist

- [ ] Status updates use Realtime (not refresh-only).
- [ ] ETA uses accepted time + 15m prep + 15m delivery.
- [ ] 5-minute merchant acceptance timeout is enforced server-side (or DB) and reflected in UI.
- [ ] Rider locations use PostGIS or high-precision lat/lng with validation.

## Related skills

- For Supabase auth, RLS, migrations, and client patterns, read the workspace **Supabase** skill when touching schema or policies.
