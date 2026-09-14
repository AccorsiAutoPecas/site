-- Indexes e trigram para acelerar listagens e busca ILIKE do catálogo.
-- Não altera regras de negócio; só performance de leitura.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS produtos_titulo_trgm_idx
  ON public.produtos USING gin (titulo gin_trgm_ops);

CREATE INDEX IF NOT EXISTS produtos_cod_produto_trgm_idx
  ON public.produtos USING gin (cod_produto gin_trgm_ops);

CREATE INDEX IF NOT EXISTS produtos_status_em_destaque_idx
  ON public.produtos (status, em_destaque)
  WHERE em_destaque = true;

CREATE INDEX IF NOT EXISTS produtos_status_valor_idx
  ON public.produtos (status, valor);

CREATE INDEX IF NOT EXISTS produto_compatibilidades_produto_id_idx
  ON public.produto_compatibilidades (produto_id);
