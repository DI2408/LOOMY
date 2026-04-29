# LOOMY — Supabase database

## 1. Opret tabeller + RLS

I **Supabase SQL Editor** kør **i denne rækkefølge** (se også `MIGRATION_ORDER.md`):

1. `partner_profiles.sql`
2. `customer_profiles.sql`
3. `loomy_platform.sql`
4. `loomy_orders_rpc.sql` (unikke ordrenumre + `place_loomy_order` / status-RPCs — **kræves** for shopping mod Supabase)
5. `stripe_events.sql` (webhook idempotency-log + RLS deny-all for klientroller)

`partner_profiles.sql` opretter `public.partner_profiles` (butik + bud).

`customer_profiles.sql` opretter `public.customer_profiles` (kundeprofiler).

`loomy_platform.sql` tilføjer det fulde LOOMY-skema: **butikker, produkter, lager, bud,
ordrer, ordrelinjer, betaling-metadata (Stripe Connect), feedback** samt **RLS for alle roller**
(kunde / butik / bud). Filen udvider også `customer_profiles` med `user_id` og en **trigger**
der opretter profil automatisk ved ny bruger i `auth.users`.

## 2. Opret brugere i Auth

Seed-SQL indsætter **ikke** Auth-brugere. Opret hver e-mail i **Authentication → Users** (eller med Admin API) med de adgangskoder, I bruger i demo (fx `Demo1234!` for demo).

Bud (matcher seed i `partner_profiles.sql`):

- `courier.mikkel@loomy.dk` + `mikkel` i `courier_id`
- `courier.sara@loomy.dk` + `sara`
- `courier.jonas@loomy.dk` + `jonas`

Butikker (se samme fil): `store.strom@loomy.dk` m.fl.

Kunder (matcher seed i `customer_profiles.sql`):

- `emma@loomy.dk`
- `noah@loomy.dk`
- `sofie@loomy.dk`

## 3. Vercel / lokal: server-opslag til budlogin

Bud-siden skal kende e-mailen **før** login, men RLS blokerer anon-klienten. Derfor sættes:

- `SUPABASE_SERVICE_ROLE_KEY` (kun server, aldrig i browser)

i Vercel Environment Variables (eller `.env.local` lokalt). Next.js-APIet `/api/partner/courier-email` bruger den til sikkert opslag.

## 4. Valgfri demo uden service role (kun dev)

`LOOMY_COURIER_DEMO_MAP=1` får API’et til at returnere hardcoded `courier.mikkel@loomy.dk` for `mikkel` uden service role. Brug **ikke** i produktion.

## 5. Sørg for env i Vercel

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (ny publishable/anon nøgle fra Supabase)
- `SUPABASE_SERVICE_ROLE_KEY`

Efter ændring: **redeploy** preview/production.
