-- Backfill de public.modelo_anos para o catálogo do seed 20260427140000.
-- Motivo: RLS em modelo_anos (insert só admin autenticado) pode fazer o INSERT direto
-- do seed inserir 0 linhas quando o SQL não roda como superuser/postgres.
-- Esta migração usa função SECURITY DEFINER (owner = quem aplicar a migração, tipicamente postgres).

create or replace function public._migration_backfill_modelo_anos_catalogo_seed()
returns void
language plpgsql
security definer
set search_path = public
as $body$
begin
  insert into public.modelo_anos (modelo_id, ano)
  with ranges (marca_slug, modelo_slug, ano_ini, ano_fim) as (
    values
      ('volkswagen', 'gol', 2000, 2026),
      ('volkswagen', 'voyage', 2000, 2026),
      ('volkswagen', 'parati', 2000, 2013),
      ('volkswagen', 'saveiro', 2000, 2026),
      ('volkswagen', 'fox', 2003, 2021),
      ('volkswagen', 'crossfox', 2005, 2018),
      ('volkswagen', 'spacefox', 2006, 2017),
      ('volkswagen', 'polo', 2002, 2026),
      ('volkswagen', 'golf', 2000, 2026),
      ('volkswagen', 'jetta', 2008, 2026),
      ('volkswagen', 'passat', 2000, 2026),
      ('volkswagen', 'virtus', 2018, 2026),
      ('volkswagen', 'nivus', 2020, 2026),
      ('volkswagen', 't-cross', 2019, 2026),
      ('volkswagen', 'taos', 2021, 2026),
      ('volkswagen', 'tiguan', 2009, 2026),
      ('volkswagen', 'up', 2014, 2021),
      ('volkswagen', 'bora', 2000, 2011),
      ('volkswagen', 'kombi', 2000, 2013),
      ('volkswagen', 'amarok', 2010, 2026),
      ('volkswagen', 'arteon', 2018, 2026),
      ('ford', 'ka', 2000, 2019),
      ('ford', 'fiesta', 2000, 2019),
      ('ford', 'focus', 2001, 2019),
      ('ford', 'ecosport', 2003, 2023),
      ('ford', 'ranger', 2000, 2026),
      ('ford', 'fusion', 2006, 2020),
      ('ford', 'edge', 2008, 2026),
      ('ford', 'mustang', 2000, 2026),
      ('ford', 'territory', 2020, 2026),
      ('ford', 'maverick', 2022, 2026),
      ('ford', 'bronco-sport', 2021, 2026),
      ('chevrolet', 'celta', 2000, 2015),
      ('chevrolet', 'corsa', 2000, 2012),
      ('chevrolet', 'classic', 2005, 2016),
      ('chevrolet', 'astra', 2000, 2011),
      ('chevrolet', 'vectra', 2000, 2011),
      ('chevrolet', 'zafira', 2001, 2012),
      ('chevrolet', 'meriva', 2002, 2012),
      ('chevrolet', 'blazer', 2000, 2011),
      ('chevrolet', 's10', 2000, 2026),
      ('chevrolet', 'montana', 2003, 2026),
      ('chevrolet', 'agile', 2009, 2014),
      ('chevrolet', 'cobalt', 2011, 2019),
      ('chevrolet', 'cruze', 2011, 2026),
      ('chevrolet', 'onix', 2012, 2026),
      ('chevrolet', 'prisma', 2013, 2019),
      ('chevrolet', 'spin', 2012, 2026),
      ('chevrolet', 'tracker', 2000, 2026),
      ('chevrolet', 'equinox', 2017, 2026),
      ('chevrolet', 'trailblazer', 2012, 2026),
      ('chevrolet', 'camaro', 2010, 2026),
      ('fiat', 'uno', 2000, 2026),
      ('fiat', 'palio', 2000, 2019),
      ('fiat', 'siena', 2000, 2017),
      ('fiat', 'grand-siena', 2012, 2021),
      ('fiat', 'palio-weekend', 2000, 2019),
      ('fiat', 'strada', 2000, 2026),
      ('fiat', 'idea', 2005, 2016),
      ('fiat', 'stilo', 2002, 2010),
      ('fiat', 'linea', 2008, 2016),
      ('fiat', 'punto', 2007, 2017),
      ('fiat', 'bravo', 2011, 2016),
      ('fiat', 'toro', 2016, 2026),
      ('fiat', 'mobi', 2016, 2026),
      ('fiat', 'argo', 2017, 2026),
      ('fiat', 'cronos', 2018, 2026),
      ('fiat', 'pulse', 2022, 2026),
      ('fiat', 'fastback', 2023, 2026),
      ('fiat', '500', 2009, 2026),
      ('fiat', 'ducato', 2000, 2026),
      ('fiat', 'titano', 2024, 2026),
      ('toyota', 'corolla', 2000, 2026),
      ('toyota', 'fielder', 2004, 2008),
      ('toyota', 'camry', 2000, 2026),
      ('toyota', 'hilux', 2000, 2026),
      ('toyota', 'sw4', 2005, 2026),
      ('toyota', 'etios', 2012, 2021),
      ('toyota', 'yaris', 2000, 2026),
      ('toyota', 'prius', 2013, 2026),
      ('toyota', 'rav4', 2000, 2026),
      ('renault', 'clio', 2000, 2016),
      ('renault', 'megane', 2000, 2016),
      ('renault', 'symbol', 2009, 2019),
      ('renault', 'sandero', 2007, 2026),
      ('renault', 'logan', 2007, 2026),
      ('renault', 'duster', 2011, 2026),
      ('renault', 'oroch', 2015, 2026),
      ('renault', 'captur', 2017, 2026),
      ('renault', 'kwid', 2017, 2026),
      ('renault', 'fluence', 2011, 2016),
      ('renault', 'koleos', 2008, 2026),
      ('renault', 'zoe', 2014, 2026),
      ('renault', 'kardian', 2024, 2026),
      ('peugeot', '206', 2000, 2010),
      ('peugeot', '207', 2008, 2014),
      ('peugeot', '208', 2013, 2026),
      ('peugeot', '307', 2002, 2012),
      ('peugeot', '308', 2012, 2026),
      ('peugeot', '408', 2010, 2026),
      ('peugeot', '2008', 2015, 2026),
      ('peugeot', '3008', 2009, 2026),
      ('peugeot', '5008', 2009, 2026),
      ('peugeot', 'partner', 2000, 2026),
      ('peugeot', 'expert', 2000, 2026),
      ('peugeot', 'boxer', 2000, 2026),
      ('citroen', 'xsara', 2000, 2012),
      ('citroen', 'xsara-picasso', 2001, 2012),
      ('citroen', 'c3', 2003, 2026),
      ('citroen', 'c4', 2004, 2026),
      ('citroen', 'c4-lounge', 2013, 2026),
      ('citroen', 'c4-cactus', 2018, 2026),
      ('citroen', 'aircross', 2010, 2026),
      ('citroen', 'berlingo', 2000, 2026),
      ('citroen', 'jumper', 2000, 2026),
      ('citroen', 'c5-aircross', 2019, 2026),
      ('citroen', 'basalt', 2024, 2026)
  ),
  expanded as (
    select
      mo.id as modelo_id,
      gs.y::smallint as ano
    from ranges r
    join public.marcas ma on lower(ma.slug) = lower(r.marca_slug)
    join public.modelos mo
      on mo.marca_id = ma.id
      and lower(mo.slug) = lower(r.modelo_slug)
    cross join lateral generate_series(r.ano_ini, r.ano_fim) as gs(y)
  )
  select modelo_id, ano from expanded
  on conflict (modelo_id, ano) do nothing;
end;
$body$;

revoke all on function public._migration_backfill_modelo_anos_catalogo_seed() from public;

select public._migration_backfill_modelo_anos_catalogo_seed();

drop function public._migration_backfill_modelo_anos_catalogo_seed();
