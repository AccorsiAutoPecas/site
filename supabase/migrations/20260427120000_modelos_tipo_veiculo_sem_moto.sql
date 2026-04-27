-- Catálogo da loja: apenas carros e caminhões (sem motos).
update public.modelos
set tipo_veiculo = 'carro'
where tipo_veiculo = 'moto';

alter table public.modelos
  drop constraint if exists modelos_tipo_veiculo_check;

alter table public.modelos
  add constraint modelos_tipo_veiculo_check
  check (tipo_veiculo in ('carro', 'caminhao'));

comment on column public.modelos.tipo_veiculo is 'Tipo de veículo do modelo: carro ou caminhão.';
