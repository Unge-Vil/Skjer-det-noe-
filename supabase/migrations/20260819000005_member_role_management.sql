create or replace function public.update_org_member_role(
  p_org uuid,
  p_user uuid,
  p_role public.org_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_org_owner(p_org) and not public.is_platform_admin() then
    raise exception 'Not authorized';
  end if;

  update public.organization_members
     set role = p_role
   where organization_id = p_org and user_id = p_user;

  if not found then raise exception 'Member not found'; end if;
end;
$$;

create or replace function public.update_profile_member_role(
  p_profile uuid,
  p_user uuid,
  p_role public.org_role
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

  update public.org_profile_members
     set role = p_role
   where profile_id = p_profile and user_id = p_user;

  if not found then raise exception 'Member not found'; end if;
end;
$$;

revoke execute on function public.update_org_member_role(uuid, uuid, public.org_role) from public, anon;
grant execute on function public.update_org_member_role(uuid, uuid, public.org_role) to authenticated;
revoke execute on function public.update_profile_member_role(uuid, uuid, public.org_role) from public, anon;
grant execute on function public.update_profile_member_role(uuid, uuid, public.org_role) to authenticated;