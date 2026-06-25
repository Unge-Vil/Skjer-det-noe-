-- Platform-admin RPCs for managing municipality admins.
-- All are SECURITY DEFINER and gated by is_platform_admin(); they look up
-- auth.users by email, which the API roles can't read directly.

create or replace function public.list_municipality_admins()
returns table (
  municipality_id uuid,
  municipality_name text,
  user_id uuid,
  email text
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select ma.municipality_id, m.name, ma.user_id, u.email::text
  from public.municipality_admins ma
  join public.municipalities m on m.id = ma.municipality_id
  join auth.users u on u.id = ma.user_id
  where public.is_platform_admin()
  order by m.name;
$$;

create or replace function public.add_municipality_admin(
  p_municipality_id uuid,
  p_email text
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'Not authorized';
  end if;
  select id into uid from auth.users where lower(email) = lower(trim(p_email));
  if uid is null then
    raise exception 'No user with that email';
  end if;
  insert into public.municipality_admins (municipality_id, user_id)
  values (p_municipality_id, uid)
  on conflict do nothing;
end;
$$;

create or replace function public.remove_municipality_admin(
  p_municipality_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Not authorized';
  end if;
  delete from public.municipality_admins
  where municipality_id = p_municipality_id and user_id = p_user_id;
end;
$$;

revoke execute on function public.list_municipality_admins() from public, anon;
grant execute on function public.list_municipality_admins() to authenticated;
revoke execute on function public.add_municipality_admin(uuid, text) from public, anon;
grant execute on function public.add_municipality_admin(uuid, text) to authenticated;
revoke execute on function public.remove_municipality_admin(uuid, uuid) from public, anon;
grant execute on function public.remove_municipality_admin(uuid, uuid) to authenticated;
