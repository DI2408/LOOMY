-- LOOMY — Cart checkout: one order, multiple line items, one payment row
-- Run after loomy_checkout_payments.sql (requires payments insert pattern + progress_order_store payment gate).
--
-- p_items: JSON array of { "store_id", "product_id", "size", "qty" } — all rows must share the same store_id.

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
  v_total int := 0;
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

  -- First pass: validate + compute total
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

    v_total := v_total + v_product.price_minor * v_qty;
  end loop;

  -- Second pass: decrement inventory
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
    jsonb_build_object('source', 'place_loomy_cart_order')
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
