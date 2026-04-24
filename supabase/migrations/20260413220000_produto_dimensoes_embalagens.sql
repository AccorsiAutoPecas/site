-- Dimensões do produto (bruto) e catálogo de embalagens fixas para envio.

create table if not exists public.embalagens (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  comprimento_cm numeric not null check (comprimento_cm >= 0),
  largura_cm numeric not null check (largura_cm >= 0),
  altura_cm numeric not null check (altura_cm >= 0),
  peso_embalagem_kg numeric not null check (peso_embalagem_kg >= 0),
  created_at timestamptz not null default now()
);

create index if not exists embalagens_nome_idx on public.embalagens (nome);

alter table public.embalagens enable row level security;

create policy "embalagens_select" on public.embalagens for select using (true);
create policy "embalagens_insert" on public.embalagens for insert with check (true);
create policy "embalagens_update" on public.embalagens for update using (true);
create policy "embalagens_delete" on public.embalagens for delete using (true);

alter table public.produtos
  add column if not exists prod_comprimento_cm numeric,
  add column if not exists prod_largura_cm numeric,
  add column if not exists prod_altura_cm numeric,
  add column if not exists prod_peso_kg numeric,
  add column if not exists embalagem_id uuid references public.embalagens (id) on delete set null;

create index if not exists produtos_embalagem_id_idx on public.produtos (embalagem_id);
