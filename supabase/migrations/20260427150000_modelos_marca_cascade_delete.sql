-- Ao excluir uma marca, remove em cascata todos os modelos vinculados.
-- modelo_anos e produto_compatibilidades já cascateiam a exclusão do modelo;
-- garagem_veiculos.modelo_id permanece on delete set null.

alter table public.modelos
  drop constraint if exists modelos_marca_id_fkey;

alter table public.modelos
  add constraint modelos_marca_id_fkey
  foreign key (marca_id) references public.marcas (id) on delete cascade;
