-- Classificação do modelo no cadastro admin: carro, moto ou caminhão.
alter table public.modelos
  add column if not exists tipo_veiculo text not null default 'carro';

alter table public.modelos
  drop constraint if exists modelos_tipo_veiculo_check;

alter table public.modelos
  add constraint modelos_tipo_veiculo_check
  check (tipo_veiculo in ('carro', 'moto', 'caminhao'));

comment on column public.modelos.tipo_veiculo is 'Tipo de veículo do modelo: carro, moto ou caminhão.';
