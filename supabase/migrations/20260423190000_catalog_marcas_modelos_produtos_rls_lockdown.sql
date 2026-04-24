-- Catálogo núcleo (marcas, modelos, produtos, compatibilidades): substitui políticas RLS
-- permissivas de 20260408100000_catalog_marcas_modelos_produtos_compat_core.sql por
-- leitura pública (anon + authenticated) e mutações apenas para perfil admin (profiles.role).
-- Exige migrações de profiles e role (20260415130000, 20260421140000) já aplicadas.

-- ---------------------------------------------------------------------------
-- public.marcas
-- ---------------------------------------------------------------------------
drop policy if exists "marcas_select_open" on public.marcas;
drop policy if exists "marcas_insert_open" on public.marcas;
drop policy if exists "marcas_update_open" on public.marcas;
drop policy if exists "marcas_delete_open" on public.marcas;

create policy "marcas_select_public"
  on public.marcas for select
  to anon, authenticated
  using (true);

create policy "marcas_insert_admin"
  on public.marcas for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles pr
      where pr.id = (select auth.uid())
        and pr.role = 'admin'
    )
  );

create policy "marcas_update_admin"
  on public.marcas for update
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

create policy "marcas_delete_admin"
  on public.marcas for delete
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
-- public.modelos
-- ---------------------------------------------------------------------------
drop policy if exists "modelos_select_open" on public.modelos;
drop policy if exists "modelos_insert_open" on public.modelos;
drop policy if exists "modelos_update_open" on public.modelos;
drop policy if exists "modelos_delete_open" on public.modelos;

create policy "modelos_select_public"
  on public.modelos for select
  to anon, authenticated
  using (true);

create policy "modelos_insert_admin"
  on public.modelos for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles pr
      where pr.id = (select auth.uid())
        and pr.role = 'admin'
    )
  );

create policy "modelos_update_admin"
  on public.modelos for update
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

create policy "modelos_delete_admin"
  on public.modelos for delete
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
-- public.produtos
-- ---------------------------------------------------------------------------
drop policy if exists "produtos_select_open" on public.produtos;
drop policy if exists "produtos_insert_open" on public.produtos;
drop policy if exists "produtos_update_open" on public.produtos;
drop policy if exists "produtos_delete_open" on public.produtos;

create policy "produtos_select_public"
  on public.produtos for select
  to anon, authenticated
  using (true);

create policy "produtos_insert_admin"
  on public.produtos for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles pr
      where pr.id = (select auth.uid())
        and pr.role = 'admin'
    )
  );

create policy "produtos_update_admin"
  on public.produtos for update
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

create policy "produtos_delete_admin"
  on public.produtos for delete
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
-- public.produto_compatibilidades
-- ---------------------------------------------------------------------------
drop policy if exists "produto_compatibilidades_select_open" on public.produto_compatibilidades;
drop policy if exists "produto_compatibilidades_insert_open" on public.produto_compatibilidades;
drop policy if exists "produto_compatibilidades_update_open" on public.produto_compatibilidades;
drop policy if exists "produto_compatibilidades_delete_open" on public.produto_compatibilidades;

create policy "produto_compatibilidades_select_public"
  on public.produto_compatibilidades for select
  to anon, authenticated
  using (true);

create policy "produto_compatibilidades_insert_admin"
  on public.produto_compatibilidades for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles pr
      where pr.id = (select auth.uid())
        and pr.role = 'admin'
    )
  );

create policy "produto_compatibilidades_update_admin"
  on public.produto_compatibilidades for update
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

create policy "produto_compatibilidades_delete_admin"
  on public.produto_compatibilidades for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles pr
      where pr.id = (select auth.uid())
        and pr.role = 'admin'
    )
  );
