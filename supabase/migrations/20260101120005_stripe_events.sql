-- LOOMY Stripe webhook idempotency table
-- Run in Supabase SQL Editor before enabling Stripe webhooks in production.

create table if not exists public.stripe_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  livemode boolean not null default false,
  payload jsonb not null,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_stripe_events_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists stripe_events_set_updated_at on public.stripe_events;
create trigger stripe_events_set_updated_at
before update on public.stripe_events
for each row
execute function public.set_stripe_events_updated_at();

create index if not exists stripe_events_event_type_idx on public.stripe_events (event_type);
create index if not exists stripe_events_payload_gin_idx on public.stripe_events using gin (payload);

alter table public.stripe_events enable row level security;

drop policy if exists "stripe_events_no_client_access" on public.stripe_events;
create policy "stripe_events_no_client_access"
on public.stripe_events
for all
to anon, authenticated
using (false)
with check (false);
