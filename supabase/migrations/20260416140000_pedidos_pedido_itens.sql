-- Pedidos de checkout: tabelas, índices, RLS e RPC transacional com validação de estoque.

create type public.pedido_status as enum (
  'rascunho',
  'aguardando_pagamento',
  'pago',
  'cancelado',
  'reembolsado',
  'falha_pagamento'
);

create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete restrict,
  status public.pedido_status not null default 'aguardando_pagamento',
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  frete numeric(12, 2) not null check (frete >= 0),
  total numeric(12, 2) not null check (total >= 0),
  destinatario_nome text not null,
  telefone text not null,
  cep text not null,
  logradouro text not null,
  numero text not null,
  complemento text,
  bairro text not null,
  cidade text not null,
  uf text not null,
  mercadopago_preference_id text,
  mercadopago_payment_id text,
  mercadopago_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pedidos_total_coerente check (total = subtotal + frete)
);

comment on table public.pedidos is 'Pedido da loja; totais calculados no servidor. Estoque só baixa após pagamento aprovado (webhook).';

create index pedidos_user_id_created_at_idx
  on public.pedidos (user_id, created_at desc);

create table public.pedido_itens (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  produto_id uuid not null references public.produtos (id) on delete restrict,
  quantidade int not null check (quantidade > 0),
  preco_unitario numeric(12, 2) not null check (preco_unitario >= 0),
  titulo_snapshot text not null,
  cod_produto_snapshot text not null
);

comment on table public.pedido_itens is 'Itens do pedido com snapshot de preço e identificação no momento da compra.';

create index pedido_itens_pedido_id_idx on public.pedido_itens (pedido_id);
create index pedido_itens_produto_id_idx on public.pedido_itens (produto_id);

create or replace function public.set_pedidos_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger pedidos_set_updated_at
  before update on public.pedidos
  for each row
  execute function public.set_pedidos_updated_at();

alter table public.pedidos enable row level security;
alter table public.pedido_itens enable row level security;

create policy "pedidos_select_own"
  on public.pedidos
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "pedido_itens_select_own"
  on public.pedido_itens
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.pedidos p
      where p.id = pedido_itens.pedido_id
        and p.user_id = (select auth.uid())
    )
  );

-- Criação de pedido apenas via RPC (security definer); cliente não insere diretamente nas tabelas.

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
  p_uf text
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

  select round(coalesce(sum(p.valor * l.quantidade), 0), 2)::numeric(12, 2)
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
    p.valor::numeric(12, 2),
    p.titulo,
    p.cod_produto
  from tmp_pedido_linhas l
  inner join public.produtos p on p.id = l.produto_id;

  return v_pedido_id;
end;
$$;

comment on function public.criar_pedido_checkout is
  'Cria pedido + itens em uma transação: bloqueia linhas de produtos (FOR UPDATE), valida estoque e grava snapshots de preço/código.';

revoke all on table public.pedidos from public;
revoke all on table public.pedido_itens from public;

grant select on table public.pedidos to authenticated;
grant select on table public.pedido_itens to authenticated;
grant usage on type public.pedido_status to authenticated;

grant all on table public.pedidos to service_role;
grant all on table public.pedido_itens to service_role;

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
  text
) to authenticated, service_role;
