-- Organisation member management RPCs (SECURITY DEFINER; gated by membership;
-- look up auth.users by email which the API roles can't read directly).

create or replace function public.list_org_members(p_org uuid)
returns table (user_id uuid, email text, role text)
language sql stable security definer set search_path = public, auth as $$
  select om.user_id, u.email::text, om.role::text
  from public.organization_members om
  join auth.users u on u.id = om.user_id
  where om.organization_id = p_org and public.is_org_member(p_org)
  order by u.email;
$$;

create or replace function public.add_org_member(p_org uuid, p_email text, p_role text default 'editor')
returns void language plpgsql security definer set search_path = public, auth as $$
declare
  uid uuid;
begin
  if not public.is_org_member(p_org) then raise exception 'Not authorized'; end if;
  select id into uid from auth.users where lower(email) = lower(trim(p_email));
  if uid is null then raise exception 'No user with that email'; end if;
  insert into public.organization_members (organization_id, user_id, role)
  values (p_org, uid, (case when p_role = 'owner' then 'owner' else 'editor' end)::public.org_role)
  on conflict (organization_id, user_id) do nothing;
end;
$$;

create or replace function public.remove_org_member(p_org uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_org_member(p_org) then raise exception 'Not authorized'; end if;
  delete from public.organization_members where organization_id = p_org and user_id = p_user;
end;
$$;

revoke execute on function public.list_org_members(uuid) from public, anon;
grant execute on function public.list_org_members(uuid) to authenticated;
revoke execute on function public.add_org_member(uuid, text, text) from public, anon;
grant execute on function public.add_org_member(uuid, text, text) to authenticated;
revoke execute on function public.remove_org_member(uuid, uuid) from public, anon;
grant execute on function public.remove_org_member(uuid, uuid) to authenticated;
