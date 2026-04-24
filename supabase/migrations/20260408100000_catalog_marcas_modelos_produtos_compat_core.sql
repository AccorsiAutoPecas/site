-- Núcleo do catálogo: marcas, modelos, produtos e compatibilidade por veículo.
-- Deve rodar antes de 20260409120000_modelo_anos.sql (FK para public.modelos).
-- Colunas adicionais de produtos (destaque, dimensões, embalagem, descontos) continuam
-- nas migrações incrementais posteriores (add column if not exists).
-- RLS restritiva (somente admin para escrita) aplica-se em
-- 20260423190000_catalog_marcas_modelos_produtos_rls_lockdown.sql, após public.profiles + role.

-- ---------------------------------------------------------------------------
-- public.marcas
-- ---------------------------------------------------------------------------
create table if not exists public.marcas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  constraint marcas_slug_unique unique (slug),
  constraint marcas_nome_unique unique (nome)
);

create index if not exists marcas_slug_idx on public.marcas (slug);

comment on table public.marcas is 'Marcas de veículo do catálogo interno (filtros e compatibilidade).';

-- ---------------------------------------------------------------------------
-- public.modelos
-- ---------------------------------------------------------------------------
create table if not exists public.modelos (
  id uuid primary key default gen_random_uuid(),
  marca_id uuid not null references public.marcas (id) on delete restrict,
  nome text not null,
  slug text not null,
  tipo_veiculo text not null default 'carro',
  created_at timestamptz not null default now(),
  constraint modelos_marca_slug_unique unique (marca_id, slug),
  constraint modelos_tipo_veiculo_check
    check (tipo_veiculo in ('carro', 'moto', 'caminhao'))
);

create index if not exists modelos_marca_id_idx on public.modelos (marca_id);

comment on table public.modelos is 'Modelos por marca; slug único dentro da marca.';
comment on column public.modelos.tipo_veiculo is 'Tipo de veículo do modelo: carro, moto ou caminhão.';

-- ---------------------------------------------------------------------------
-- public.produtos (forma mínima; demais colunas nas migrações seguintes)
-- ---------------------------------------------------------------------------
create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  cod_produto text not null,
  descricao text,
  valor numeric(12, 2) not null check (valor >= 0),
  foto text,
  quantidade_estoque int not null default 0 check (quantidade_estoque >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint produtos_cod_produto_unique unique (cod_produto)
);

create index if not exists produtos_cod_produto_idx on public.produtos (cod_produto);

comment on table public.produtos is 'Itens à venda; preço e estoque usados no checkout e webhook.';

-- Bancos que já tinham public.produtos sem esta coluna (antes desta migração versionada).
alter table public.produtos
  add column if not exists updated_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- public.produto_compatibilidades
-- ---------------------------------------------------------------------------
create table if not exists public.produto_compatibilidades (
  produto_id uuid not null references public.produtos (id) on delete cascade,
  modelo_id uuid not null references public.modelos (id) on delete cascade,
  ano_inicio smallint not null,
  ano_fim smallint not null,
  created_at timestamptz not null default now(),
  constraint produto_compatibilidades_pk primary key (produto_id, modelo_id),
  constraint produto_compatibilidades_anos_range check (
    ano_inicio >= 1900 and ano_inicio <= 2100
    and ano_fim >= 1900 and ano_fim <= 2100
    and ano_inicio <= ano_fim
  )
);

create index if not exists produto_compatibilidades_modelo_id_idx
  on public.produto_compatibilidades (modelo_id);

comment on table public.produto_compatibilidades is
  'Faixa de anos do veículo em que o produto se aplica, por modelo do catálogo.';

-- ---------------------------------------------------------------------------
-- updated_at em produtos (alinhado ao padrão profiles/pedidos)
-- ---------------------------------------------------------------------------
create or replace function public.set_produtos_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists produtos_set_updated_at on public.produtos;
create trigger produtos_set_updated_at
  before update on public.produtos
  for each row
  execute function public.set_produtos_updated_at();

-- ---------------------------------------------------------------------------
-- RLS inicial (permissiva): substituída na migração 20260423190000 após profiles.
-- ---------------------------------------------------------------------------
alter table public.marcas enable row level security;
alter table public.modelos enable row level security;
alter table public.produtos enable row level security;
alter table public.produto_compatibilidades enable row level security;

drop policy if exists "marcas_select_open" on public.marcas;
drop policy if exists "marcas_insert_open" on public.marcas;
drop policy if exists "marcas_update_open" on public.marcas;
drop policy if exists "marcas_delete_open" on public.marcas;

create policy "marcas_select_open"
  on public.marcas for select using (true);
create policy "marcas_insert_open"
  on public.marcas for insert with check (true);
create policy "marcas_update_open"
  on public.marcas for update using (true) with check (true);
create policy "marcas_delete_open"
  on public.marcas for delete using (true);

drop policy if exists "modelos_select_open" on public.modelos;
drop policy if exists "modelos_insert_open" on public.modelos;
drop policy if exists "modelos_update_open" on public.modelos;
drop policy if exists "modelos_delete_open" on public.modelos;

create policy "modelos_select_open"
  on public.modelos for select using (true);
create policy "modelos_insert_open"
  on public.modelos for insert with check (true);
create policy "modelos_update_open"
  on public.modelos for update using (true) with check (true);
create policy "modelos_delete_open"
  on public.modelos for delete using (true);

drop policy if exists "produtos_select_open" on public.produtos;
drop policy if exists "produtos_insert_open" on public.produtos;
drop policy if exists "produtos_update_open" on public.produtos;
drop policy if exists "produtos_delete_open" on public.produtos;

create policy "produtos_select_open"
  on public.produtos for select using (true);
create policy "produtos_insert_open"
  on public.produtos for insert with check (true);
create policy "produtos_update_open"
  on public.produtos for update using (true) with check (true);
create policy "produtos_delete_open"
  on public.produtos for delete using (true);

drop policy if exists "produto_compatibilidades_select_open" on public.produto_compatibilidades;
drop policy if exists "produto_compatibilidades_insert_open" on public.produto_compatibilidades;
drop policy if exists "produto_compatibilidades_update_open" on public.produto_compatibilidades;
drop policy if exists "produto_compatibilidades_delete_open" on public.produto_compatibilidades;

create policy "produto_compatibilidades_select_open"
  on public.produto_compatibilidades for select using (true);
create policy "produto_compatibilidades_insert_open"
  on public.produto_compatibilidades for insert with check (true);
create policy "produto_compatibilidades_update_open"
  on public.produto_compatibilidades for update using (true) with check (true);
create policy "produto_compatibilidades_delete_open"
  on public.produto_compatibilidades for delete using (true);

-- ---------------------------------------------------------------------------
-- Grants (PostgREST / roles Supabase)
-- ---------------------------------------------------------------------------
revoke all on table public.marcas from public;
revoke all on table public.modelos from public;
revoke all on table public.produtos from public;
revoke all on table public.produto_compatibilidades from public;

grant select on table public.marcas to anon, authenticated;
grant insert, update, delete on table public.marcas to authenticated;
grant all on table public.marcas to service_role;

grant select on table public.modelos to anon, authenticated;
grant insert, update, delete on table public.modelos to authenticated;
grant all on table public.modelos to service_role;

grant select on table public.produtos to anon, authenticated;
grant insert, update, delete on table public.produtos to authenticated;
grant all on table public.produtos to service_role;

grant select on table public.produto_compatibilidades to anon, authenticated;
grant insert, update, delete on table public.produto_compatibilidades to authenticated;
grant all on table public.produto_compatibilidades to service_role;
