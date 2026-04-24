-- Permite ao painel admin atualizar `retirada_loja` via `admin_atualizar_pedido_logistica`.

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
      'logistica_status',
      'retirada_loja'
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

  if v_patch ? 'retirada_loja' then
    if jsonb_typeof(v_patch->'retirada_loja') not in ('null', 'boolean') then
      return jsonb_build_object('ok', false, 'error', 'retirada_loja_invalida');
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
    end,
    retirada_loja = case
      when v_patch ? 'retirada_loja' then
        case
          when jsonb_typeof(v_patch->'retirada_loja') = 'null' then retirada_loja
          when (v_patch->'retirada_loja') = 'true'::jsonb then true
          when (v_patch->'retirada_loja') = 'false'::jsonb then false
          else retirada_loja
        end
      else retirada_loja
    end
  where id = p_pedido_id;

  return jsonb_build_object('ok', true);
exception
  when invalid_text_representation then
    return jsonb_build_object('ok', false, 'error', 'logistica_status_invalido');
end;
$$;

comment on function public.admin_atualizar_pedido_logistica(uuid, jsonb) is
  'Atualiza logística/frete e flag retirada_loja em pedidos (painel admin).';
