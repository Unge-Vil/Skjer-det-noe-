-- Roles + richer organisation registration model.
--
-- Three admin tiers: organisation members, municipality admins, platform admins.
-- Organisations can serve multiple municipalities (M2M) and may carry an
-- organisasjonsnummer. New orgs are 'draft' until a municipality (or platform)
-- admin approves them.

-- Platform (service) admin flag.
alter table public.profiles
  add column is_platform_admin boolean not null default false;

-- Organisation registry details.
alter table public.organizations
  add column org_number text unique,
  add column is_volunteer boolean not null default false;

-- Which municipalities an organisation is listed in (many-to-many).
create table public.organization_municipalities (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  municipality_id uuid not null references public.municipalities(id) on delete cascade,
  primary key (organization_id, municipality_id)
);
create index organization_municipalities_muni_idx
  on public.organization_municipalities (municipality_id);

-- Who administers a municipality.
create table public.municipality_admins (
  municipality_id uuid not null references public.municipalities(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  created_at      timestamptz not null default now(),
  primary key (municipality_id, user_id)
);
create index municipality_admins_user_idx on public.municipality_admins (user_id);

-- ---------------------------------------------------------------------------
-- Role helpers (SECURITY DEFINER; authenticated only)
-- ---------------------------------------------------------------------------

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select is_platform_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.is_municipality_admin(muni uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.municipality_admins
    where municipality_id = muni and user_id = auth.uid()
  );
$$;

-- Can the current user administer this org? Member, municipality admin of a
-- linked municipality, or platform admin.
create or replace function public.can_admin_org(org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_platform_admin()
    or public.is_org_member(org)
    or exists (
      select 1
      from public.organization_municipalities om
      join public.municipality_admins ma on ma.municipality_id = om.municipality_id
      where om.organization_id = org and ma.user_id = auth.uid()
    );
$$;

revoke execute on function public.is_platform_admin() from public, anon;
grant execute on function public.is_platform_admin() to authenticated;
revoke execute on function public.is_municipality_admin(uuid) from public, anon;
grant execute on function public.is_municipality_admin(uuid) to authenticated;
revoke execute on function public.can_admin_org(uuid) from public, anon;
grant execute on function public.can_admin_org(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Registration RPC (replaces the simpler v1)
-- ---------------------------------------------------------------------------

drop function if exists public.create_organization(text, text, text, text, text);

create or replace function public.create_organization(
  p_name             text,
  p_municipality_ids uuid[],
  p_is_volunteer     boolean default false,
  p_org_number       text default null,
  p_description      text default null,
  p_website          text default null,
  p_email            text default null,
  p_phone            text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  base_slug text;
  final_slug text;
  n int := 0;
  muni uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if p_municipality_ids is null or array_length(p_municipality_ids, 1) is null then
    raise exception 'At least one municipality is required';
  end if;

  base_slug := regexp_replace(lower(coalesce(p_name, 'org')), '[^a-z0-9]+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  if base_slug = '' then base_slug := 'org'; end if;
  final_slug := base_slug;
  while exists (select 1 from public.organizations where slug = final_slug) loop
    n := n + 1;
    final_slug := base_slug || '-' || n;
  end loop;

  insert into public.organizations
    (name, slug, description, website, email, phone, org_number, is_volunteer,
     municipality_id, status)
  values
    (p_name, final_slug, p_description, p_website, p_email, p_phone, p_org_number,
     p_is_volunteer, p_municipality_ids[1], 'draft')
  returning id into new_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_id, auth.uid(), 'owner');

  foreach muni in array p_municipality_ids loop
    insert into public.organization_municipalities (organization_id, municipality_id)
    values (new_id, muni)
    on conflict do nothing;
  end loop;

  return new_id;
end;
$$;

revoke execute on function
  public.create_organization(text, uuid[], boolean, text, text, text, text, text)
  from public, anon;
grant execute on function
  public.create_organization(text, uuid[], boolean, text, text, text, text, text)
  to authenticated;

-- ---------------------------------------------------------------------------
-- RLS + grants for the new tables
-- ---------------------------------------------------------------------------

grant select, insert, delete on public.organization_municipalities to authenticated;
grant select on public.organization_municipalities to anon;
grant select on public.municipality_admins to authenticated;

alter table public.organization_municipalities enable row level security;
alter table public.municipality_admins enable row level security;

-- Org↔municipality links are public (used to show where an org is listed).
create policy "Public read org municipalities"
  on public.organization_municipalities for select using (true);
create policy "Members manage org municipalities"
  on public.organization_municipalities for all to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "Read own / all municipality admins"
  on public.municipality_admins for select to authenticated
  using (user_id = auth.uid() or public.is_platform_admin());

-- Organisations: admins (member / municipality / platform) can read + update.
-- Replaces the member-only org policies from 0007/0009.
drop policy "Members read own organization" on public.organizations;
drop policy "Members update own organization" on public.organizations;

create policy "Admins read managed organizations"
  on public.organizations for select to authenticated
  using (public.can_admin_org(id));
create policy "Admins update managed organizations"
  on public.organizations for update to authenticated
  using (public.can_admin_org(id)) with check (public.can_admin_org(id));
