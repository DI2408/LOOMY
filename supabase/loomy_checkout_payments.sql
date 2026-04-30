-- LOOMY — Checkout + payment gating (run after loomy_orders_rpc.sql)
-- 1) payments.stripe_checkout_session_id for Stripe Checkout
-- 2) place_loomy_order inserts a payments row (requires_payment)
-- 3) progress_order_store: first step (order_placed → store_packing) requires payment succeeded

alter table public.payments
  add column if not exists stripe_checkout_session_id text;

create unique index if not exists payments_stripe_checkout_session_id_key
  on public.payments (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

-- ----------------------------------------------------------------------------
-- place_loomy_order: same as before + insert payments row
-- ----------------------------------------------------------------------------
create or replace function public.place_loomy_order(
  p_store_id text,
  p_product_id text,
  p_size text,
  p_delivery_address text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_customer_name text;
  v_product record;
  v_updated int;
  v_courier_id text;
  v_order_id text;
  v_seq bigint;
  v_eta int;
  v_store record;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if p_delivery_address is null or length(trim(p_delivery_address)) < 8 then
    raise exception 'invalid_address' using errcode = '22023';
  end if;

  if p_size not in ('XS', 'S', 'M', 'L') then
    raise exception 'invalid_size' using errcode = '22023';
  end if;

  select coalesce(cp.full_name, split_part(u.email, '@', 1), 'LOOMY kunde')
  into v_customer_name
  from auth.users u
  left join public.customer_profiles cp on cp.user_id = u.id
  where u.id = v_uid
  limit 1;

  select pr.id, pr.name, pr.store_id, pr.price_minor
  into v_product
  from public.products pr
  where pr.id = p_product_id
    and pr.store_id = p_store_id
    and pr.is_active = true;

  if v_product.id is null then
    raise exception 'product_not_found' using errcode = '22023';
  end if;

  select s.id, s.name, s.address, s.eta_minutes
  into v_store
  from public.stores s
  where s.id = p_store_id and s.is_active = true;

  if v_store.id is null then
    raise exception 'store_not_found' using errcode = '22023';
  end if;

  update public.product_inventory pi
  set qty = pi.qty - 1, updated_at = now()
  where pi.product_id = p_product_id
    and pi.size = p_size
    and pi.qty > 0
  returning 1 into v_updated;

  if v_updated is null then
    raise exception 'out_of_stock' using errcode = '22000';
  end if;

  select c.id into v_courier_id
  from public.couriers c
  where c.status = 'available'
  order by random()
  limit 1;

  v_seq := nextval('public.loomy_order_number_seq');
  v_order_id := 'LOO-' || lpad(v_seq::text, 9, '0');
  v_eta := v_store.eta_minutes + floor(random() * 12)::int;

  insert into public.orders (
    id,
    customer_user_id,
    store_id,
    courier_id,
    status,
    delivery_address,
    eta_minutes,
    currency,
    total_minor,
    customer_display_name
  ) values (
    v_order_id,
    v_uid,
    p_store_id,
    v_courier_id,
    'order_placed',
    trim(p_delivery_address),
    v_eta,
    'DKK',
    v_product.price_minor,
    v_customer_name
  );

  insert into public.order_items (
    order_id,
    product_id,
    product_name,
    size,
    qty,
    unit_price_minor
  ) values (
    v_order_id,
    p_product_id,
    v_product.name,
    p_size,
    1,
    v_product.price_minor
  );

  insert into public.payments (
    order_id,
    amount_minor,
    currency,
    status,
    metadata
  ) values (
    v_order_id,
    v_product.price_minor,
    'DKK',
    'requires_payment',
    jsonb_build_object('source', 'place_loomy_order')
  );

  if v_courier_id is not null then
    update public.couriers
    set status = 'on_delivery', updated_at = now()
    where id = v_courier_id;
  end if;

  return jsonb_build_object(
    'id', v_order_id,
    'storeId', p_store_id,
    'storeName', v_store.name,
    'storeAddress', v_store.address,
    'productId', p_product_id,
    'productName', v_product.name,
    'size', p_size,
    'qty', 1,
    'customerName', v_customer_name,
    'customerAddress', trim(p_delivery_address),
    'nearbyEtaMinutes', v_eta,
    'courierId', v_courier_id,
    'status', 'order_placed',
    'createdAt', (extract(epoch from now()) * 1000)::bigint
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- progress_order_store: require succeeded payment before packing starts
-- ----------------------------------------------------------------------------
create or replace function public.progress_order_store(p_order_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store text := public.loomy_partner_store_id();
  o record;
  v_pick_courier text;
  v_pay_status public.loomy_payment_status;
begin
  if v_store is null then
    raise exception 'not_store_partner' using errcode = '28000';
  end if;

  select * into o from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order_not_found' using errcode = '22023';
  end if;
  if o.store_id <> v_store then
    raise exception 'forbidden' using errcode = '28000';
  end if;

  if o.status = 'order_placed' then
    select p.status into v_pay_status
    from public.payments p
    where p.order_id = p_order_id
    limit 1;
    if v_pay_status is distinct from 'succeeded' then
      raise exception 'payment_required' using errcode = '28000';
    end if;
    update public.orders set status = 'store_packing' where id = p_order_id;
  elsif o.status = 'store_packing' then
    if o.courier_id is null then
      select c.id into v_pick_courier
      from public.couriers c
      where c.status = 'available'
      order by random()
      limit 1;
      if v_pick_courier is not null then
        update public.couriers set status = 'on_delivery', updated_at = now() where id = v_pick_courier;
        update public.orders set courier_id = v_pick_courier where id = p_order_id;
      end if;
    else
      update public.couriers set status = 'on_delivery', updated_at = now() where id = o.courier_id;
    end if;
    update public.orders set status = 'courier_pickup' where id = p_order_id;
  else
    raise exception 'invalid_status_transition' using errcode = '22000';
  end if;

  return jsonb_build_object('ok', true, 'orderId', p_order_id);
end;
$$;
