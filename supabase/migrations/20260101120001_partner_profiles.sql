-- Run this in Supabase SQL Editor
-- Purpose: role-based partner mapping for Store and Courier logins
--
-- Also create Auth users for these emails in Supabase Authentication (e.g. Demo1234! for dev).
-- Courier login: app looks up email by courier_id server-side; set SUPABASE_SERVICE_ROLE_KEY
-- in your deployment (see supabase/README.md).

create extension if not exists pgcrypto;

create table if not exists public.partner_profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null check (role in ('store', 'courier')),
  store_id text,
  courier_id text,
  created_at timestamptz not null default now(),
  constraint partner_profiles_role_ref check (
    (role = 'store' and store_id is not null and courier_id is null) or
    (role = 'courier' and courier_id is not null and store_id is null)
  )
);

alter table public.partner_profiles enable row level security;

drop policy if exists "partner_profiles_select_own_email" on public.partner_profiles;
create policy "partner_profiles_select_own_email"
on public.partner_profiles
for select
to authenticated
using (lower(email) = lower(auth.jwt() ->> 'email'));

-- Optional: seed partner mappings used by the app
insert into public.partner_profiles (email, role, store_id)
values
  ('store.strom@loomy.dk', 'store', 'strom-boutique'),
  ('store.naked@loomy.dk', 'store', 'naked-copenhagen-edit'),
  ('store.birger@loomy.dk', 'store', 'birger-et-mikkelsen-house'),
  ('store.woodwood@loomy.dk', 'store', 'wood-wood-city'),
  ('store.storm@loomy.dk', 'store', 'storm-cph')
on conflict (email) do update set
  role = excluded.role,
  store_id = excluded.store_id,
  courier_id = null;

insert into public.partner_profiles (email, role, courier_id)
values
  ('courier.mikkel@loomy.dk', 'courier', 'mikkel'),
  ('courier.sara@loomy.dk', 'courier', 'sara'),
  ('courier.jonas@loomy.dk', 'courier', 'jonas')
on conflict (email) do update set
  role = excluded.role,
  store_id = null,
  courier_id = excluded.courier_id;
