-- GDPR: let a signed-in user delete their own account. Removing the auth.users
-- row cascades to profiles, organisation/municipality/department memberships
-- (all FK ON DELETE CASCADE). Listings owned by organisations are unaffected.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
