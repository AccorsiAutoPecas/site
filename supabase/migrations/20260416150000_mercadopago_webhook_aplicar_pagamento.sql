-- Webhook Mercado Pago: aplica status do pagamento com baixa de estoque idempotente (apenas em "approved").

create or replace function public.mercadopago_aplicar_estado_pagamento(
  p_pedido_id uuid,
  p_mp_payment_id text,
  p_mp_status text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_temp, public
as $$
declare
  v_pedido public.pedidos%rowtype;
  r_item record;
  v_updated int;
begin
  if p_pedido_id is null then
    return jsonb_build_object('ok', false, 'error', 'pedido_id_invalido');
  end if;

  if p_mp_payment_id is null or btrim(p_mp_payment_id) = '' then
    return jsonb_build_object('ok', false, 'error', 'payment_id_invalido');
  end if;

  if p_mp_status is null or btrim(p_mp_status) = '' then
    return jsonb_build_object('ok', false, 'error', 'status_invalido');
  end if;

  select *
    into v_pedido
  from public.pedidos
  where id = p_pedido_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'pedido_nao_encontrado');
  end if;

  -- Pagamento aprovado repetido (idempotência)
  if v_pedido.status = 'pago'::public.pedido_status
     and p_mp_status = 'approved'
     and v_pedido.mercadopago_payment_id is not distinct from p_mp_payment_id
  then
    return jsonb_build_object('ok', true, 'action', 'noop');
  end if;

  -- Já pago com outro id de pagamento: não altera nem estorna automaticamente
  if v_pedido.status = 'pago'::public.pedido_status and p_mp_status = 'approved' then
    return jsonb_build_object('ok', true, 'action', 'noop', 'reason', 'already_paid');
  end if;

  if v_pedido.status = 'pago'::public.pedido_status
     and p_mp_status in ('refunded', 'charged_back')
  then
    update public.pedidos
    set
      status = 'reembolsado'::public.pedido_status,
      mercadopago_status = p_mp_status,
      mercadopago_payment_id = coalesce(nullif(btrim(p_mp_payment_id), ''), mercadopago_payment_id)
    where id = p_pedido_id;

    return jsonb_build_object('ok', true, 'action', 'refunded');
  end if;

  if v_pedido.status = 'pago'::public.pedido_status then
    update public.pedidos
    set
      mercadopago_status = p_mp_status,
      mercadopago_payment_id = coalesce(nullif(btrim(p_mp_payment_id), ''), mercadopago_payment_id)
    where id = p_pedido_id;

    return jsonb_build_object('ok', true, 'action', 'noop');
  end if;

  if p_mp_status = 'approved' then
    if v_pedido.status not in ('aguardando_pagamento'::public.pedido_status, 'rascunho'::public.pedido_status) then
      update public.pedidos
      set
        mercadopago_payment_id = coalesce(nullif(btrim(p_mp_payment_id), ''), mercadopago_payment_id),
        mercadopago_status = p_mp_status
      where id = p_pedido_id;

      return jsonb_build_object('ok', true, 'action', 'skipped');
    end if;

    for r_item in
      select produto_id, quantidade
      from public.pedido_itens
      where pedido_id = p_pedido_id
    loop
      update public.produtos p
      set quantidade_estoque = p.quantidade_estoque - r_item.quantidade
      where p.id = r_item.produto_id
        and p.quantidade_estoque >= r_item.quantidade;

      get diagnostics v_updated = row_count;

      if v_updated <> 1 then
        return jsonb_build_object(
          'ok', false,
          'error', 'estoque_insuficiente',
          'produto_id', r_item.produto_id::text
        );
      end if;
    end loop;

    update public.pedidos
    set
      status = 'pago'::public.pedido_status,
      mercadopago_payment_id = nullif(btrim(p_mp_payment_id), ''),
      mercadopago_status = p_mp_status
    where id = p_pedido_id;

    return jsonb_build_object('ok', true, 'action', 'paid');
  end if;

  if v_pedido.status in ('aguardando_pagamento'::public.pedido_status, 'rascunho'::public.pedido_status) then
    if p_mp_status in ('rejected', 'cancelled') then
      update public.pedidos
      set
        mercadopago_payment_id = coalesce(nullif(btrim(p_mp_payment_id), ''), mercadopago_payment_id),
        mercadopago_status = p_mp_status,
        status = 'falha_pagamento'::public.pedido_status
      where id = p_pedido_id;

      return jsonb_build_object('ok', true, 'action', 'failed');
    end if;

    if p_mp_status in ('pending', 'in_process', 'authorized', 'in_mediation') then
      update public.pedidos
      set
        mercadopago_payment_id = coalesce(nullif(btrim(p_mp_payment_id), ''), mercadopago_payment_id),
        mercadopago_status = p_mp_status
      where id = p_pedido_id;

      return jsonb_build_object('ok', true, 'action', 'pending');
    end if;
  end if;

  update public.pedidos
  set
    mercadopago_payment_id = coalesce(nullif(btrim(p_mp_payment_id), ''), mercadopago_payment_id),
    mercadopago_status = p_mp_status
  where id = p_pedido_id;

  return jsonb_build_object('ok', true, 'action', 'updated');
end;
$$;

comment on function public.mercadopago_aplicar_estado_pagamento is
  'Aplica notificação de pagamento MP: baixa estoque só em approved e aguardando_pagamento; idempotente para o mesmo payment_id.';

revoke all on function public.mercadopago_aplicar_estado_pagamento(uuid, text, text) from public;

grant execute on function public.mercadopago_aplicar_estado_pagamento(uuid, text, text) to service_role;
