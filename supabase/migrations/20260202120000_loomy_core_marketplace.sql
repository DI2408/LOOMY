-- LOOMY core marketplace schema: catalog, inventory, orders, events, partner RLS.
-- Apply with: supabase db push / SQL Editor / supabase migration up

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.order_status as enum (
    'order_placed',
    'store_packing',
    'courier_pickup',
    'on_the_way',
    'delivered'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.order_event_type as enum (
    'status_change',
    'note',
    'eta_update',
    'system'
  );
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Partner profiles (align with app; add user link for future)
-- ---------------------------------------------------------------------------
create table if not exists public.partner_profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null check (role in ('store', 'courier')),
  store_id text,
  courier_id text,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint partner_profiles_role_ref check (
    (role = 'store' and store_id is not null and courier_id is null)
    or (role = 'courier' and courier_id is not null and store_id is null)
  )
);

alter table public.partner_profiles
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create unique index if not exists partner_profiles_user_id_key
  on public.partner_profiles (user_id)
  where user_id is not null;

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------
create table if not exists public.stores (
  id text primary key,
  name text not null,
  neighborhood text not null,
  address text not null,
  eta_minutes integer not null default 30,
  rating numeric(2, 1) not null default 4.8,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  store_id text not null references public.stores (id) on delete cascade,
  name text not null,
  category text not null,
  description text not null,
  image_url text not null,
  price_ore integer not null check (price_ore >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_levels (
  product_id text not null references public.products (id) on delete cascade,
  size text not null check (size in ('XS', 'S', 'M', 'L')),
  quantity integer not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  primary key (product_id, size)
);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  human_ref text not null unique,
  store_id text not null references public.stores (id),
  customer_user_id uuid references auth.users (id) on delete set null,
  customer_name text not null,
  customer_address text not null,
  status public.order_status not null default 'order_placed',
  courier_slug text,
  nearby_eta_minutes integer not null default 20,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_store_status_created_idx
  on public.orders (store_id, status, created_at desc);

create index if not exists orders_courier_status_created_idx
  on public.orders (courier_slug, status, created_at desc)
  where courier_slug is not null;

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id text not null references public.products (id),
  product_name text not null,
  size text not null check (size in ('XS', 'S', 'M', 'L')),
  qty integer not null default 1 check (qty > 0),
  unit_price_ore integer not null check (unit_price_ore >= 0),
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  type public.order_event_type not null default 'status_change',
  from_status public.order_status,
  to_status public.order_status,
  actor_user_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists order_events_order_created_idx
  on public.order_events (order_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.partner_profiles enable row level security;
alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.inventory_levels enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;

-- Partner: own row by email
drop policy if exists "partner_profiles_select_own_email" on public.partner_profiles;
create policy "partner_profiles_select_own_email"
on public.partner_profiles
for select
to authenticated
using (lower(email) = lower((select auth.jwt()) ->> 'email'));

-- Catalog: world-readable (customer shopping without account)
drop policy if exists "stores_select_all" on public.stores;
create policy "stores_select_all"
on public.stores
for select
to anon, authenticated
using (true);

drop policy if exists "products_select_all" on public.products;
create policy "products_select_all"
on public.products
for select
to anon, authenticated
using (true);

drop policy if exists "inventory_select_all" on public.inventory_levels;
create policy "inventory_select_all"
on public.inventory_levels
for select
to anon, authenticated
using (true);

-- Store staff: update inventory for their store’s products
drop policy if exists "inventory_update_store_staff" on public.inventory_levels;
create policy "inventory_update_store_staff"
on public.inventory_levels
for update
to authenticated
using (
  exists (
    select 1
    from public.products p
    join public.partner_profiles pp
      on pp.role = 'store'
     and lower(pp.email) = lower((select auth.jwt()) ->> 'email')
     and pp.store_id = p.store_id
    where p.id = inventory_levels.product_id
  )
)
with check (
  exists (
    select 1
    from public.products p
    join public.partner_profiles pp
      on pp.role = 'store'
     and lower(pp.email) = lower((select auth.jwt()) ->> 'email')
     and pp.store_id = p.store_id
    where p.id = inventory_levels.product_id
  )
);

-- Orders: customers see own; store sees store queue; courier sees assigned
drop policy if exists "orders_select_customer" on public.orders;
create policy "orders_select_customer"
on public.orders
for select
to authenticated
using (customer_user_id = (select auth.uid()));

drop policy if exists "orders_select_store_staff" on public.orders;
create policy "orders_select_store_staff"
on public.orders
for select
to authenticated
using (
  exists (
    select 1 from public.partner_profiles pp
    where pp.role = 'store'
      and lower(pp.email) = lower((select auth.jwt()) ->> 'email')
      and pp.store_id = orders.store_id
  )
);

drop policy if exists "orders_select_courier" on public.orders;
create policy "orders_select_courier"
on public.orders
for select
to authenticated
using (
  courier_slug is not null
  and exists (
    select 1 from public.partner_profiles pp
    where pp.role = 'courier'
      and lower(pp.email) = lower((select auth.jwt()) ->> 'email')
      and pp.courier_id = orders.courier_slug
  )
);

drop policy if exists "orders_update_store_staff" on public.orders;
create policy "orders_update_store_staff"
on public.orders
for update
to authenticated
using (
  exists (
    select 1 from public.partner_profiles pp
    where pp.role = 'store'
      and lower(pp.email) = lower((select auth.jwt()) ->> 'email')
      and pp.store_id = orders.store_id
  )
)
with check (
  exists (
    select 1 from public.partner_profiles pp
    where pp.role = 'store'
      and lower(pp.email) = lower((select auth.jwt()) ->> 'email')
      and pp.store_id = orders.store_id
  )
);

drop policy if exists "orders_update_courier" on public.orders;
create policy "orders_update_courier"
on public.orders
for update
to authenticated
using (
  courier_slug is not null
  and exists (
    select 1 from public.partner_profiles pp
    where pp.role = 'courier'
      and lower(pp.email) = lower((select auth.jwt()) ->> 'email')
      and pp.courier_id = orders.courier_slug
  )
)
with check (
  courier_slug is not null
  and exists (
    select 1 from public.partner_profiles pp
    where pp.role = 'courier'
      and lower(pp.email) = lower((select auth.jwt()) ->> 'email')
      and pp.courier_id = orders.courier_slug
  )
);

-- Order items & events: same visibility as parent order
drop policy if exists "order_items_select" on public.order_items;
create policy "order_items_select"
on public.order_items
for select
to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
    and (
      o.customer_user_id = (select auth.uid())
      or exists (
        select 1 from public.partner_profiles pp
        where pp.role = 'store'
          and lower(pp.email) = lower((select auth.jwt()) ->> 'email')
          and pp.store_id = o.store_id
      )
      or (
        o.courier_slug is not null
        and exists (
          select 1 from public.partner_profiles pp
          where pp.role = 'courier'
            and lower(pp.email) = lower((select auth.jwt()) ->> 'email')
            and pp.courier_id = o.courier_slug
        )
      )
    )
  )
);

drop policy if exists "order_events_select" on public.order_events;
create policy "order_events_select"
on public.order_events
for select
to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_events.order_id
    and (
      o.customer_user_id = (select auth.uid())
      or exists (
        select 1 from public.partner_profiles pp
        where pp.role = 'store'
          and lower(pp.email) = lower((select auth.jwt()) ->> 'email')
          and pp.store_id = o.store_id
      )
      or (
        o.courier_slug is not null
        and exists (
          select 1 from public.partner_profiles pp
          where pp.role = 'courier'
            and lower(pp.email) = lower((select auth.jwt()) ->> 'email')
            and pp.courier_id = o.courier_slug
        )
      )
    )
  )
);

-- ---------------------------------------------------------------------------
-- RPC: guest place order (service_role only)
-- ---------------------------------------------------------------------------
create or replace function public.rpc_place_order_guest(
  p_store_id text,
  p_product_id text,
  p_size text,
  p_customer_name text,
  p_customer_address text,
  p_customer_user_id uuid default null,
  p_nearby_eta_minutes integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_qty integer;
  v_product public.products%rowtype;
  v_human_ref text;
  v_order_id uuid;
  v_courier text;
  v_eta integer;
begin
  if p_size not in ('XS', 'S', 'M', 'L') then
    raise exception 'invalid_size';
  end if;

  select * into v_product from public.products p where p.id = p_product_id and p.store_id = p_store_id;
  if not found then
    raise exception 'product_not_found';
  end if;

  select il.quantity into v_qty
  from public.inventory_levels il
  where il.product_id = p_product_id and il.size = p_size
  for update;

  if not found or v_qty < 1 then
    raise exception 'out_of_stock';
  end if;

  update public.inventory_levels
  set quantity = quantity - 1
  where product_id = p_product_id and size = p_size;

  v_human_ref := 'LMI-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  select pp.courier_id into v_courier
  from public.partner_profiles pp
  where pp.role = 'courier'
  order by random()
  limit 1;

  v_eta := coalesce(p_nearby_eta_minutes, 18 + floor(random() * 20)::int);

  insert into public.orders (
    human_ref,
    store_id,
    customer_user_id,
    customer_name,
    customer_address,
    status,
    courier_slug,
    nearby_eta_minutes
  )
  values (
    v_human_ref,
    p_store_id,
    p_customer_user_id,
    trim(p_customer_name),
    trim(p_customer_address),
    'order_placed',
    v_courier,
    v_eta
  )
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, product_name, size, qty, unit_price_ore)
  values (v_order_id, p_product_id, v_product.name, p_size, 1, v_product.price_ore);

  return jsonb_build_object(
    'order_id', v_order_id,
    'human_ref', v_human_ref,
    'courier_slug', v_courier,
    'nearby_eta_minutes', v_eta,
    'unit_price_ore', v_product.price_ore
  );
end;
$$;

revoke all on function public.rpc_place_order_guest(text, text, text, text, text, uuid, integer) from public;
revoke all on function public.rpc_place_order_guest(text, text, text, text, text, uuid, integer) from anon;
revoke all on function public.rpc_place_order_guest(text, text, text, text, text, uuid, integer) from authenticated;
grant execute on function public.rpc_place_order_guest(text, text, text, text, text, uuid, integer) to service_role;

-- ---------------------------------------------------------------------------
-- RPC: store advance (authenticated store partner)
-- ---------------------------------------------------------------------------
create or replace function public.rpc_store_advance_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower((select auth.jwt()) ->> 'email');
  v_store text;
  v_row public.orders%rowtype;
  v_next public.order_status;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select pp.store_id into v_store
  from public.partner_profiles pp
  where pp.role = 'store' and lower(pp.email) = v_email
  limit 1;

  if v_store is null then
    raise exception 'not_store_partner';
  end if;

  select * into v_row from public.orders o where o.id = p_order_id for update;
  if not found then
    raise exception 'order_not_found';
  end if;

  if v_row.store_id <> v_store then
    raise exception 'store_mismatch';
  end if;

  if v_row.status = 'order_placed' then
    v_next := 'store_packing';
  elsif v_row.status = 'store_packing' then
    v_next := 'courier_pickup';
  else
    raise exception 'invalid_status_transition';
  end if;

  update public.orders set status = v_next where id = p_order_id;

  return jsonb_build_object('status', v_next);
end;
$$;

revoke all on function public.rpc_store_advance_order(uuid) from public;
revoke all on function public.rpc_store_advance_order(uuid) from anon;
grant execute on function public.rpc_store_advance_order(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: courier advance (authenticated courier partner)
-- ---------------------------------------------------------------------------
create or replace function public.rpc_courier_advance_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower((select auth.jwt()) ->> 'email');
  v_courier text;
  v_row public.orders%rowtype;
  v_next public.order_status;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select pp.courier_id into v_courier
  from public.partner_profiles pp
  where pp.role = 'courier' and lower(pp.email) = v_email
  limit 1;

  if v_courier is null then
    raise exception 'not_courier_partner';
  end if;

  select * into v_row from public.orders o where o.id = p_order_id for update;
  if not found then
    raise exception 'order_not_found';
  end if;

  if v_row.courier_slug is null or v_row.courier_slug <> v_courier then
    raise exception 'courier_mismatch';
  end if;

  if v_row.status = 'courier_pickup' then
    v_next := 'on_the_way';
  elsif v_row.status = 'on_the_way' then
    v_next := 'delivered';
  else
    raise exception 'invalid_status_transition';
  end if;

  update public.orders set status = v_next where id = p_order_id;

  return jsonb_build_object('status', v_next);
end;
$$;

revoke all on function public.rpc_courier_advance_order(uuid) from public;
revoke all on function public.rpc_courier_advance_order(uuid) from anon;
grant execute on function public.rpc_courier_advance_order(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Seed stores, products, inventory (matches app slugs)
-- ---------------------------------------------------------------------------
insert into public.stores (id, name, neighborhood, address, eta_minutes, rating)
values
  ('strom-boutique', 'Strøm Boutique', 'Indre By', 'Kronprinsensgade 22, 1114 København K', 28, 4.9),
  ('naked-copenhagen-edit', 'Naked Copenhagen Edit', 'Indre By', 'Pilestræde 46, 1112 København K', 32, 4.8),
  ('birger-et-mikkelsen-house', 'Birger et Mikkelsen House', 'Indre By', 'Amagertorv 33, 1160 København K', 35, 4.7),
  ('wood-wood-city', 'WOOD WOOD City', 'Indre By', 'Grønnegade 1, 1107 København K', 30, 4.8),
  ('storm-cph', 'STORM Copenhagen', 'Indre By', 'Store Regnegade 1, 1110 København K', 26, 4.9)
on conflict (id) do update set
  name = excluded.name,
  neighborhood = excluded.neighborhood,
  address = excluded.address,
  eta_minutes = excluded.eta_minutes,
  rating = excluded.rating;

insert into public.products (id, store_id, name, category, description, image_url, price_ore)
values
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
  store_id = excluded.store_id,
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  image_url = excluded.image_url,
  price_ore = excluded.price_ore;

insert into public.inventory_levels (product_id, size, quantity) values
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
on conflict (product_id, size) do update set
  quantity = excluded.quantity,
  updated_at = now();

-- Partner seed (emails from SUPABASE_SETUP)
insert into public.partner_profiles (email, role, store_id)
values
  ('store.demo@loomy.dk', 'store', 'strom-boutique'),
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
  courier_id = excluded.courier_id,
  store_id = null;

-- Optional demo orders (fixed UUIDs for app hydration)
insert into public.orders (
  id, human_ref, store_id, customer_name, customer_address, status, courier_slug, nearby_eta_minutes, created_at
) values
  (
    'a1000001-0001-4001-8001-000000000001'::uuid,
    'LMI-1201',
    'strom-boutique',
    'Emma Larsen',
    'Store Kongensgade 45, 2. tv, 1264 København K',
    'order_placed',
    'mikkel',
    24,
    to_timestamp(1714064400)
  ),
  (
    'a1000001-0001-4001-8001-000000000002'::uuid,
    'LMI-1202',
    'storm-cph',
    'Noah Petersen',
    'Larsbjornsstraede 9, 1. th, 1454 København K',
    'store_packing',
    'mikkel',
    18,
    to_timestamp(1714060800)
  ),
  (
    'a1000001-0001-4001-8001-000000000003'::uuid,
    'LMI-1203',
    'naked-copenhagen-edit',
    'Sofie Madsen',
    'Nørre Voldgade 12, 3. sal, 1358 København K',
    'courier_pickup',
    'mikkel',
    16,
    to_timestamp(1714059000)
  ),
  (
    'a1000001-0001-4001-8001-000000000004'::uuid,
    'LMI-1204',
    'wood-wood-city',
    'Maja Andersen',
    'Kronprinsessegade 30, 2. tv, 1306 København K',
    'on_the_way',
    'sara',
    14,
    to_timestamp(1714057200)
  ),
  (
    'a1000001-0001-4001-8001-000000000005'::uuid,
    'LMI-1205',
    'birger-et-mikkelsen-house',
    'Freja Nielsen',
    'Borgergade 18, 2. tv, 1300 København K',
    'delivered',
    'jonas',
    22,
    to_timestamp(1714051800)
  )
on conflict (id) do nothing;

insert into public.order_items (id, order_id, product_id, product_name, size, qty, unit_price_ore)
values
  ('b1000001-0001-4001-8001-000000000001'::uuid, 'a1000001-0001-4001-8001-000000000001'::uuid, 'strom-silk-shirt', 'Silk Shirt', 'M', 1, 89900),
  ('b1000001-0001-4001-8001-000000000002'::uuid, 'a1000001-0001-4001-8001-000000000002'::uuid, 'storm-merino-knit', 'Merino Knit', 'S', 1, 99900),
  ('b1000001-0001-4001-8001-000000000003'::uuid, 'a1000001-0001-4001-8001-000000000003'::uuid, 'naked-runner', 'City Runner Sneaker', 'M', 1, 109900),
  ('b1000001-0001-4001-8001-000000000004'::uuid, 'a1000001-0001-4001-8001-000000000004'::uuid, 'ww-crossbody', 'Crossbody Bag', 'L', 1, 64900),
  ('b1000001-0001-4001-8001-000000000005'::uuid, 'a1000001-0001-4001-8001-000000000005'::uuid, 'bemk-wrap-dress', 'Wrap Dress', 'S', 1, 159900)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Triggers (after seed inserts so demo orders receive order_events)
-- ---------------------------------------------------------------------------
create or replace function public.tg_orders_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at
before update on public.orders
for each row
execute procedure public.tg_orders_touch_updated_at();

create or replace function public.tg_orders_log_status_event()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and (old.status is distinct from new.status) then
    insert into public.order_events (order_id, type, from_status, to_status, actor_user_id, payload)
    values (
      new.id,
      'status_change'::public.order_event_type,
      old.status,
      new.status,
      auth.uid(),
      '{}'::jsonb
    );
  elsif tg_op = 'INSERT' then
    insert into public.order_events (order_id, type, from_status, to_status, actor_user_id, payload)
    values (
      new.id,
      'status_change'::public.order_event_type,
      null,
      new.status,
      auth.uid(),
      jsonb_build_object('human_ref', new.human_ref)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists orders_log_status_event on public.orders;
create trigger orders_log_status_event
after insert or update of status on public.orders
for each row
execute procedure public.tg_orders_log_status_event();

create or replace function public.tg_inventory_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists inventory_touch_updated_at on public.inventory_levels;
create trigger inventory_touch_updated_at
before update on public.inventory_levels
for each row
execute procedure public.tg_inventory_touch_updated_at();

-- Backfill events for seeded orders (trigger was not active during insert)
insert into public.order_events (order_id, type, from_status, to_status, actor_user_id, payload)
select o.id, 'status_change'::public.order_event_type, null, o.status, null,
  jsonb_build_object('human_ref', o.human_ref)
from public.orders o
where o.id in (
  'a1000001-0001-4001-8001-000000000001'::uuid,
  'a1000001-0001-4001-8001-000000000002'::uuid,
  'a1000001-0001-4001-8001-000000000003'::uuid,
  'a1000001-0001-4001-8001-000000000004'::uuid,
  'a1000001-0001-4001-8001-000000000005'::uuid
)
and not exists (
  select 1 from public.order_events e where e.order_id = o.id
);

commit;
