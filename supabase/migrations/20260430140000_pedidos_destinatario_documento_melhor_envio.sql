-- CPF/CNPJ do destinatário (Melhor Envio / declaração) + admin + checkout.

alter table public.pedidos
  add column if not exists destinatario_documento text;

comment on column public.pedidos.destinatario_documento is
  'CPF ou CNPJ do destinatário (somente dígitos recomendado) para integração Melhor Envio.';

-- admin_atualizar_pedido_logistica: permite atualizar destinatario_documento
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
      'retirada_loja',
      'destinatario_documento'
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
    end,
    destinatario_documento = case
      when v_patch ? 'destinatario_documento' then
        case
          when jsonb_typeof(v_patch->'destinatario_documento') = 'null' then null
          else nullif(btrim(v_patch->>'destinatario_documento'), '')
        end
      else destinatario_documento
    end
  where id = p_pedido_id;

  return jsonb_build_object('ok', true);
exception
  when invalid_text_representation then
    return jsonb_build_object('ok', false, 'error', 'logistica_status_invalido');
end;
$$;

comment on function public.admin_atualizar_pedido_logistica(uuid, jsonb) is
  'Atualiza logística/frete, retirada_loja e destinatario_documento em pedidos (painel admin).';

-- criar_pedido_checkout: parâmetro opcional p_destinatario_documento
drop function if exists public.criar_pedido_checkout(
  jsonb,
  numeric,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  boolean
);

create or replace function public.criar_pedido_checkout(
  p_itens jsonb,
  p_frete numeric,
  p_destinatario_nome text,
  p_telefone text,
  p_cep text,
  p_logradouro text,
  p_numero text,
  p_complemento text,
  p_bairro text,
  p_cidade text,
  p_uf text,
  p_forma_pagamento text,
  p_destinatario_documento text default null,
  p_retirada_loja boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = pg_temp, public
as $$
declare
  v_uid uuid;
  v_pedido_id uuid;
  v_subtotal numeric(12, 2);
  v_frete numeric(12, 2);
  v_total numeric(12, 2);
  v_forma text;
  v_retirada boolean;
  r_item record;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Sessão obrigatória para criar pedido.';
  end if;

  if p_itens is null or jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Informe ao menos um item no pedido.';
  end if;

  v_retirada := coalesce(p_retirada_loja, false);
  if v_retirada then
    v_frete := 0;
  else
    v_frete := coalesce(p_frete, 0);
  end if;

  if v_frete < 0 then
    raise exception 'Frete inválido.';
  end if;

  v_forma := lower(btrim(coalesce(p_forma_pagamento, '')));
  if v_forma not in ('pix', 'cartao') then
    v_forma := 'cartao';
  end if;

  if nullif(btrim(p_destinatario_nome), '') is null
     or nullif(btrim(p_telefone), '') is null
     or nullif(btrim(p_cep), '') is null
     or nullif(btrim(p_logradouro), '') is null
     or nullif(btrim(p_numero), '') is null
     or nullif(btrim(p_bairro), '') is null
     or nullif(btrim(p_cidade), '') is null
     or nullif(btrim(p_uf), '') is null
  then
    raise exception 'Preencha todos os dados obrigatórios de entrega.';
  end if;

  create temporary table tmp_pedido_linhas (
    produto_id uuid not null primary key,
    quantidade int not null check (quantidade > 0)
  ) on commit drop;

  for r_item in
    select e.elem as el
    from jsonb_array_elements(p_itens) as e(elem)
  loop
    declare
      v_pid uuid;
      v_q int;
    begin
      if jsonb_typeof(r_item.el) <> 'object' then
        raise exception 'Formato inválido dos itens do pedido.';
      end if;
      v_pid := nullif(btrim(r_item.el->>'produto_id'), '')::uuid;
      if v_pid is null then
        raise exception 'Cada item deve ter produto_id válido.';
      end if;
      begin
        v_q := (r_item.el->>'quantidade')::int;
      exception
        when others then
          raise exception 'Quantidade inválida para o produto %.', v_pid;
      end;
      if v_q is null or v_q <= 0 then
        raise exception 'Quantidade deve ser maior que zero.';
      end if;

      insert into tmp_pedido_linhas (produto_id, quantidade)
      values (v_pid, v_q)
      on conflict (produto_id) do update
        set quantidade = tmp_pedido_linhas.quantidade + excluded.quantidade;
    end;
  end loop;

  perform 1
  from public.produtos p
  inner join tmp_pedido_linhas l on l.produto_id = p.id
  order by p.id
  for update;

  select round(coalesce(sum(
    round(
      p.valor::numeric * (1 - (
        case v_forma
          when 'pix' then least(coalesce(p.desconto_pix_percent, 0), 100) / 100.0
          else least(coalesce(p.desconto_cartao_percent, 0), 100) / 100.0
        end
      )),
      2
    ) * l.quantidade
  ), 0), 2)::numeric(12, 2)
    into v_subtotal
  from tmp_pedido_linhas l
  inner join public.produtos p on p.id = l.produto_id;

  if exists (
    select 1
    from tmp_pedido_linhas l
    left join public.produtos p on p.id = l.produto_id
    where p.id is null
  ) then
    raise exception 'Um ou mais produtos não foram encontrados.';
  end if;

  if exists (
    select 1
    from tmp_pedido_linhas l
    inner join public.produtos p on p.id = l.produto_id
    where p.quantidade_estoque < l.quantidade
  ) then
    raise exception 'Estoque insuficiente para um ou mais itens.';
  end if;

  v_total := round(v_subtotal + v_frete, 2)::numeric(12, 2);

  insert into public.pedidos (
    user_id,
    status,
    subtotal,
    frete,
    total,
    destinatario_nome,
    telefone,
    cep,
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    uf,
    retirada_loja,
    destinatario_documento
  )
  values (
    v_uid,
    'aguardando_pagamento',
    v_subtotal,
    v_frete,
    v_total,
    btrim(p_destinatario_nome),
    btrim(p_telefone),
    btrim(p_cep),
    btrim(p_logradouro),
    btrim(p_numero),
    nullif(btrim(p_complemento), ''),
    btrim(p_bairro),
    btrim(p_cidade),
    upper(btrim(p_uf)),
    v_retirada,
    nullif(btrim(p_destinatario_documento), '')
  )
  returning id into v_pedido_id;

  insert into public.pedido_itens (
    pedido_id,
    produto_id,
    quantidade,
    preco_unitario,
    titulo_snapshot,
    cod_produto_snapshot
  )
  select
    v_pedido_id,
    l.produto_id,
    l.quantidade,
    round(
      p.valor::numeric * (1 - (
        case v_forma
          when 'pix' then least(coalesce(p.desconto_pix_percent, 0), 100) / 100.0
          else least(coalesce(p.desconto_cartao_percent, 0), 100) / 100.0
        end
      )),
      2
    )::numeric(12, 2),
    p.titulo,
    p.cod_produto
  from tmp_pedido_linhas l
  inner join public.produtos p on p.id = l.produto_id;

  return v_pedido_id;
end;
$$;

comment on function public.criar_pedido_checkout is
  'Cria pedido + itens: desconto PIX/cartão; retirada na loja; documento do destinatário opcional (Melhor Envio).';

revoke all on function public.criar_pedido_checkout(
  jsonb,
  numeric,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  boolean
) from public;

grant execute on function public.criar_pedido_checkout(
  jsonb,
  numeric,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  boolean
) to authenticated, service_role;
