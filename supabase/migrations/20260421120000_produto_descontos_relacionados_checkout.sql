-- Descontos por forma de pagamento (PIX / cartão), produtos relacionados manuais,
-- e cálculo de preço na RPC de checkout.

alter table public.produtos
  add column if not exists desconto_pix_percent numeric(5, 2) not null default 0
    check (desconto_pix_percent >= 0 and desconto_pix_percent <= 100),
  add column if not exists desconto_cartao_percent numeric(5, 2) not null default 0
    check (desconto_cartao_percent >= 0 and desconto_cartao_percent <= 100);

comment on column public.produtos.desconto_pix_percent is
  'Percentual de desconto sobre o valor base ao finalizar com PIX (Mercado Pago).';
comment on column public.produtos.desconto_cartao_percent is
  'Percentual de desconto sobre o valor base ao finalizar com cartão no Mercado Pago (geralmente 0).';

create table if not exists public.produto_relacionados (
  produto_id uuid not null references public.produtos (id) on delete cascade,
  relacionado_id uuid not null references public.produtos (id) on delete cascade,
  primary key (produto_id, relacionado_id),
  constraint produto_relacionados_distinct check (produto_id <> relacionado_id)
);

create index if not exists produto_relacionados_relacionado_id_idx
  on public.produto_relacionados (relacionado_id);

comment on table public.produto_relacionados is
  'Vínculos manuais de produtos relacionados na vitrine; complementados por compatibilidade de modelo quando vazio.';

alter table public.produto_relacionados enable row level security;

create policy "produto_relacionados_select" on public.produto_relacionados for select using (true);
create policy "produto_relacionados_insert" on public.produto_relacionados for insert with check (true);
create policy "produto_relacionados_delete" on public.produto_relacionados for delete using (true);

-- Substitui a função: novo parâmetro p_forma_pagamento ('pix' | 'cartao').
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
  text
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
  p_forma_pagamento text
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
  r_item record;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Sessão obrigatória para criar pedido.';
  end if;

  if p_itens is null or jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Informe ao menos um item no pedido.';
  end if;

  v_frete := coalesce(p_frete, 0);
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
    uf
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
    upper(btrim(p_uf))
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
  'Cria pedido + itens: aplica desconto_pix_percent ou desconto_cartao_percent conforme p_forma_pagamento.';

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
  text
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
  text
) to authenticated, service_role;
