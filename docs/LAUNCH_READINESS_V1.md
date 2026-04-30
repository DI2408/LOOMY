# LOOMY Launch Readiness v1

Use this as a pass/fail gate before production rollout.

For a **module-by-module go/no-go** verdict and a prioritized lift plan, see `docs/GO_NO_GO_REPORT.md`.

## A. Critical blockers (must pass)

- [ ] Stripe webhooks verified with signature in production.
- [ ] Idempotency enabled for Stripe events (`stripe_webhook_events` table active).
- [ ] Payment status transitions update `payments` and `orders` safely.
- [ ] RLS enabled on all tenant tables; role matrix tested (customer/store/courier).
- [ ] `loomy_orders_rpc.sql` deployed; unique order ids (`LOO-XXXXXXXXX`) verified.
- [ ] Supabase env vars set in production and preview.
- [ ] Error tracking enabled (Sentry or equivalent) for API + app runtime.

## B. Data and security hardening

- [ ] Address validation enforced before order create.
- [ ] Phone normalization to E.164 where persisted.
- [ ] Rate limits on auth and order create APIs.
- [ ] Service-role usage restricted to server-only code paths.
- [ ] Backup + restore drill documented and tested.

## C. Product quality

- [ ] End-to-end order lifecycle test: customer -> store -> courier -> delivered.
- [ ] Inventory race condition test (last-item concurrency).
- [ ] Empty/loading/error states reviewed on core screens.
- [ ] Accessibility pass: keyboard, focus, contrast, reduced motion.

## D. Operations

- [ ] CI gates: lint, typecheck, build, smoke/e2e.
- [ ] Staging mirrors production env/config.
- [ ] Alerting: payment failure spike, webhook failures, order creation failures.
- [ ] Incident runbook: payments, auth outage, Supabase partial outage.

## E. Current implementation status (this repo)

- [x] Unique order numbering and secure order RPCs in Supabase.
- [x] Supabase-backed catalog/orders in app with graceful demo fallback.
- [x] Stripe webhook route skeleton + idempotency table SQL (`supabase/stripe_events.sql` → `public.stripe_webhook_events`).
- [ ] Payment intent creation endpoint (server) with full Connect transfer logic.
- [ ] Full webhook event handling coverage (refund/dispute/chargeback flows).
