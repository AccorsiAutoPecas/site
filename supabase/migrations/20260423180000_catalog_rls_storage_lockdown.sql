-- Catálogo / layout: leitura pública (anon + authenticated); mutações só para perfil admin.
-- Storage: remove insert/delete anônimo no bucket product-images (upload/delete exige sessão authenticated).

-- ---------------------------------------------------------------------------
-- storage.objects — product-images (remove políticas anon)
-- ---------------------------------------------------------------------------
drop policy if exists "product_images_insert_anon" on storage.objects;
drop policy if exists "product_images_delete_anon" on storage.objects;

-- Mantidas de migrações anteriores: select público + insert/update/delete para authenticated.

-- ---------------------------------------------------------------------------
-- public.categorias + public.produto_categorias
-- ---------------------------------------------------------------------------
drop policy if exists "categorias_select" on public.categorias;
drop policy if exists "categorias_insert" on public.categorias;
drop policy if exists "categorias_update" on public.categorias;
drop policy if exists "categorias_delete" on public.categorias;

drop policy if exists "produto_categorias_select" on public.produto_categorias;
drop policy if exists "produto_categorias_insert" on public.produto_categorias;
drop policy if exists "produto_categorias_delete" on public.produto_categorias;

create policy "categorias_select_public"
  on public.categorias for select
  to anon, authenticated
  using (true);

create policy "categorias_insert_admin"
  on public.categorias for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles pr
      where pr.id = (select auth.uid())
        and pr.role = 'admin'
    )
  );

create policy "categorias_update_admin"
  on public.categorias for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles pr
      where pr.id = (select auth.uid())
        and pr.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles pr
      where pr.id = (select auth.uid())
        and pr.role = 'admin'
    )
  );

create policy "categorias_delete_admin"
  on public.categorias for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles pr
      where pr.id = (select auth.uid())
        and pr.role = 'admin'
    )
  );

create policy "produto_categorias_select_public"
  on public.produto_categorias for select
  to anon, authenticated
  using (true);

create policy "produto_categorias_insert_admin"
  on public.produto_categorias for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles pr
      where pr.id = (select auth.uid())
        and pr.role = 'admin'
    )
  );

create policy "produto_categorias_delete_admin"
  on public.produto_categorias for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles pr
      where pr.id = (select auth.uid())
        and pr.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- public.modelo_anos
-- ---------------------------------------------------------------------------
drop policy if exists "modelo_anos_select" on public.modelo_anos;
drop policy if exists "modelo_anos_insert" on public.modelo_anos;
drop policy if exists "modelo_anos_delete" on public.modelo_anos;

create policy "modelo_anos_select_public"
  on public.modelo_anos for select
  to anon, authenticated
  using (true);

create policy "modelo_anos_insert_admin"
  on public.modelo_anos for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles pr
      where pr.id = (select auth.uid())
        and pr.role = 'admin'
    )
  );

create policy "modelo_anos_delete_admin"
  on public.modelo_anos for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles pr
      where pr.id = (select auth.uid())
        and pr.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- public.site_layout
-- ---------------------------------------------------------------------------
drop policy if exists "site_layout_select" on public.site_layout;
drop policy if exists "site_layout_insert" on public.site_layout;
drop policy if exists "site_layout_update" on public.site_layout;
drop policy if exists "site_layout_delete" on public.site_layout;

create policy "site_layout_select_public"
  on public.site_layout for select
  to anon, authenticated
  using (true);

create policy "site_layout_insert_admin"
  on public.site_layout for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles pr
      where pr.id = (select auth.uid())
        and pr.role = 'admin'
    )
  );

create policy "site_layout_update_admin"
  on public.site_layout for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles pr
      where pr.id = (select auth.uid())
        and pr.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles pr
      where pr.id = (select auth.uid())
        and pr.role = 'admin'
    )
  );

create policy "site_layout_delete_admin"
  on public.site_layout for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles pr
      where pr.id = (select auth.uid())
        and pr.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- public.embalagens
-- ---------------------------------------------------------------------------
drop policy if exists "embalagens_select" on public.embalagens;
drop policy if exists "embalagens_insert" on public.embalagens;
drop policy if exists "embalagens_update" on public.embalagens;
drop policy if exists "embalagens_delete" on public.embalagens;

create policy "embalagens_select_public"
  on public.embalagens for select
  to anon, authenticated
  using (true);

create policy "embalagens_insert_admin"
  on public.embalagens for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles pr
      where pr.id = (select auth.uid())
        and pr.role = 'admin'
    )
  );

create policy "embalagens_update_admin"
  on public.embalagens for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles pr
      where pr.id = (select auth.uid())
        and pr.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles pr
      where pr.id = (select auth.uid())
        and pr.role = 'admin'
    )
  );

create policy "embalagens_delete_admin"
  on public.embalagens for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles pr
      where pr.id = (select auth.uid())
        and pr.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- public.produto_relacionados
-- ---------------------------------------------------------------------------
drop policy if exists "produto_relacionados_select" on public.produto_relacionados;
drop policy if exists "produto_relacionados_insert" on public.produto_relacionados;
drop policy if exists "produto_relacionados_delete" on public.produto_relacionados;

create policy "produto_relacionados_select_public"
  on public.produto_relacionados for select
  to anon, authenticated
  using (true);

create policy "produto_relacionados_insert_admin"
  on public.produto_relacionados for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles pr
      where pr.id = (select auth.uid())
        and pr.role = 'admin'
    )
  );

create policy "produto_relacionados_delete_admin"
  on public.produto_relacionados for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles pr
      where pr.id = (select auth.uid())
        and pr.role = 'admin'
    )
  );
