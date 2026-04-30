# LOOMY Supabase — migration order

Run these SQL files **in order** in the Supabase SQL Editor on a **fresh** project (or read upgrade notes below).

1. `partner_profiles.sql` — butik + bud mapping (`partner_profiles`)
2. `customer_profiles.sql` — kundeprofiler (`customer_profiles`)
3. `loomy_platform.sql` — fuldt platformskema (katalog, ordre, betalinger, feedback, trigger på `auth.users`)
4. `loomy_orders_rpc.sql` — **RPC til unikke ordrenumre** og sikker ordre-oprettelse / status (påkrævet for app-integration)
5. `stripe_events.sql` — Stripe webhook idempotency + event log tabel (påkrævet for sikker webhook-drift)
6. `loomy_checkout_payments.sql` — betalingsrække ved ordre + kræv betaling før butik starter pakning + `stripe_checkout_session_id`
7. `loomy_cart_order.sql` — **kurv**: én ordre med flere `order_items` + én `payments`-række (kræves for checkout med flere varer)

I **Supabase → Database → Replication** skal du typisk aktivere realtime for `public.orders` og `public.product_inventory`, hvis klienten skal opdatere live.

## Efter kørsel

- Opret Auth-brugere der matcher seed-e-mails (se `supabase/README.md`).
- Sæt env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (kun server).

## Eksisterende database

Hvis du allerede har kørt `partner_profiles.sql` og `customer_profiles.sql`, kan du typisk **kun** tilføje `loomy_platform.sql`.  
Hvis du får fejl om manglende kolonne `user_id` på `customer_profiles`, kør først den relevante `ALTER TABLE` fra starten af `loomy_platform.sql` manuelt og ret evt. dubletter.
