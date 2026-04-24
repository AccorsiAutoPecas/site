-- Configuração visual da loja (banners da home, etc.). Uma linha singleton.

create table if not exists public.site_layout (
  id text primary key default 'default' check (id = 'default'),
  banner_1_url text not null default '',
  banner_2_url text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.site_layout (id)
values ('default')
on conflict (id) do nothing;

alter table public.site_layout enable row level security;

create policy "site_layout_select" on public.site_layout for select using (true);
create policy "site_layout_insert" on public.site_layout for insert with check (true);
create policy "site_layout_update" on public.site_layout for update using (true);
create policy "site_layout_delete" on public.site_layout for delete using (true);
