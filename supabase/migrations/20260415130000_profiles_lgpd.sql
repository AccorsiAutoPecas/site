-- Perfis de cliente: nome, aceites LGPD com versão, trigger pós-signup e RLS.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome_completo text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  termos_aceitos_em timestamptz not null,
  privacidade_aceita_em timestamptz not null,
  versao_termos text,
  versao_privacidade text
);

comment on table public.profiles is 'Perfil da conta na loja; linha criada automaticamente após o cadastro em auth.users.';
comment on column public.profiles.termos_aceitos_em is 'Instante do aceite dos termos (versão em versao_termos).';
comment on column public.profiles.privacidade_aceita_em is 'Instante do aceite da política de privacidade (versão em versao_privacidade).';
comment on column public.profiles.versao_termos is 'Identificador da versão dos termos aceitos (ex.: v1).';
comment on column public.profiles.versao_privacidade is 'Identificador da versão da política aceita (ex.: v1).';

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_profiles_updated_at();

-- Cria o perfil a partir de raw_user_meta_data no signUp (options.data no cliente).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb;
begin
  meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  insert into public.profiles (
    id,
    nome_completo,
    termos_aceitos_em,
    privacidade_aceita_em,
    versao_termos,
    versao_privacidade
  )
  values (
    new.id,
    coalesce(nullif(btrim(meta->>'nome_completo'), ''), ''),
    coalesce((meta->>'termos_aceitos_em')::timestamptz, now()),
    coalesce((meta->>'privacidade_aceita_em')::timestamptz, now()),
    nullif(btrim(meta->>'versao_termos'), ''),
    nullif(btrim(meta->>'versao_privacidade'), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

alter table public.profiles enable row level security;

-- Sem política de insert: apenas o trigger (security definer) grava novas linhas.
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

revoke all on table public.profiles from public;

grant select, update on table public.profiles to authenticated;

grant all on table public.profiles to service_role;
