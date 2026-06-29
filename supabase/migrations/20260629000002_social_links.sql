-- Social media accounts for organisations and municipalities.
-- Stored as a jsonb map { platform: url } so we can add platforms without new
-- columns. Also adds an update path for municipality admins (they previously
-- had read-only access to their municipality row).

alter table public.organizations
  add column social_links jsonb not null default '{}'::jsonb;

alter table public.municipalities
  add column social_links jsonb not null default '{}'::jsonb;

-- Municipality admins (and platform admins) may edit their municipality.
grant update on public.municipalities to authenticated;

create policy "Admins update own municipality"
  on public.municipalities for update to authenticated
  using (public.is_municipality_admin(id) or public.is_platform_admin())
  with check (public.is_municipality_admin(id) or public.is_platform_admin());
