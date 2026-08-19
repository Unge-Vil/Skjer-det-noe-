-- Owners manage memberships and integrations. Editors retain content editing
-- through the existing is_org_member/is_profile_member policies.

create or replace function public.is_org_owner(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = p_org
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

create or replace function public.is_profile_owner(p_profile uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.org_profile_members
    where profile_id = p_profile
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

revoke execute on function public.is_org_owner(uuid) from public, anon;
grant execute on function public.is_org_owner(uuid) to authenticated;
revoke execute on function public.is_profile_owner(uuid) from public, anon;
grant execute on function public.is_profile_owner(uuid) to authenticated;

create or replace function public.list_org_members(p_org uuid)
returns table (user_id uuid, email text, role text)
language sql
stable
security definer
set search_path = public, auth
as $$
  select om.user_id, u.email::text, om.role::text
  from public.organization_members om
  join auth.users u on u.id = om.user_id
  where om.organization_id = p_org
    and (public.is_org_owner(p_org) or public.is_platform_admin())
  order by u.email;
$$;

create or replace function public.add_org_member(
  p_org uuid,
  p_email text,
  p_role text default 'editor'
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid;
begin
  if not public.is_org_owner(p_org) and not public.is_platform_admin() then
    raise exception 'Not authorized';
  end if;

  select id into uid from auth.users where lower(email) = lower(trim(p_email));
  if uid is null then raise exception 'No user with that email'; end if;

  insert into public.organization_members (organization_id, user_id, role)
  values (
    p_org,
    uid,
    (case when p_role = 'owner' then 'owner' else 'editor' end)::public.org_role
  )
  on conflict (organization_id, user_id) do nothing;
end;
$$;

create or replace function public.remove_org_member(p_org uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_org_owner(p_org) and not public.is_platform_admin() then
    raise exception 'Not authorized';
  end if;

  delete from public.organization_members
  where organization_id = p_org and user_id = p_user;
end;
$$;

create or replace function public.can_manage_profile_members(p_profile uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_admin()
    or public.is_profile_owner(p_profile)
    or exists (
      select 1
      from public.org_profiles p
      where p.id = p_profile and public.is_org_owner(p.organization_id)
    );
$$;

revoke execute on function public.can_manage_profile_members(uuid) from public, anon;
grant execute on function public.can_manage_profile_members(uuid) to authenticated;

create or replace function public.list_profile_members(p_profile uuid)
returns table (user_id uuid, email text, role text)
language sql
stable
security definer
set search_path = public, auth
as $$
  select m.user_id, u.email::text, m.role::text
  from public.org_profile_members m
  join auth.users u on u.id = m.user_id
  where m.profile_id = p_profile
    and public.can_manage_profile_members(p_profile)
  order by u.email;
$$;

create or replace function public.add_profile_member(
  p_profile uuid,
  p_email text,
  p_role text default 'editor'
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid;
begin
  if not public.can_manage_profile_members(p_profile) then
    raise exception 'Not authorized';
  end if;

  select id into uid from auth.users where lower(email) = lower(trim(p_email));
  if uid is null then raise exception 'No user with that email'; end if;

  insert into public.org_profile_members (profile_id, user_id, role)
  values (
    p_profile,
    uid,
    (case when p_role = 'owner' then 'owner' else 'editor' end)::public.org_role
  )
  on conflict (profile_id, user_id) do nothing;
end;
$$;

create or replace function public.remove_profile_member(
  p_profile uuid,
  p_user uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_manage_profile_members(p_profile) then
    raise exception 'Not authorized';
  end if;

  delete from public.org_profile_members
  where profile_id = p_profile and user_id = p_user;
end;
$$;

create or replace function public.protect_last_org_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role <> 'owner' or (tg_op = 'UPDATE' and new.role = 'owner') then
    return coalesce(new, old);
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('organization-owner:' || old.organization_id::text, 0)
  );

  if exists (select 1 from public.organizations where id = old.organization_id)
     and not exists (
       select 1
       from public.organization_members
       where organization_id = old.organization_id
         and role = 'owner'
         and user_id <> old.user_id
     ) then
    raise exception 'Cannot remove the last organization owner';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger protect_last_org_owner
  before update of role or delete on public.organization_members
  for each row execute function public.protect_last_org_owner();

create or replace function public.protect_last_profile_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role <> 'owner' or (tg_op = 'UPDATE' and new.role = 'owner') then
    return coalesce(new, old);
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('profile-owner:' || old.profile_id::text, 0)
  );

  if exists (select 1 from public.org_profiles where id = old.profile_id)
     and not exists (
       select 1
       from public.org_profile_members
       where profile_id = old.profile_id
         and role = 'owner'
         and user_id <> old.user_id
     ) then
    raise exception 'Cannot remove the last profile owner';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger protect_last_profile_owner
  before update of role or delete on public.org_profile_members
  for each row execute function public.protect_last_profile_owner();

drop policy "Org members read own api keys" on public.api_keys;
drop policy "Org members create own api keys" on public.api_keys;
drop policy "Org members update own api keys" on public.api_keys;

create policy "Org owners read api keys"
  on public.api_keys for select to authenticated
  using (public.is_org_owner(organization_id) or public.is_platform_admin());
create policy "Org owners create api keys"
  on public.api_keys for insert to authenticated
  with check (public.is_org_owner(organization_id) or public.is_platform_admin());
create policy "Org owners update api keys"
  on public.api_keys for update to authenticated
  using (public.is_org_owner(organization_id) or public.is_platform_admin())
  with check (public.is_org_owner(organization_id) or public.is_platform_admin());

drop policy "Org members read own feeds" on public.calendar_feeds;
drop policy "Org members create own feeds" on public.calendar_feeds;
drop policy "Org members update own feeds" on public.calendar_feeds;
drop policy "Org members delete own feeds" on public.calendar_feeds;

create policy "Org owners read feeds"
  on public.calendar_feeds for select to authenticated
  using (public.is_org_owner(organization_id) or public.is_platform_admin());
create policy "Org owners create feeds"
  on public.calendar_feeds for insert to authenticated
  with check (public.is_org_owner(organization_id) or public.is_platform_admin());
create policy "Org owners update feeds"
  on public.calendar_feeds for update to authenticated
  using (public.is_org_owner(organization_id) or public.is_platform_admin())
  with check (public.is_org_owner(organization_id) or public.is_platform_admin());
create policy "Org owners delete feeds"
  on public.calendar_feeds for delete to authenticated
  using (public.is_org_owner(organization_id) or public.is_platform_admin());