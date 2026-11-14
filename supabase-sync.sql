-- Taller POD — Sync Supabase
-- Ejecutar UNA sola vez en Supabase > SQL Editor > Run.
-- La tabla es exclusiva de esta aplicación: se eliminan TODAS las políticas
-- anteriores para impedir que una política permisiva heredada amplíe el acceso.

begin;

create table if not exists public.pod_project_sync (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.pod_project_sync enable row level security;

-- RLS combina políticas permisivas con OR. No basta con reemplazar solo
-- las tres políticas conocidas: una política antigua adicional podría
-- permitir leer/escribir filas ajenas. Limpiar el conjunto completo.
do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'pod_project_sync'
  loop
    execute format(
      'drop policy if exists %I on public.pod_project_sync',
      existing_policy.policyname
    );
  end loop;
end
$$;

-- Denegar acceso a anon y PUBLIC; conceder únicamente lo que usa el cliente.
revoke all on table public.pod_project_sync from public, anon, authenticated;
grant select, insert, update on table public.pod_project_sync to authenticated;

create policy "POD users read own sync"
  on public.pod_project_sync for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "POD users create own sync"
  on public.pod_project_sync for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "POD users update own sync"
  on public.pod_project_sync for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

commit;
