-- Garagem do cliente: veículos salvos para reutilizar filtros no catálogo.

create table if not exists public.garagem_veiculos (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  placa text not null,
  marca text,
  modelo text,
  ano integer,
  modelo_id uuid references public.modelos (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint garagem_veiculos_placa_check check (placa ~ '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$|^[A-Z]{3}[0-9]{4}$')
);

comment on table public.garagem_veiculos is 'Veículos salvos pelo usuário logado para filtrar peças rapidamente.';
comment on column public.garagem_veiculos.modelo_id is 'Modelo do catálogo interno usado para aplicar filtros em /produtos.';

create unique index if not exists garagem_veiculos_user_placa_uidx
  on public.garagem_veiculos (user_id, placa);

create index if not exists garagem_veiculos_user_created_idx
  on public.garagem_veiculos (user_id, created_at desc);

create or replace function public.set_garagem_veiculos_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists garagem_veiculos_set_updated_at on public.garagem_veiculos;
create trigger garagem_veiculos_set_updated_at
  before update on public.garagem_veiculos
  for each row
  execute function public.set_garagem_veiculos_updated_at();

alter table public.garagem_veiculos enable row level security;

drop policy if exists "garagem_veiculos_select_own" on public.garagem_veiculos;
create policy "garagem_veiculos_select_own"
  on public.garagem_veiculos
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "garagem_veiculos_insert_own" on public.garagem_veiculos;
create policy "garagem_veiculos_insert_own"
  on public.garagem_veiculos
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "garagem_veiculos_update_own" on public.garagem_veiculos;
create policy "garagem_veiculos_update_own"
  on public.garagem_veiculos
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "garagem_veiculos_delete_own" on public.garagem_veiculos;
create policy "garagem_veiculos_delete_own"
  on public.garagem_veiculos
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.garagem_veiculos from public;
grant select, insert, update, delete on table public.garagem_veiculos to authenticated;
grant all on table public.garagem_veiculos to service_role;
