-- Municipality API keys are deliberately separate from organisation keys. A
-- bearer token can therefore only ever be resolved against one authority.
create table public.municipality_api_keys (
  id              uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references public.municipalities(id) on delete cascade,
  label           text,
  key_prefix      text not null,
  key_hash        text not null unique,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  last_used_at    timestamptz,
  revoked_at      timestamptz
);

create index municipality_api_keys_muni_idx on public.municipality_api_keys (municipality_id);

alter table public.municipality_api_keys enable row level security;

create policy "Municipality admins read own API keys"
  on public.municipality_api_keys for select to authenticated
  using (public.is_municipality_admin(municipality_id) or public.is_platform_admin());

create policy "Municipality admins create own API keys"
  on public.municipality_api_keys for insert to authenticated
  with check (public.is_municipality_admin(municipality_id));

create policy "Municipality admins update own API keys"
  on public.municipality_api_keys for update to authenticated
  using (public.is_municipality_admin(municipality_id))
  with check (public.is_municipality_admin(municipality_id));

grant select, insert, update on public.municipality_api_keys to authenticated;