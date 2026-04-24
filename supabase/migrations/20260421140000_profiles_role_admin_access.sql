-- Papel da conta (loja): apenas admins acessam /admin e APIs /api/admin/*.
-- Usuários autenticados não podem alterar o próprio role via API (apenas JWT service_role ou SQL sem claim de "authenticated").

alter table public.profiles
  add column if not exists role text not null default 'user'
    check (role in ('admin', 'user'));

comment on column public.profiles.role is 'Papel: user (padrão) ou admin (painel e APIs administrativas).';

update public.profiles set role = 'user' where role is null;

create or replace function public.profiles_prevent_user_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  claims_raw text;
  jwt_role text;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;
  if new.role is not distinct from old.role then
    return new;
  end if;

  claims_raw := nullif(current_setting('request.jwt.claims', true), '');
  begin
    jwt_role := claims_raw::json->>'role';
  exception
    when others then
      jwt_role := null;
  end;

  -- Sessão de cliente (PostgREST): não pode mudar role.
  if jwt_role = 'authenticated' then
    new.role := old.role;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_prevent_user_role_escalation on public.profiles;

create trigger profiles_prevent_user_role_escalation
  before update on public.profiles
  for each row
  execute function public.profiles_prevent_user_role_escalation();

-- Log opcional de acessos ao painel (preencher a partir do app se desejar).
create table if not exists public.admin_access_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  path text not null,
  created_at timestamptz not null default now()
);

comment on table public.admin_access_log is 'Auditoria opcional de acessos ao painel admin.';

create index if not exists admin_access_log_user_id_created_at_idx
  on public.admin_access_log (user_id, created_at desc);

alter table public.admin_access_log enable row level security;

drop policy if exists "admin_access_log_no_access" on public.admin_access_log;

-- Ninguém lê via API de loja; uso via service_role ou políticas futuras.
create policy "admin_access_log_no_access"
  on public.admin_access_log
  for all
  to authenticated
  using (false)
  with check (false);

revoke all on table public.admin_access_log from public;
grant all on table public.admin_access_log to service_role;
