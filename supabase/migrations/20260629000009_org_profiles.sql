-- First-class profiles. An organisation can have several profiles, including
-- more than one in the same municipality. A profile owns its listings and may
-- override any field from the master organisation (NULL = inherit). Evolves the
-- previous "department" concept (organization_municipalities), which stays as
-- the plain org↔municipality registration link.

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.org_profiles (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations(id) on delete cascade,
  municipality_id    uuid references public.municipalities(id) on delete set null,
  name               text not null,
  slug               text not null,
  description        text,
  description_en     text,
  description_doc    jsonb,
  description_doc_en jsonb,
  website            text,
  email              text,
  phone              text,
  address            text,
  logo_url           text,
  banner_url         text,
  social_links       jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (organization_id, slug)
);
create index org_profiles_org_idx on public.org_profiles (organization_id);
create index org_profiles_muni_idx on public.org_profiles (municipality_id);

create trigger set_updated_at before update on public.org_profiles
  for each row execute function public.set_updated_at();

-- Backfill: one profile per existing org×municipality link, reusing the link's
-- id so existing members/listings map across cleanly. Named + slugged after the
-- municipality (unique within an org at this point — one profile per muni).
insert into public.org_profiles
  (id, organization_id, municipality_id, name, slug, description, description_en,
   description_doc, description_doc_en, website, email, phone, address,
   logo_url, banner_url, social_links)
select
  om.id, om.organization_id, om.municipality_id,
  coalesce(m.name, 'Profil'),
  coalesce(nullif(trim(both '-' from regexp_replace(lower(translate(coalesce(m.name, 'profil'), 'æøå', 'aoa')), '[^a-z0-9]+', '-', 'g')), ''), 'profil'),
  om.description, om.description_en, om.description_doc, om.description_doc_en,
  om.website, om.email, om.phone, om.address, om.logo_url, om.banner_url, om.social_links
from public.organization_municipalities om
left join public.municipalities m on m.id = om.municipality_id;

-- ---------------------------------------------------------------------------
-- Profile members
-- ---------------------------------------------------------------------------

create table public.org_profile_members (
  profile_id uuid not null references public.org_profiles(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       public.org_role not null default 'editor',
  created_at timestamptz not null default now(),
  primary key (profile_id, user_id)
);
create index org_profile_members_user_idx on public.org_profile_members (user_id);

insert into public.org_profile_members (profile_id, user_id, role)
select om.id, omm.user_id, omm.role
from public.org_municipality_members omm
join public.organization_municipalities om
  on om.organization_id = omm.organization_id and om.municipality_id = omm.municipality_id;

-- ---------------------------------------------------------------------------
-- Listings belong to a profile
-- ---------------------------------------------------------------------------

alter table public.activities add column profile_id uuid references public.org_profiles(id) on delete set null;
alter table public.events     add column profile_id uuid references public.org_profiles(id) on delete set null;
create index activities_profile_idx on public.activities (profile_id);
create index events_profile_idx     on public.events (profile_id);

update public.activities a
set profile_id = p.id
from public.org_profiles p
where p.organization_id = a.organization_id and p.municipality_id is not distinct from a.municipality_id;

update public.events e
set profile_id = p.id
from public.org_profiles p
where p.organization_id = e.organization_id and p.municipality_id is not distinct from e.municipality_id;

-- ---------------------------------------------------------------------------
-- Role helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_profile_member(p_profile uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.org_profile_members
    where profile_id = p_profile and user_id = auth.uid()
  );
$$;

create or replace function public.can_admin_profile(p_profile uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_platform_admin()
    or public.is_profile_member(p_profile)
    or exists (
      select 1 from public.org_profiles pr
      where pr.id = p_profile
        and (
          public.is_org_member(pr.organization_id)
          or (pr.municipality_id is not null and public.is_municipality_admin(pr.municipality_id))
        )
    );
$$;

revoke execute on function public.is_profile_member(uuid) from public, anon;
grant execute on function public.is_profile_member(uuid) to authenticated;
revoke execute on function public.can_admin_profile(uuid) from public, anon;
grant execute on function public.can_admin_profile(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.org_profiles enable row level security;
alter table public.org_profile_members enable row level security;

grant select on public.org_profiles to anon, authenticated;
grant insert, update, delete on public.org_profiles to authenticated;
grant select on public.org_profile_members to authenticated;

create policy "Public read profiles"
  on public.org_profiles for select using (true);

create policy "Org members create profiles"
  on public.org_profiles for insert to authenticated
  with check (public.is_org_member(organization_id) or public.is_platform_admin());

create policy "Admins update profiles"
  on public.org_profiles for update to authenticated
  using (public.can_admin_profile(id)) with check (public.can_admin_profile(id));

create policy "Org members delete profiles"
  on public.org_profiles for delete to authenticated
  using (public.is_org_member(organization_id) or public.is_platform_admin());

create policy "Read profile memberships"
  on public.org_profile_members for select to authenticated
  using (user_id = auth.uid() or public.can_admin_profile(profile_id));

-- Profile admins manage that profile's listings (org members already manage all
-- of their org's listings via existing policies).
create policy "Profile admins manage activities"
  on public.activities for all to authenticated
  using (profile_id is not null and public.can_admin_profile(profile_id))
  with check (profile_id is not null and public.can_admin_profile(profile_id));

create policy "Profile admins manage events"
  on public.events for all to authenticated
  using (profile_id is not null and public.can_admin_profile(profile_id))
  with check (profile_id is not null and public.can_admin_profile(profile_id));

-- ---------------------------------------------------------------------------
-- Profile member management RPCs
-- ---------------------------------------------------------------------------

create or replace function public.list_profile_members(p_profile uuid)
returns table (user_id uuid, email text, role text)
language sql stable security definer set search_path = public, auth as $$
  select m.user_id, u.email::text, m.role::text
  from public.org_profile_members m
  join auth.users u on u.id = m.user_id
  where m.profile_id = p_profile and public.can_admin_profile(p_profile)
  order by u.email;
$$;

create or replace function public.add_profile_member(p_profile uuid, p_email text, p_role text default 'editor')
returns void language plpgsql security definer set search_path = public, auth as $$
declare uid uuid;
begin
  if not public.can_admin_profile(p_profile) then raise exception 'Not authorized'; end if;
  select id into uid from auth.users where lower(email) = lower(trim(p_email));
  if uid is null then raise exception 'No user with that email'; end if;
  insert into public.org_profile_members (profile_id, user_id, role)
  values (p_profile, uid, (case when p_role = 'owner' then 'owner' else 'editor' end)::public.org_role)
  on conflict (profile_id, user_id) do nothing;
end;
$$;

create or replace function public.remove_profile_member(p_profile uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can_admin_profile(p_profile) then raise exception 'Not authorized'; end if;
  delete from public.org_profile_members where profile_id = p_profile and user_id = p_user;
end;
$$;

revoke execute on function public.list_profile_members(uuid) from public, anon;
grant execute on function public.list_profile_members(uuid) to authenticated;
revoke execute on function public.add_profile_member(uuid, text, text) from public, anon;
grant execute on function public.add_profile_member(uuid, text, text) to authenticated;
revoke execute on function public.remove_profile_member(uuid, uuid) from public, anon;
grant execute on function public.remove_profile_member(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Co-organiser management: include profile admins
-- ---------------------------------------------------------------------------

drop policy "Editors manage activity co-orgs" on public.activity_co_organizers;
create policy "Editors manage activity co-orgs"
  on public.activity_co_organizers for all to authenticated
  using (exists (
    select 1 from public.activities a where a.id = activity_id and (
      public.is_org_member(a.organization_id)
      or (a.profile_id is not null and public.can_admin_profile(a.profile_id))
      or public.is_platform_admin()
    )
  ))
  with check (exists (
    select 1 from public.activities a where a.id = activity_id and (
      public.is_org_member(a.organization_id)
      or (a.profile_id is not null and public.can_admin_profile(a.profile_id))
      or public.is_platform_admin()
    )
  ));

drop policy "Editors manage event co-orgs" on public.event_co_organizers;
create policy "Editors manage event co-orgs"
  on public.event_co_organizers for all to authenticated
  using (exists (
    select 1 from public.events e where e.id = event_id and (
      public.is_org_member(e.organization_id)
      or (e.profile_id is not null and public.can_admin_profile(e.profile_id))
      or public.is_platform_admin()
    )
  ))
  with check (exists (
    select 1 from public.events e where e.id = event_id and (
      public.is_org_member(e.organization_id)
      or (e.profile_id is not null and public.can_admin_profile(e.profile_id))
      or public.is_platform_admin()
    )
  ));

-- ---------------------------------------------------------------------------
-- Registration also creates a default profile per municipality
-- ---------------------------------------------------------------------------

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
  muni_name text;
  prof_slug text;
  k int;
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

    select name into muni_name from public.municipalities where id = muni;
    prof_slug := coalesce(nullif(trim(both '-' from regexp_replace(lower(translate(coalesce(muni_name, 'profil'), 'æøå', 'aoa')), '[^a-z0-9]+', '-', 'g')), ''), 'profil');
    k := 0;
    while exists (select 1 from public.org_profiles where organization_id = new_id and slug = prof_slug) loop
      k := k + 1;
      prof_slug := prof_slug || '-' || k;
    end loop;

    insert into public.org_profiles (organization_id, municipality_id, name, slug)
    values (new_id, muni, coalesce(muni_name, 'Profil'), prof_slug);
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
