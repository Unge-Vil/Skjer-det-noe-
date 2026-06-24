-- Lock down function EXECUTE grants (security advisors 0028/0029).
-- Postgres grants EXECUTE to PUBLIC by default, so revoking from anon alone
-- isn't enough — revoke from PUBLIC, then grant only where needed.

-- Trigger-only functions: never called directly via the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- Helper used inside RLS + the self-registration RPC: signed-in users only.
revoke execute on function public.is_org_member(uuid) from public, anon;
grant execute on function public.is_org_member(uuid) to authenticated;

revoke execute on function public.create_organization(text, text, text, text, text) from public, anon;
grant execute on function public.create_organization(text, text, text, text, text) to authenticated;
