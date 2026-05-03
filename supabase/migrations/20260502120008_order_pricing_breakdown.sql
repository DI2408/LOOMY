-- LOOMY: order line subtotal, delivery fee, VAT breakdown (DK display), total = subtotal + delivery
-- Run after existing migrations. Safe to re-run (IF NOT EXISTS / CREATE OR REPLACE).

alter table public.orders
  add column if not exists subtotal_minor int,
  add column if not exists delivery_fee_minor int not null default 4900,
  add column if not exists vat_included_minor int;

-- Backfill for old rows: assume total was subtotal only, delivery 49 kr, recompute vat slice
update public.orders
set
  delivery_fee_minor = coalesce(delivery_fee_minor, 4900),
  subtotal_minor = case
    when subtotal_minor is null and total_minor is not null then greatest(0, total_minor - 4900)
    else subtotal_minor
  end
where subtotal_minor is null or delivery_fee_minor is null;

update public.orders
set vat_included_minor = floor((coalesce(subtotal_minor, 0) + coalesce(delivery_fee_minor, 4900)) * 25 / 125)
where vat_included_minor is null
  and (subtotal_minor is not null or total_minor is not null);

-- ----------------------------------------------------------------------------
-- place_loomy_cart_order (with pricing breakdown)
-- ----------------------------------------------------------------------------
create or replace function public.place_loomy_cart_order(
  p_items jsonb,
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
  v_store_id text;
  v_store record;
  v_courier_id text;
  v_order_id text;
  v_seq bigint;
  v_eta int;
  v_subtotal int := 0;
  v_delivery int := 4900;
  v_total int;
  v_vat int;
  el jsonb;
  v_product record;
  v_updated int;
  v_qty int;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if p_delivery_address is null or length(trim(p_delivery_address)) < 8 then
    raise exception 'invalid_address' using errcode = '22023';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 then
    raise exception 'empty_cart' using errcode = '22023';
  end if;

  select coalesce(cp.full_name, split_part(u.email, '@', 1), 'LOOMY kunde')
  into v_customer_name
  from auth.users u
  left join public.customer_profiles cp on cp.user_id = u.id
  where u.id = v_uid
  limit 1;

  v_store_id := trim((p_items -> 0 ->> 'store_id'));
  if v_store_id is null or v_store_id = '' then
    raise exception 'invalid_cart' using errcode = '22023';
  end if;

  for el in select * from jsonb_array_elements(p_items)
  loop
    if trim(el ->> 'store_id') is distinct from v_store_id then
      raise exception 'multi_store_cart' using errcode = '22023';
    end if;
  end loop;

  select s.id, s.name, s.address, s.eta_minutes
  into v_store
  from public.stores s
  where s.id = v_store_id and s.is_active = true;

  if v_store.id is null then
    raise exception 'store_not_found' using errcode = '22023';
  end if;

  for el in select * from jsonb_array_elements(p_items)
  loop
    v_qty := greatest(1, coalesce((el ->> 'qty')::int, 1));
    if (el ->> 'size') not in ('XS', 'S', 'M', 'L') then
      raise exception 'invalid_size' using errcode = '22023';
    end if;

    select pr.id, pr.name, pr.price_minor
    into v_product
    from public.products pr
    where pr.id = trim(el ->> 'product_id')
      and pr.store_id = v_store_id
      and pr.is_active = true;

    if v_product.id is null then
      raise exception 'product_not_found' using errcode = '22023';
    end if;

    v_subtotal := v_subtotal + v_product.price_minor * v_qty;
  end loop;

  v_total := v_subtotal + v_delivery;
  v_vat := floor(v_total * 25 / 125);

  for el in select * from jsonb_array_elements(p_items)
  loop
    v_qty := greatest(1, coalesce((el ->> 'qty')::int, 1));
    update public.product_inventory pi
    set qty = pi.qty - v_qty, updated_at = now()
    where pi.product_id = trim(el ->> 'product_id')
      and pi.size = trim(el ->> 'size')
      and pi.qty >= v_qty
    returning 1 into v_updated;

    if v_updated is null then
      raise exception 'out_of_stock' using errcode = '22000';
    end if;
  end loop;

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
    subtotal_minor,
    delivery_fee_minor,
    vat_included_minor,
    customer_display_name
  ) values (
    v_order_id,
    v_uid,
    v_store_id,
    v_courier_id,
    'order_placed',
    trim(p_delivery_address),
    v_eta,
    'DKK',
    v_total,
    v_subtotal,
    v_delivery,
    v_vat,
    v_customer_name
  );

  for el in select * from jsonb_array_elements(p_items)
  loop
    v_qty := greatest(1, coalesce((el ->> 'qty')::int, 1));
    select pr.name, pr.price_minor
    into v_product
    from public.products pr
    where pr.id = trim(el ->> 'product_id')
      and pr.store_id = v_store_id;

    insert into public.order_items (
      order_id,
      product_id,
      product_name,
      size,
      qty,
      unit_price_minor
    ) values (
      v_order_id,
      trim(el ->> 'product_id'),
      v_product.name,
      trim(el ->> 'size'),
      v_qty,
      v_product.price_minor
    );
  end loop;

  insert into public.payments (
    order_id,
    amount_minor,
    currency,
    status,
    metadata
  ) values (
    v_order_id,
    v_total,
    'DKK',
    'requires_payment',
    jsonb_build_object(
      'source', 'place_loomy_cart_order',
      'subtotal_minor', v_subtotal,
      'delivery_fee_minor', v_delivery,
      'vat_included_minor', v_vat
    )
  );

  if v_courier_id is not null then
    update public.couriers
    set status = 'on_delivery', updated_at = now()
    where id = v_courier_id;
  end if;

  return jsonb_build_object(
    'id', v_order_id,
    'storeId', v_store_id,
    'storeName', v_store.name,
    'storeAddress', v_store.address,
    'subtotalMinor', v_subtotal,
    'deliveryFeeMinor', v_delivery,
    'vatIncludedMinor', v_vat,
    'totalMinor', v_total,
    'customerName', v_customer_name,
    'customerAddress', trim(p_delivery_address),
    'nearbyEtaMinutes', v_eta,
    'courierId', v_courier_id,
    'status', 'order_placed',
    'createdAt', (extract(epoch from now()) * 1000)::bigint
  );
end;
$$;

revoke all on function public.place_loomy_cart_order(jsonb, text) from public;
grant execute on function public.place_loomy_cart_order(jsonb, text) to authenticated;

-- ----------------------------------------------------------------------------
-- place_loomy_order (single item + payments row) — same pricing rules
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
  v_subtotal int;
  v_delivery int := 4900;
  v_total int;
  v_vat int;
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

  v_subtotal := v_product.price_minor;
  v_total := v_subtotal + v_delivery;
  v_vat := floor(v_total * 25 / 125);

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
    subtotal_minor,
    delivery_fee_minor,
    vat_included_minor,
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
    v_total,
    v_subtotal,
    v_delivery,
    v_vat,
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
    v_total,
    'DKK',
    'requires_payment',
    jsonb_build_object(
      'source', 'place_loomy_order',
      'subtotal_minor', v_subtotal,
      'delivery_fee_minor', v_delivery,
      'vat_included_minor', v_vat
    )
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
    'subtotalMinor', v_subtotal,
    'deliveryFeeMinor', v_delivery,
    'vatIncludedMinor', v_vat,
    'totalMinor', v_total,
    'customerName', v_customer_name,
    'customerAddress', trim(p_delivery_address),
    'nearbyEtaMinutes', v_eta,
    'courierId', v_courier_id,
    'status', 'order_placed',
    'createdAt', (extract(epoch from now()) * 1000)::bigint
  );
end;
$$;

revoke all on function public.place_loomy_order(text, text, text, text) from public;
grant execute on function public.place_loomy_order(text, text, text, text) to authenticated;
