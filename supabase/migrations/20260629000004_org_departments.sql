-- First-class "departments": one profile per (organisation × municipality).
-- An organisation can run a department in each municipality it serves; each
-- department may have its own admins and may override any profile field. A NULL
-- override means "inherit dynamically from the master organisation" (the
-- default). Built on the existing organization_municipalities link table.

-- ---------------------------------------------------------------------------
-- Department profiles: surrogate id + per-field overrides
-- ---------------------------------------------------------------------------

alter table public.organization_municipalities
  add column id uuid not null default gen_random_uuid();
alter table public.organization_municipalities
  add constraint organization_municipalities_id_key unique (id);

-- Per-field overrides. NULL = inherit the master organisation's value.
-- (description / description_en already exist from the i18n migration.)
alter table public.organization_municipalities
  add column website      text,
  add column email        text,
  add column phone        text,
  add column address      text,
  add column logo_url     text,
  add column banner_url   text,
  add column social_links jsonb;

-- ---------------------------------------------------------------------------
-- Department membership (people who administer a single department)
-- ---------------------------------------------------------------------------

create table public.org_municipality_members (
  organization_id uuid not null,
  municipality_id uuid not null,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            public.org_role not null default 'editor',
  created_at      timestamptz not null default now(),
  primary key (organization_id, municipality_id, user_id),
  foreign key (organization_id, municipality_id)
    references public.organization_municipalities(organization_id, municipality_id)
    on delete cascade
);
create index org_municipality_members_user_idx on public.org_municipality_members (user_id);

-- ---------------------------------------------------------------------------
-- Role helpers (SECURITY DEFINER; authenticated only)
-- ---------------------------------------------------------------------------

create or replace function public.is_department_member(p_org uuid, p_muni uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.org_municipality_members
    where organization_id = p_org and municipality_id = p_muni and user_id = auth.uid()
  );
$$;

-- Master org members, the municipality's admin, platform admins, and the
-- department's own members may all administer a department.
create or replace function public.can_admin_department(p_org uuid, p_muni uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_platform_admin()
    or public.is_org_member(p_org)
    or public.is_municipality_admin(p_muni)
    or public.is_department_member(p_org, p_muni);
$$;

revoke execute on function public.is_department_member(uuid, uuid) from public, anon;
grant execute on function public.is_department_member(uuid, uuid) to authenticated;
revoke execute on function public.can_admin_department(uuid, uuid) from public, anon;
grant execute on function public.can_admin_department(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

-- Department admins (not just master members) may update their department row.
create policy "Department admins update profile"
  on public.organization_municipalities for update to authenticated
  using (public.can_admin_department(organization_id, municipality_id))
  with check (public.can_admin_department(organization_id, municipality_id));

-- Department-only admins must be able to read their parent organisation to see
-- the master values they inherit from.
create policy "Department members read parent org"
  on public.organizations for select to authenticated
  using (
    exists (
      select 1 from public.org_municipality_members m
      where m.organization_id = id and m.user_id = auth.uid()
    )
  );

alter table public.org_municipality_members enable row level security;
grant select on public.org_municipality_members to authenticated;

create policy "Read department memberships"
  on public.org_municipality_members for select to authenticated
  using (user_id = auth.uid() or public.can_admin_department(organization_id, municipality_id));

-- ---------------------------------------------------------------------------
-- Department member management RPCs (look up auth.users by email)
-- ---------------------------------------------------------------------------

create or replace function public.list_department_members(p_org uuid, p_muni uuid)
returns table (user_id uuid, email text, role text)
language sql stable security definer set search_path = public, auth as $$
  select m.user_id, u.email::text, m.role::text
  from public.org_municipality_members m
  join auth.users u on u.id = m.user_id
  where m.organization_id = p_org and m.municipality_id = p_muni
    and public.can_admin_department(p_org, p_muni)
  order by u.email;
$$;

create or replace function public.add_department_member(
  p_org uuid, p_muni uuid, p_email text, p_role text default 'editor'
)
returns void language plpgsql security definer set search_path = public, auth as $$
declare uid uuid;
begin
  if not public.can_admin_department(p_org, p_muni) then
    raise exception 'Not authorized';
  end if;
  if not exists (
    select 1 from public.organization_municipalities
    where organization_id = p_org and municipality_id = p_muni
  ) then
    raise exception 'Department does not exist';
  end if;
  select id into uid from auth.users where lower(email) = lower(trim(p_email));
  if uid is null then raise exception 'No user with that email'; end if;
  insert into public.org_municipality_members (organization_id, municipality_id, user_id, role)
  values (p_org, p_muni, uid, (case when p_role = 'owner' then 'owner' else 'editor' end)::public.org_role)
  on conflict (organization_id, municipality_id, user_id) do nothing;
end;
$$;

create or replace function public.remove_department_member(
  p_org uuid, p_muni uuid, p_user uuid
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can_admin_department(p_org, p_muni) then
    raise exception 'Not authorized';
  end if;
  delete from public.org_municipality_members
  where organization_id = p_org and municipality_id = p_muni and user_id = p_user;
end;
$$;

revoke execute on function public.list_department_members(uuid, uuid) from public, anon;
grant execute on function public.list_department_members(uuid, uuid) to authenticated;
revoke execute on function public.add_department_member(uuid, uuid, text, text) from public, anon;
grant execute on function public.add_department_member(uuid, uuid, text, text) to authenticated;
revoke execute on function public.remove_department_member(uuid, uuid, uuid) from public, anon;
grant execute on function public.remove_department_member(uuid, uuid, uuid) to authenticated;
