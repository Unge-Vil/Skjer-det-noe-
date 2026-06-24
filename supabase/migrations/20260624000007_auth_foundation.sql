-- Auth foundation for organisation admin.
--
-- Adds user profiles, organisation membership, and write RLS so signed-in org
-- members can manage *their* organisation + its activities/events. New orgs are
-- created via create_organization() with status 'draft' (pending municipality
-- approval); approved (published) orgs self-publish their own listings.

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Organisation membership
-- ---------------------------------------------------------------------------

create type public.org_role as enum ('owner', 'editor');

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            public.org_role not null default 'owner',
  created_at      timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index organization_members_user_idx on public.organization_members (user_id);

-- Is the current user a member of the given org? SECURITY DEFINER so it can be
-- used inside RLS policies without recursing through organization_members' RLS.
create or replace function public.is_org_member(org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = org
      and user_id = auth.uid()
  );
$$;

revoke execute on function public.is_org_member(uuid) from anon;
grant execute on function public.is_org_member(uuid) to authenticated;

-- Self-registration: create an organisation (as draft) and make the caller its
-- owner, atomically. Returns the new organisation id.
create or replace function public.create_organization(
  p_name        text,
  p_description text default null,
  p_website     text default null,
  p_email       text default null,
  p_phone       text default null
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
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  base_slug := regexp_replace(lower(coalesce(p_name, 'org')), '[^a-z0-9]+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  if base_slug = '' then base_slug := 'org'; end if;
  final_slug := base_slug;
  while exists (select 1 from public.organizations where slug = final_slug) loop
    n := n + 1;
    final_slug := base_slug || '-' || n;
  end loop;

  insert into public.organizations (name, slug, description, website, email, phone, status)
  values (p_name, final_slug, p_description, p_website, p_email, p_phone, 'draft')
  returning id into new_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_id, auth.uid(), 'owner');

  return new_id;
end;
$$;

revoke execute on function public.create_organization(text, text, text, text, text) from anon;
grant execute on function public.create_organization(text, text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles            enable row level security;
alter table public.organization_members enable row level security;

-- Profiles: users see and edit only their own.
create policy "Users read own profile"
  on public.profiles for select
  using (id = auth.uid());
create policy "Users update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Membership: a user sees their own memberships and co-members of their orgs.
create policy "Members read memberships"
  on public.organization_members for select
  using (user_id = auth.uid() or public.is_org_member(organization_id));

-- Organisations: members can see (incl. draft) and edit their own org.
create policy "Members read own organization"
  on public.organizations for select
  using (public.is_org_member(id));
create policy "Members update own organization"
  on public.organizations for update
  using (public.is_org_member(id))
  with check (public.is_org_member(id));

-- Activities: org members have full control over their org's activities.
create policy "Members read own activities"
  on public.activities for select
  using (public.is_org_member(organization_id));
create policy "Members insert own activities"
  on public.activities for insert
  with check (public.is_org_member(organization_id));
create policy "Members update own activities"
  on public.activities for update
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));
create policy "Members delete own activities"
  on public.activities for delete
  using (public.is_org_member(organization_id));

-- Events: same.
create policy "Members read own events"
  on public.events for select
  using (public.is_org_member(organization_id));
create policy "Members insert own events"
  on public.events for insert
  with check (public.is_org_member(organization_id));
create policy "Members update own events"
  on public.events for update
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));
create policy "Members delete own events"
  on public.events for delete
  using (public.is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- Grants (RLS still governs rows)
-- ---------------------------------------------------------------------------

grant select, update on public.profiles to authenticated;
grant select on public.organization_members to authenticated;
grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.activities to authenticated;
grant select, insert, update, delete on public.events to authenticated;
