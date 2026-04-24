-- Limite de consultas à API externa de placas por usuário / visitante.

create table if not exists public.placa_consulta_usuario_dia (
  user_id uuid not null references auth.users (id) on delete cascade,
  dia_sp date not null,
  quantidade integer not null default 0,
  primary key (user_id, dia_sp),
  constraint placa_consulta_usuario_dia_quantidade_check check (quantidade >= 0)
);

comment on table public.placa_consulta_usuario_dia is
  'Consultas de placa bem-sucedidas por usuário autenticado e dia civil em America/Sao_Paulo (máx. 5/dia).';

create table if not exists public.placa_consulta_anon (
  id uuid primary key,
  quantidade integer not null default 0,
  constraint placa_consulta_anon_quantidade_check check (quantidade >= 0 and quantidade <= 1)
);

comment on table public.placa_consulta_anon is
  'Visitante anônimo identificado por cookie: no máximo 1 consulta bem-sucedida.';

create or replace function public.increment_placa_consulta_usuario(p_user_id uuid, p_dia_sp date)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.placa_consulta_usuario_dia (user_id, dia_sp, quantidade)
  values (p_user_id, p_dia_sp, 1)
  on conflict (user_id, dia_sp)
  do update set quantidade = public.placa_consulta_usuario_dia.quantidade + 1;
$$;

comment on function public.increment_placa_consulta_usuario is
  'Incrementa contador após consulta de placa bem-sucedida (usuário logado).';

revoke all on function public.increment_placa_consulta_usuario(uuid, date) from public;
grant execute on function public.increment_placa_consulta_usuario(uuid, date) to service_role;

revoke all on table public.placa_consulta_usuario_dia from public;
revoke all on table public.placa_consulta_anon from public;
grant all on table public.placa_consulta_usuario_dia to service_role;
grant all on table public.placa_consulta_anon to service_role;
