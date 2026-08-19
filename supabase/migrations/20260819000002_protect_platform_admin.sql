-- Prevent users from changing privileged profile fields through the regular
-- profile update policy.
revoke update on table public.profiles from authenticated;
grant update (full_name) on table public.profiles to authenticated;

create or replace function public.set_platform_admin(
  p_user_id uuid,
  p_is_platform_admin boolean
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

  update public.profiles
  set is_platform_admin = p_is_platform_admin
  where id = p_user_id;

  if not found then
    raise exception 'Profile not found';
  end if;
end;
$$;

revoke execute on function public.set_platform_admin(uuid, boolean) from public, anon;
grant execute on function public.set_platform_admin(uuid, boolean) to authenticated;