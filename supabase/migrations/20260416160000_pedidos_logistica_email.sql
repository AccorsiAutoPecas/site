-- Logística (rastreio, Melhor Envio), origem do frete e idempotência de e-mails transacionais.
-- Atualização operacional: RPC security definer (service_role) ou cliente admin; sem UPDATE amplo em RLS para authenticated.

create type public.pedido_logistica_status as enum (
  'nao_iniciado',
  'em_separacao',
  'postado',
  'entregue'
);

comment on type public.pedido_logistica_status is
  'Estado operacional de envio, separado de pedido_status (pagamento).';

alter table public.pedidos
  add column if not exists rastreio_codigo text,
  add column if not exists rastreio_url text,
  add column if not exists transportadora_nome text,
  add column if not exists melhor_envio_id text,
  add column if not exists melhor_envio_etiqueta_url text,
  add column if not exists frete_provedor text,
  add column if not exists email_pedido_criado_at timestamptz,
  add column if not exists email_pagamento_confirmado_at timestamptz,
  add column if not exists email_enviado_at timestamptz,
  add column if not exists logistica_status public.pedido_logistica_status not null default 'nao_iniciado';

comment on column public.pedidos.rastreio_codigo is 'Código de rastreamento exibido ao cliente / integração Melhor Envio.';
comment on column public.pedidos.rastreio_url is 'Link da transportadora (opcional).';
comment on column public.pedidos.transportadora_nome is 'Nome amigável da transportadora (Correios, Jadlog, etc.).';
comment on column public.pedidos.melhor_envio_id is 'Identificador principal retornado pela API Melhor Envio (alinhado à doc na integração).';
comment on column public.pedidos.melhor_envio_etiqueta_url is 'URL da etiqueta (PDF/ZPL) quando a API expuser.';
comment on column public.pedidos.frete_provedor is 'Origem do valor de frete: fixo, melhor_envio, manual, etc.';
comment on column public.pedidos.email_pedido_criado_at is 'Idempotência: e-mail “pedido criado” já disparado.';
comment on column public.pedidos.email_pagamento_confirmado_at is 'Idempotência: e-mail pós-pagamento aprovado.';
comment on column public.pedidos.email_enviado_at is 'Idempotência: e-mail de envio/rastreio.';

alter table public.pedidos
  add constraint pedidos_frete_provedor_valores check (
    frete_provedor is null
    or frete_provedor in ('fixo', 'melhor_envio', 'manual')
  );

grant usage on type public.pedido_logistica_status to authenticated, service_role;

-- Atualiza campos de logística / frete_provedor via patch JSON (apenas chaves listadas).
-- Chaves ausentes mantêm o valor atual; JSON null em uma chave grava NULL na coluna.
create or replace function public.admin_atualizar_pedido_logistica(
  p_pedido_id uuid,
  p_patch jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_temp, public
as $$
declare
  v_patch jsonb := coalesce(p_patch, '{}'::jsonb);
  v_ls text;
begin
  if p_pedido_id is null then
    return jsonb_build_object('ok', false, 'error', 'pedido_id_obrigatorio');
  end if;

  if not exists (select 1 from public.pedidos where id = p_pedido_id) then
    return jsonb_build_object('ok', false, 'error', 'pedido_nao_encontrado');
  end if;

  if exists (
    select 1
    from jsonb_object_keys(v_patch) as patchkeys (patch_key)
    where patchkeys.patch_key not in (
      'rastreio_codigo',
      'rastreio_url',
      'transportadora_nome',
      'melhor_envio_id',
      'melhor_envio_etiqueta_url',
      'frete_provedor',
      'logistica_status'
    )
  ) then
    return jsonb_build_object('ok', false, 'error', 'patch_chave_invalida');
  end if;

  if v_patch ? 'logistica_status' then
    if jsonb_typeof(v_patch->'logistica_status') not in ('null', 'string') then
      return jsonb_build_object('ok', false, 'error', 'logistica_status_invalido');
    end if;
    if jsonb_typeof(v_patch->'logistica_status') = 'string' then
      v_ls := nullif(btrim(v_patch->>'logistica_status'), '');
      if v_ls is not null and v_ls not in (
        'nao_iniciado',
        'em_separacao',
        'postado',
        'entregue'
      ) then
        return jsonb_build_object('ok', false, 'error', 'logistica_status_invalido');
      end if;
    end if;
  end if;

  if v_patch ? 'frete_provedor' then
    if jsonb_typeof(v_patch->'frete_provedor') not in ('null', 'string') then
      return jsonb_build_object('ok', false, 'error', 'frete_provedor_invalido');
    end if;
    if jsonb_typeof(v_patch->'frete_provedor') = 'string'
      and nullif(btrim(v_patch->>'frete_provedor'), '') is not null
      and btrim(v_patch->>'frete_provedor') not in ('fixo', 'melhor_envio', 'manual')
    then
      return jsonb_build_object('ok', false, 'error', 'frete_provedor_invalido');
    end if;
  end if;

  update public.pedidos
  set
    rastreio_codigo = case
      when v_patch ? 'rastreio_codigo' then
        case
          when jsonb_typeof(v_patch->'rastreio_codigo') = 'null' then null
          else nullif(btrim(v_patch->>'rastreio_codigo'), '')
        end
      else rastreio_codigo
    end,
    rastreio_url = case
      when v_patch ? 'rastreio_url' then
        case
          when jsonb_typeof(v_patch->'rastreio_url') = 'null' then null
          else nullif(btrim(v_patch->>'rastreio_url'), '')
        end
      else rastreio_url
    end,
    transportadora_nome = case
      when v_patch ? 'transportadora_nome' then
        case
          when jsonb_typeof(v_patch->'transportadora_nome') = 'null' then null
          else nullif(btrim(v_patch->>'transportadora_nome'), '')
        end
      else transportadora_nome
    end,
    melhor_envio_id = case
      when v_patch ? 'melhor_envio_id' then
        case
          when jsonb_typeof(v_patch->'melhor_envio_id') = 'null' then null
          else nullif(btrim(v_patch->>'melhor_envio_id'), '')
        end
      else melhor_envio_id
    end,
    melhor_envio_etiqueta_url = case
      when v_patch ? 'melhor_envio_etiqueta_url' then
        case
          when jsonb_typeof(v_patch->'melhor_envio_etiqueta_url') = 'null' then null
          else nullif(btrim(v_patch->>'melhor_envio_etiqueta_url'), '')
        end
      else melhor_envio_etiqueta_url
    end,
    frete_provedor = case
      when v_patch ? 'frete_provedor' then
        case
          when jsonb_typeof(v_patch->'frete_provedor') = 'null' then null
          else nullif(btrim(v_patch->>'frete_provedor'), '')
        end
      else frete_provedor
    end,
    logistica_status = case
      when v_patch ? 'logistica_status' then
        case
          when jsonb_typeof(v_patch->'logistica_status') = 'null' then logistica_status
          when nullif(btrim(v_patch->>'logistica_status'), '') is null then logistica_status
          else (nullif(btrim(v_patch->>'logistica_status'), ''))::public.pedido_logistica_status
        end
      else logistica_status
    end
  where id = p_pedido_id;

  return jsonb_build_object('ok', true);
exception
  when invalid_text_representation then
    return jsonb_build_object('ok', false, 'error', 'logistica_status_invalido');
end;
$$;

comment on function public.admin_atualizar_pedido_logistica(uuid, jsonb) is
  'Atualiza apenas colunas de logística/frete em pedidos. Uso pelo painel via service_role; authenticated não recebe UPDATE direto na tabela.';

revoke all on function public.admin_atualizar_pedido_logistica(uuid, jsonb) from public;

grant execute on function public.admin_atualizar_pedido_logistica(uuid, jsonb) to service_role;

-- Marca idempotência de e-mail (primeiro disparo grava o instante; chamadas seguintes não alteram).
create or replace function public.admin_pedido_marcar_email_disparado(
  p_pedido_id uuid,
  p_tipo text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_temp, public
as $$
declare
  v_tipo text := nullif(btrim(p_tipo), '');
begin
  if p_pedido_id is null or v_tipo is null then
    return jsonb_build_object('ok', false, 'error', 'parametros_invalidos');
  end if;

  if v_tipo not in ('pedido_criado', 'pagamento_confirmado', 'enviado') then
    return jsonb_build_object('ok', false, 'error', 'tipo_invalido');
  end if;

  if not exists (select 1 from public.pedidos where id = p_pedido_id) then
    return jsonb_build_object('ok', false, 'error', 'pedido_nao_encontrado');
  end if;

  if v_tipo = 'pedido_criado' then
    update public.pedidos
    set email_pedido_criado_at = coalesce(email_pedido_criado_at, now())
    where id = p_pedido_id;
  elsif v_tipo = 'pagamento_confirmado' then
    update public.pedidos
    set email_pagamento_confirmado_at = coalesce(email_pagamento_confirmado_at, now())
    where id = p_pedido_id;
  else
    update public.pedidos
    set email_enviado_at = coalesce(email_enviado_at, now())
    where id = p_pedido_id;
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

comment on function public.admin_pedido_marcar_email_disparado(uuid, text) is
  'Grava timestamps de idempotência de e-mail (só na primeira vez). Chamadas do backend com service_role.';

revoke all on function public.admin_pedido_marcar_email_disparado(uuid, text) from public;

grant execute on function public.admin_pedido_marcar_email_disparado(uuid, text) to service_role;
