-- ============================================================================
-- LOOMY — Full platform schema (Supabase PostgreSQL)
-- Run once in Supabase SQL Editor after backing up if upgrading an existing DB.
--
-- Includes: catalog (stores, products, inventory), couriers, orders, payments,
-- feedback, partner_profiles, customer_profiles (+ signup trigger).
-- RLS: deny by default; explicit policies per role (customer / store / courier).
--
-- Order of execution: run this file AFTER partner_profiles.sql and
-- customer_profiles.sql ONLY IF this is a greenfield install — OR use only this file
-- on empty public schema. For existing installs see comments in each section.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Types
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.loomy_order_status as enum (
    'order_placed',
    'store_packing',
    'courier_pickup',
    'on_the_way',
    'delivered',
    'cancelled'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.loomy_courier_status as enum ('available', 'on_delivery');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.loomy_payment_status as enum (
    'requires_payment',
    'processing',
    'succeeded',
    'failed',
    'refunded',
    'cancelled'
  );
exception when duplicate_object then null;
end $$;

-- ----------------------------------------------------------------------------
-- Helpers: updated_at + partner resolution for RLS (SECURITY DEFINER, fixed search_path)
-- ----------------------------------------------------------------------------
create or replace function public.loomy_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Returns store slug/id for current JWT if logged-in user is a store partner.
create or replace function public.loomy_partner_store_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.store_id
  from public.partner_profiles p
  where lower(p.email) = lower(auth.jwt() ->> 'email')
    and p.role = 'store'
  limit 1;
$$;

-- Returns courier slug/id for current JWT if logged-in user is a courier partner.
create or replace function public.loomy_partner_courier_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.courier_id
  from public.partner_profiles p
  where lower(p.email) = lower(auth.jwt() ->> 'email')
    and p.role = 'courier'
  limit 1;
$$;

-- ----------------------------------------------------------------------------
-- Couriers (operational record; linked to partner_profiles.courier_id by id text)
-- ----------------------------------------------------------------------------
create table if not exists public.couriers (
  id text primary key,
  display_name text not null,
  zone text not null default '',
  eta_minutes int not null default 15 check (eta_minutes >= 0),
  status public.loomy_courier_status not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists couriers_set_updated_at on public.couriers;
create trigger couriers_set_updated_at
before update on public.couriers
for each row execute function public.loomy_set_updated_at();

alter table public.couriers enable row level security;

drop policy if exists "couriers_select_authenticated" on public.couriers;
create policy "couriers_select_authenticated"
on public.couriers for select to authenticated using (true);

drop policy if exists "couriers_select_anon" on public.couriers;
create policy "couriers_select_anon"
on public.couriers for select to anon using (true);

-- Couriers: optional future write via service role only (no broad update policy).

-- ----------------------------------------------------------------------------
-- Stores & catalog
-- ----------------------------------------------------------------------------
create table if not exists public.stores (
  id text primary key,
  name text not null,
  neighborhood text not null default '',
  address text not null,
  eta_minutes int not null default 30 check (eta_minutes >= 0),
  rating numeric(3, 2) not null default 4.5 check (rating >= 0 and rating <= 5),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists stores_set_updated_at on public.stores;
create trigger stores_set_updated_at
before update on public.stores
for each row execute function public.loomy_set_updated_at();

create index if not exists stores_active_idx on public.stores (is_active);

alter table public.stores enable row level security;

drop policy if exists "stores_select_public" on public.stores;
create policy "stores_select_public"
on public.stores for select using (is_active = true);

drop policy if exists "stores_update_partner" on public.stores;
create policy "stores_update_partner"
on public.stores for update to authenticated
using (id = public.loomy_partner_store_id())
with check (id = public.loomy_partner_store_id());

create table if not exists public.products (
  id text primary key,
  store_id text not null references public.stores (id) on delete cascade,
  name text not null,
  category text not null check (category in ('New In', 'Emergency Outfits', 'Shoes', 'Accessories')),
  description text not null default '',
  image_url text not null default '',
  price_minor int not null check (price_minor >= 0),
  currency text not null default 'DKK',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.loomy_set_updated_at();

create index if not exists products_store_idx on public.products (store_id);
create index if not exists products_category_idx on public.products (category);

alter table public.products enable row level security;

drop policy if exists "products_select_active" on public.products;
create policy "products_select_active"
on public.products for select using (is_active = true);

drop policy if exists "products_all_partner_store" on public.products;
create policy "products_all_partner_store"
on public.products for all to authenticated
using (store_id = public.loomy_partner_store_id())
with check (store_id = public.loomy_partner_store_id());

create table if not exists public.product_inventory (
  product_id text not null references public.products (id) on delete cascade,
  size text not null check (size in ('XS', 'S', 'M', 'L')),
  qty int not null default 0 check (qty >= 0),
  updated_at timestamptz not null default now(),
  primary key (product_id, size)
);

create index if not exists product_inventory_product_idx on public.product_inventory (product_id);

alter table public.product_inventory enable row level security;

drop policy if exists "inventory_select_public" on public.product_inventory;
create policy "inventory_select_public"
on public.product_inventory for select using (
  exists (
    select 1 from public.products pr
    where pr.id = product_id and pr.is_active = true
  )
);

drop policy if exists "inventory_write_partner" on public.product_inventory;
create policy "inventory_write_partner"
on public.product_inventory for all to authenticated
using (
  exists (
    select 1 from public.products pr
    where pr.id = product_id and pr.store_id = public.loomy_partner_store_id()
  )
)
with check (
  exists (
    select 1 from public.products pr
    where pr.id = product_id and pr.store_id = public.loomy_partner_store_id()
  )
);

-- ----------------------------------------------------------------------------
-- Customer profiles: align with auth.users (recommended shape for production)
-- If you already ran customer_profiles.sql with only email PK, run migration
-- section at bottom of this file manually or adjust constraints.
-- ----------------------------------------------------------------------------
-- Replace legacy table if empty schema; otherwise ALTER blocks below may fail — adjust once.
alter table public.customer_profiles
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

create unique index if not exists customer_profiles_user_id_key
  on public.customer_profiles (user_id) where user_id is not null;

-- Auto-create profile row when a user signs up (email/password or OAuth).
create or replace function public.loomy_handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.customer_profiles (user_id, email, full_name, phone, address, style_tags)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'user'), '@', 1)),
    coalesce(new.phone, null),
    coalesce(new.raw_user_meta_data ->> 'address', ''),
    coalesce(
      case
        when new.raw_user_meta_data ? 'style_tags'
        then array(select jsonb_array_elements_text(new.raw_user_meta_data -> 'style_tags'))
        else '{}'::text[]
      end,
      '{}'::text[]
    )
  )
  on conflict (email) do update set
    user_id = excluded.user_id,
    full_name = excluded.full_name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_customer on auth.users;
create trigger on_auth_user_created_customer
after insert on auth.users
for each row execute function public.loomy_handle_new_auth_user();

-- Refresh RLS: scope by user_id when present
drop policy if exists "customer_profiles_select_own_email" on public.customer_profiles;
drop policy if exists "customer_profiles_select_own_email_or_uid" on public.customer_profiles;
create policy "customer_profiles_select_own_email_or_uid"
on public.customer_profiles for select to authenticated
using (
  lower(email) = lower(auth.jwt() ->> 'email')
  or user_id = auth.uid()
);

drop policy if exists "customer_profiles_update_own_email" on public.customer_profiles;
drop policy if exists "customer_profiles_update_own_uid" on public.customer_profiles;
create policy "customer_profiles_update_own_uid"
on public.customer_profiles for update to authenticated
using (
  user_id = auth.uid()
  or (
    user_id is null
    and lower(email) = lower(auth.jwt() ->> 'email')
  )
)
with check (
  user_id = auth.uid()
  or lower(email) = lower(auth.jwt() ->> 'email')
);

drop policy if exists "customer_profiles_insert_own_uid" on public.customer_profiles;
create policy "customer_profiles_insert_own_uid"
on public.customer_profiles for insert to authenticated
with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Orders & items
-- ----------------------------------------------------------------------------
create table if not exists public.orders (
  id text primary key,
  customer_user_id uuid not null references auth.users (id) on delete restrict,
  store_id text not null references public.stores (id),
  courier_id text references public.couriers (id),
  status public.loomy_order_status not null default 'order_placed',
  delivery_address text not null,
  eta_minutes int not null default 25 check (eta_minutes >= 0),
  currency text not null default 'DKK',
  total_minor int check (total_minor is null or total_minor >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.loomy_set_updated_at();

create index if not exists orders_customer_idx on public.orders (customer_user_id);
create index if not exists orders_store_idx on public.orders (store_id);
create index if not exists orders_courier_idx on public.orders (courier_id);
create index if not exists orders_status_idx on public.orders (status);

alter table public.orders enable row level security;

drop policy if exists "orders_select_customer" on public.orders;
create policy "orders_select_customer"
on public.orders for select to authenticated
using (customer_user_id = auth.uid());

drop policy if exists "orders_select_store" on public.orders;
create policy "orders_select_store"
on public.orders for select to authenticated
using (store_id = public.loomy_partner_store_id());

drop policy if exists "orders_select_courier" on public.orders;
create policy "orders_select_courier"
on public.orders for select to authenticated
using (
  courier_id is not null
  and courier_id = public.loomy_partner_courier_id()
);

drop policy if exists "orders_insert_customer" on public.orders;
create policy "orders_insert_customer"
on public.orders for insert to authenticated
with check (customer_user_id = auth.uid());

drop policy if exists "orders_update_store" on public.orders;
create policy "orders_update_store"
on public.orders for update to authenticated
using (store_id = public.loomy_partner_store_id())
with check (store_id = public.loomy_partner_store_id());

drop policy if exists "orders_update_courier" on public.orders;
create policy "orders_update_courier"
on public.orders for update to authenticated
using (
  courier_id is not null
  and courier_id = public.loomy_partner_courier_id()
)
with check (
  courier_id is not null
  and courier_id = public.loomy_partner_courier_id()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders (id) on delete cascade,
  product_id text not null,
  product_name text not null,
  size text not null check (size in ('XS', 'S', 'M', 'L')),
  qty int not null default 1 check (qty > 0),
  unit_price_minor int not null check (unit_price_minor >= 0),
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_idx on public.order_items (order_id);

alter table public.order_items enable row level security;

drop policy if exists "order_items_select_via_order" on public.order_items;
create policy "order_items_select_via_order"
on public.order_items for select to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and (
        o.customer_user_id = auth.uid()
        or o.store_id = public.loomy_partner_store_id()
        or (o.courier_id is not null and o.courier_id = public.loomy_partner_courier_id())
      )
  )
);

drop policy if exists "order_items_insert_customer" on public.order_items;
create policy "order_items_insert_customer"
on public.order_items for insert to authenticated
with check (
  exists (
    select 1 from public.orders o
    where o.id = order_id and o.customer_user_id = auth.uid()
  )
);

-- ----------------------------------------------------------------------------
-- Payments (Stripe Connect — metadata only; charges via Edge Functions / server)
-- ----------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique references public.orders (id) on delete cascade,
  stripe_payment_intent_id text,
  stripe_connect_account_id text,
  status public.loomy_payment_status not null default 'requires_payment',
  amount_minor int not null check (amount_minor >= 0),
  currency text not null default 'DKK',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_order_idx on public.payments (order_id);
create index if not exists payments_metadata_idx on public.payments using gin (metadata);

alter table public.payments enable row level security;

drop policy if exists "payments_select_customer" on public.payments;
create policy "payments_select_customer"
on public.payments for select to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id and o.customer_user_id = auth.uid()
  )
);

drop policy if exists "payments_select_store" on public.payments;
create policy "payments_select_store"
on public.payments for select to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id and o.store_id = public.loomy_partner_store_id()
  )
);

-- No insert/update from client — use service role or Edge Functions only.

-- ----------------------------------------------------------------------------
-- Feedback (customer submissions)
-- ----------------------------------------------------------------------------
create table if not exists public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  email text,
  message text not null,
  rating int check (rating is null or (rating >= 1 and rating <= 5)),
  created_at timestamptz not null default now()
);

alter table public.feedback_submissions enable row level security;

drop policy if exists "feedback_insert_authenticated" on public.feedback_submissions;
create policy "feedback_insert_authenticated"
on public.feedback_submissions for insert to authenticated
with check (user_id is null or user_id = auth.uid());

drop policy if exists "feedback_insert_anon" on public.feedback_submissions;
create policy "feedback_insert_anon"
on public.feedback_submissions for insert to anon
with check (user_id is null);

drop policy if exists "feedback_select_own" on public.feedback_submissions;
create policy "feedback_select_own"
on public.feedback_submissions for select to authenticated
using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Seed: couriers + catalog (aligned with app demo IDs)
-- ----------------------------------------------------------------------------
insert into public.couriers (id, display_name, zone, eta_minutes, status) values
  ('mikkel', 'Mikkel (Bike)', 'Inner City', 12, 'available'),
  ('sara', 'Sara (Car)', 'Norrebro', 18, 'on_delivery'),
  ('jonas', 'Jonas (Bike)', 'Vesterbro', 15, 'available')
on conflict (id) do update set
  display_name = excluded.display_name,
  zone = excluded.zone,
  eta_minutes = excluded.eta_minutes,
  status = excluded.status;

insert into public.stores (id, name, neighborhood, address, eta_minutes, rating) values
  ('strom-boutique', 'Strøm Boutique', 'Indre By', 'Kronprinsensgade 22, 1114 København K', 28, 4.9),
  ('naked-copenhagen-edit', 'Naked Copenhagen Edit', 'Indre By', 'Pilestræde 46, 1112 København K', 32, 4.8),
  ('birger-et-mikkelsen-house', 'Birger et Mikkelsen House', 'Indre By', 'Amagertorv 33, 1160 København K', 35, 4.7),
  ('wood-wood-city', 'WOOD WOOD City', 'Indre By', 'Grønnegade 1, 1107 København K', 30, 4.8),
  ('storm-cph', 'STORM Copenhagen', 'Indre By', 'Store Regnegade 1, 1110 København K', 26, 4.9)
on conflict (id) do update set
  name = excluded.name,
  address = excluded.address,
  eta_minutes = excluded.eta_minutes,
  rating = excluded.rating;

-- Products: price_minor = DKK * 100 (øre) for Stripe-ready amounts
insert into public.products (id, store_id, name, category, description, image_url, price_minor) values
  ('strom-silk-shirt', 'strom-boutique', 'Silk Shirt', 'New In', 'Premium silk shirt for office and dinner.', '/products/new-in.svg', 89900),
  ('strom-midnight-blazer', 'strom-boutique', 'Midnight Blazer', 'Emergency Outfits', 'Tailored blazer for last-minute events.', '/products/emergency.svg', 149900),
  ('strom-oxford-loafer', 'strom-boutique', 'Oxford Loafer', 'Shoes', 'Classic loafers with all-day comfort.', '/products/shoes.svg', 129900),
  ('strom-gold-chain', 'strom-boutique', 'Gold Chain', 'Accessories', 'Minimal gold-plated statement chain.', '/products/accessories.svg', 69900),
  ('naked-bomber-jacket', 'naked-copenhagen-edit', 'Oversized Bomber', 'New In', 'Streetwear bomber with premium finish.', '/products/new-in.svg', 119900),
  ('naked-utility-set', 'naked-copenhagen-edit', 'Utility Set', 'Emergency Outfits', 'Complete matching set ready to wear.', '/products/emergency.svg', 99900),
  ('naked-runner', 'naked-copenhagen-edit', 'City Runner Sneaker', 'Shoes', 'Urban running sneaker in neutral tones.', '/products/shoes.svg', 109900),
  ('naked-cap', 'naked-copenhagen-edit', 'Signature Cap', 'Accessories', 'Low-profile cap with subtle branding.', '/products/accessories.svg', 39900),
  ('bemk-wrap-dress', 'birger-et-mikkelsen-house', 'Wrap Dress', 'New In', 'Elegant wrap dress in soft satin.', '/products/new-in.svg', 159900),
  ('bemk-event-trouser', 'birger-et-mikkelsen-house', 'Event Trouser', 'Emergency Outfits', 'Tailored trouser for evening and business.', '/products/emergency.svg', 109900),
  ('bemk-heel', 'birger-et-mikkelsen-house', 'Leather Heel', 'Shoes', 'Soft leather heel with stable fit.', '/products/shoes.svg', 139900),
  ('bemk-clutch', 'birger-et-mikkelsen-house', 'Evening Clutch', 'Accessories', 'Compact clutch for occasion wear.', '/products/accessories.svg', 79900),
  ('ww-city-hoodie', 'wood-wood-city', 'City Hoodie', 'New In', 'Relaxed premium hoodie for city wear.', '/products/new-in.svg', 89900),
  ('ww-date-night-fit', 'wood-wood-city', 'Date Night Fit', 'Emergency Outfits', 'Complete outfit ready for tonight.', '/products/emergency.svg', 139900),
  ('ww-street-runner', 'wood-wood-city', 'Street Runner', 'Shoes', 'Hybrid sneaker with lightweight sole.', '/products/shoes.svg', 119900),
  ('ww-crossbody', 'wood-wood-city', 'Crossbody Bag', 'Accessories', 'Compact crossbody for essentials.', '/products/accessories.svg', 64900),
  ('storm-merino-knit', 'storm-cph', 'Merino Knit', 'New In', 'Fine merino knit in modern silhouette.', '/products/new-in.svg', 99900),
  ('storm-black-set', 'storm-cph', 'Black Tailored Set', 'Emergency Outfits', 'Polished set for same-day events.', '/products/emergency.svg', 169900),
  ('storm-derby', 'storm-cph', 'Leather Derby', 'Shoes', 'Hand-finished derby with sleek profile.', '/products/shoes.svg', 149900),
  ('storm-scarf', 'storm-cph', 'Cashmere Scarf', 'Accessories', 'Soft cashmere scarf in neutral tones.', '/products/accessories.svg', 54900)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  image_url = excluded.image_url,
  price_minor = excluded.price_minor;

-- Inventory seed (matches demo stock in app)
insert into public.product_inventory (product_id, size, qty) values
  ('strom-silk-shirt', 'XS', 2), ('strom-silk-shirt', 'S', 4), ('strom-silk-shirt', 'M', 3), ('strom-silk-shirt', 'L', 2),
  ('strom-midnight-blazer', 'XS', 1), ('strom-midnight-blazer', 'S', 2), ('strom-midnight-blazer', 'M', 3), ('strom-midnight-blazer', 'L', 2),
  ('strom-oxford-loafer', 'XS', 1), ('strom-oxford-loafer', 'S', 2), ('strom-oxford-loafer', 'M', 2), ('strom-oxford-loafer', 'L', 1),
  ('strom-gold-chain', 'XS', 3), ('strom-gold-chain', 'S', 3), ('strom-gold-chain', 'M', 3), ('strom-gold-chain', 'L', 3),
  ('naked-bomber-jacket', 'XS', 1), ('naked-bomber-jacket', 'S', 2), ('naked-bomber-jacket', 'M', 2), ('naked-bomber-jacket', 'L', 1),
  ('naked-utility-set', 'XS', 2), ('naked-utility-set', 'S', 3), ('naked-utility-set', 'M', 2), ('naked-utility-set', 'L', 1),
  ('naked-runner', 'XS', 1), ('naked-runner', 'S', 2), ('naked-runner', 'M', 2), ('naked-runner', 'L', 2),
  ('naked-cap', 'XS', 4), ('naked-cap', 'S', 4), ('naked-cap', 'M', 4), ('naked-cap', 'L', 4),
  ('bemk-wrap-dress', 'XS', 1), ('bemk-wrap-dress', 'S', 2), ('bemk-wrap-dress', 'M', 2), ('bemk-wrap-dress', 'L', 1),
  ('bemk-event-trouser', 'XS', 2), ('bemk-event-trouser', 'S', 2), ('bemk-event-trouser', 'M', 3), ('bemk-event-trouser', 'L', 2),
  ('bemk-heel', 'XS', 1), ('bemk-heel', 'S', 1), ('bemk-heel', 'M', 2), ('bemk-heel', 'L', 1),
  ('bemk-clutch', 'XS', 2), ('bemk-clutch', 'S', 2), ('bemk-clutch', 'M', 2), ('bemk-clutch', 'L', 2),
  ('ww-city-hoodie', 'XS', 3), ('ww-city-hoodie', 'S', 4), ('ww-city-hoodie', 'M', 4), ('ww-city-hoodie', 'L', 3),
  ('ww-date-night-fit', 'XS', 1), ('ww-date-night-fit', 'S', 2), ('ww-date-night-fit', 'M', 2), ('ww-date-night-fit', 'L', 2),
  ('ww-street-runner', 'XS', 2), ('ww-street-runner', 'S', 2), ('ww-street-runner', 'M', 3), ('ww-street-runner', 'L', 2),
  ('ww-crossbody', 'XS', 3), ('ww-crossbody', 'S', 3), ('ww-crossbody', 'M', 3), ('ww-crossbody', 'L', 3),
  ('storm-merino-knit', 'XS', 2), ('storm-merino-knit', 'S', 3), ('storm-merino-knit', 'M', 3), ('storm-merino-knit', 'L', 2),
  ('storm-black-set', 'XS', 1), ('storm-black-set', 'S', 2), ('storm-black-set', 'M', 2), ('storm-black-set', 'L', 1),
  ('storm-derby', 'XS', 1), ('storm-derby', 'S', 2), ('storm-derby', 'M', 2), ('storm-derby', 'L', 1),
  ('storm-scarf', 'XS', 5), ('storm-scarf', 'S', 5), ('storm-scarf', 'M', 5), ('storm-scarf', 'L', 5)
on conflict (product_id, size) do update set qty = excluded.qty;

-- ============================================================================
-- End of loomy_platform.sql
-- ============================================================================
