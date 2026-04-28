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
5. Confirm rows exist:

```sql
select email, role, store_id, courier_id from public.partner_profiles order by email;
select email, full_name, style_tags from public.customer_profiles order by email;
select count(*) from public.stores;
select count(*) from public.products;
```

Se fuld kørselsrækkefølge i `supabase/MIGRATION_ORDER.md`.

RLS er aktiveret på alle tabeller med brugerdata; partner- og kundeprofiler matcher JWT-e-mail
eller `auth.uid()` hvor det er relevant.
