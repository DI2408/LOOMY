-- Full LOOMY orders + couriers (use if earlier courier migrations were never applied).

create table if not exists public.loomy_orders (
  id text primary key,
  store_id text not null default 'unknown-store',
  courier_id text,
  status text not null default 'pending_payment',
  order_details jsonb not null default '{}'::jsonb,
  offline_push_queued boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.loomy_orders add column if not exists courier_id text;
alter table public.loomy_orders add column if not exists store_id text;
alter table public.loomy_orders add column if not exists order_details jsonb;
alter table public.loomy_orders add column if not exists offline_push_queued boolean;

alter table public.loomy_orders alter column store_id set default 'unknown-store';

update public.loomy_orders
set store_id = coalesce(nullif(trim(store_id), ''), order_details->>'storeId', 'unknown-store')
where store_id is null or trim(store_id) = '';

alter table public.loomy_orders alter column store_id set not null;

alter table public.loomy_orders alter column order_details set default '{}'::jsonb;
update public.loomy_orders set order_details = '{}'::jsonb where order_details is null;
alter table public.loomy_orders alter column order_details set not null;

alter table public.loomy_orders alter column offline_push_queued set default false;
update public.loomy_orders set offline_push_queued = coalesce(offline_push_queued, false) where offline_push_queued is null;
alter table public.loomy_orders alter column offline_push_queued set not null;

alter table public.loomy_orders drop constraint if exists loomy_orders_status_check;

alter table public.loomy_orders add constraint loomy_orders_status_check check (
  status in (
    'pending_payment',
    'paid',
    'ready_for_pickup',
    'dispatched',
    'out_for_delivery',
    'delivered'
  )
);

create index if not exists loomy_orders_store_status_idx
  on public.loomy_orders (store_id, status);

create index if not exists loomy_orders_courier_status_idx
  on public.loomy_orders (courier_id, status);

alter table public.loomy_orders enable row level security;

create table if not exists public.loomy_couriers (
  id text primary key,
  is_available boolean not null default true,
  lat double precision,
  lng double precision,
  updated_at timestamptz not null default now()
);

alter table public.loomy_couriers enable row level security;

insert into public.loomy_couriers (id, is_available)
values ('mikkel', true), ('sara', true), ('jonas', true)
on conflict (id) do update set is_available = excluded.is_available;
