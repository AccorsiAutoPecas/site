-- Credenciais OAuth Melhor Envio (tokens). Acesso apenas via service_role no backend;
-- RLS ativo sem policies: anon/authenticated não leem nem escrevem via PostgREST.

create table if not exists public.melhor_envio_credentials (
  id uuid primary key default gen_random_uuid(),
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  is_refreshing boolean not null default false,
  refresh_lock_until timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.melhor_envio_credentials is
  'Tokens Melhor Envio; uso exclusivo no servidor (createAdminClient). Não usar no browser.';

create or replace function public.set_melhor_envio_credentials_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger melhor_envio_credentials_set_updated_at
  before update on public.melhor_envio_credentials
  for each row
  execute function public.set_melhor_envio_credentials_updated_at();

alter table public.melhor_envio_credentials enable row level security;
