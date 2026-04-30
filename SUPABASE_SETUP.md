# Supabase Auth Setup (Store + Courier + Customer)

This project now uses Supabase email/password login for partner access.

## 1) Environment variables

Create `.env.local` in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

## 2) Create auth users in Supabase Dashboard

Go to **Authentication -> Users** and create email/password users.

Use these emails (mapped in SQL):

### Store partner accounts

- `store.strom@loomy.dk` -> `strom-boutique`
- `store.naked@loomy.dk` -> `naked-copenhagen-edit`
- `store.birger@loomy.dk` -> `birger-et-mikkelsen-house`
- `store.woodwood@loomy.dk` -> `wood-wood-city`
- `store.storm@loomy.dk` -> `storm-cph`

### Courier accounts

- `courier.mikkel@loomy.dk` -> `mikkel`
- `courier.sara@loomy.dk` -> `sara`
- `courier.jonas@loomy.dk` -> `jonas`

### Customer demo accounts

- `emma@loomy.dk`
- `noah@loomy.dk`
- `sofie@loomy.dk`

## 3) Login pages

- Store login: `/login/store`
- Courier login: `/login/courier`
- Customer login: `/login/customer`

Each dashboard is role-specific:

- Store sees only orders and catalog for its store mapping.
- Courier sees only orders assigned to that courier mapping.

## 4) Notes

- Mapping is now database-driven in:
  - `public.partner_profiles` (store + courier)
  - `public.customer_profiles` (customer demo)
- Run both SQL files in Supabase SQL Editor.

## 5) Database setup (required)

1. Open Supabase SQL Editor.
2. Paste and run `supabase/partner_profiles.sql`.
3. Paste and run `supabase/customer_profiles.sql`.
4. Paste and run `supabase/loomy_platform.sql` (catalog, orders, payments RLS, feedback).
5. Paste and run `supabase/loomy_orders_rpc.sql` (unique order numbers `LOO-…`, `place_loomy_order`, store/courier progress RPCs).
6. Paste and run `supabase/stripe_events.sql` (webhook idempotency log table for Stripe events).
7. Paste and run `supabase/loomy_checkout_payments.sql` (payments row on order + payment required before store packs).
8. Paste and run `supabase/loomy_cart_order.sql` (multi-line cart checkout RPC).
9. In **Database → Replication**, enable realtime for `public.orders` and `public.product_inventory` if you want live UI updates without refresh.
10. Confirm rows exist:

```sql
select email, role, store_id, courier_id from public.partner_profiles order by email;
select email, full_name, style_tags from public.customer_profiles order by email;
select count(*) from public.stores;
select count(*) from public.products;
select proname from pg_proc where proname in ('place_loomy_order', 'place_loomy_cart_order', 'progress_order_store', 'progress_order_courier');
select table_name from information_schema.tables where table_schema = 'public' and table_name = 'stripe_events';
```

Se fuld kørselsrækkefølge i `supabase/MIGRATION_ORDER.md`.

RLS er aktiveret på alle tabeller med brugerdata; partner- og kundeprofiler matcher JWT-e-mail
eller `auth.uid()` hvor det er relevant.
