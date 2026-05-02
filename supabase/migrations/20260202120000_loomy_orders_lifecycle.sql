-- LOOMY order lifecycle for OrderManager state machine (server / service role).
-- Service role bypasses RLS; authenticated clients have no policies until you add tenant-scoped rules.

create table if not exists public.loomy_orders (
  id text primary key,
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
  updated_at timestamptz not null default now()
);

create index if not exists loomy_orders_status_idx on public.loomy_orders (status);
create index if not exists loomy_orders_updated_at_idx on public.loomy_orders (updated_at desc);

alter table public.loomy_orders enable row level security;

comment on table public.loomy_orders is
  'Order lifecycle statuses for OrderManager. Mutate from Edge Functions or server routes using the service role key.';
