# Supabase Auth Setup (Store + Courier)

This project now uses Supabase email/password login for partner access.

## 1) Environment variables

Create `.env.local` in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
# Server only (never NEXT_PUBLIC_*): used by API routes for catalog/orders and guest checkout RPC
SUPABASE_SECRET_KEY=your_service_role_or_secret_key
```

Apply the database migration once (Supabase SQL Editor: paste `supabase/migrations/20260202120000_loomy_core_marketplace.sql`, or `supabase db push` if you use the CLI linked to the project). The legacy `supabase/partner_profiles.sql` is superseded by that migration.

## 2) Create auth users in Supabase Dashboard

Go to **Authentication -> Users** and create email/password users.

Use these partner emails (mapped in code):

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

## 3) Login pages

- Store login: `/login/store`
- Courier login: `/login/courier`

Each dashboard is role-specific:

- Store sees only orders and catalog for its store mapping.
- Courier sees only orders assigned to that courier mapping.

## 4) Notes

- Mapping is now database-driven in `public.partner_profiles`.
- Run `supabase/partner_profiles.sql` in Supabase SQL Editor first.

## 5) Database setup (required)

1. Open Supabase SQL Editor.
2. Paste and run `supabase/partner_profiles.sql`.
3. Confirm rows exist:

```sql
select email, role, store_id, courier_id from public.partner_profiles order by email;
```

This table uses RLS and only allows authenticated users to select rows where `email` matches the logged-in JWT email.
