-- LOOMY orders: lifecycle + store routing for StoreNotificationService / OrderManager.

create table if not exists public.loomy_orders (
  id text primary key,
  store_id text not null,
  status text not null
    default 'pending_payment'
    check (
      status in (
        'pending_payment',
        'paid',
        'ready_for_pickup',
        'delivered'
      )
    ),
  order_details jsonb not null default '{}'::jsonb,
  offline_push_queued boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists loomy_orders_store_status_idx
  on public.loomy_orders (store_id, status);

create index if not exists loomy_orders_updated_at_idx
  on public.loomy_orders (updated_at desc);

alter table public.loomy_orders enable row level security;

comment on table public.loomy_orders is
  'Order lifecycle + JSON order_details for store dashboard and notifications. Use service role from server until RLS is defined.';

-- Extend older minimal `loomy_orders` (id, status, updated_at only) if that migration ran first.
alter table public.loomy_orders add column if not exists store_id text;
alter table public.loomy_orders add column if not exists order_details jsonb not null default '{}'::jsonb;
alter table public.loomy_orders add column if not exists offline_push_queued boolean not null default false;

update public.loomy_orders
set store_id = coalesce(nullif(trim(store_id), ''), order_details->>'storeId', 'unknown-store')
where store_id is null or trim(store_id) = '';

alter table public.loomy_orders alter column store_id set not null;
