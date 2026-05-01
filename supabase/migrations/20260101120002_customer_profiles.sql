-- Run this in Supabase SQL Editor
-- Purpose: customer demo profiles for LOOMY login/personalization flows
--
-- Also create Auth users for these emails in Supabase Authentication
-- (for local/demo use the same password, e.g. Demo1234!).

create extension if not exists pgcrypto;

create table if not exists public.customer_profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  phone text,
  address text not null,
  style_tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_profiles_email_idx on public.customer_profiles (lower(email));
create index if not exists customer_profiles_style_tags_idx on public.customer_profiles using gin (style_tags);

create or replace function public.set_customer_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists customer_profiles_set_updated_at on public.customer_profiles;
create trigger customer_profiles_set_updated_at
before update on public.customer_profiles
for each row
execute function public.set_customer_profiles_updated_at();

alter table public.customer_profiles enable row level security;

drop policy if exists "customer_profiles_select_own_email" on public.customer_profiles;
create policy "customer_profiles_select_own_email"
on public.customer_profiles
for select
to authenticated
using (lower(email) = lower(auth.jwt() ->> 'email'));

drop policy if exists "customer_profiles_update_own_email" on public.customer_profiles;
create policy "customer_profiles_update_own_email"
on public.customer_profiles
for update
to authenticated
using (lower(email) = lower(auth.jwt() ->> 'email'))
with check (lower(email) = lower(auth.jwt() ->> 'email'));

-- Optional: seed customer mappings used by the app
insert into public.customer_profiles (email, full_name, phone, address, style_tags)
values
  (
    'emma@loomy.dk',
    'Emma Larsen',
    '+45 31 25 80 90',
    'Store Kongensgade 45, 2. tv, 1264 København K',
    array['minimal', 'tailored', 'neutral']
  ),
  (
    'noah@loomy.dk',
    'Noah Petersen',
    '+45 42 14 77 01',
    'Larsbjornsstraede 9, 1. th, 1454 København K',
    array['street', 'monochrome', 'utility']
  ),
  (
    'sofie@loomy.dk',
    'Sofie Madsen',
    '+45 29 11 50 04',
    'Nørre Voldgade 12, 3. sal, 1358 København K',
    array['occasion', 'soft', 'elegant']
  )
on conflict (email) do update set
  full_name = excluded.full_name,
  phone = excluded.phone,
  address = excluded.address,
  style_tags = excluded.style_tags;
