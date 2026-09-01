-- The "Members manage organisation listing exceptions" policy was created as
-- `for all` (i.e. it also applies to the `anon` role) with a USING clause that
-- calls public.is_org_member(). anon has no EXECUTE on is_org_member (revoked in
-- 20260624000007/000008), so when an anonymous visitor SELECTs listing_exceptions
-- Postgres still evaluates this policy's predicate and raises
-- "42501 permission denied for function is_org_member". That error poisons the
-- whole SELECT — even though "Public read listing exceptions" would have allowed
-- the row — which made the embedded listing_exceptions(...) join fail and every
-- activity/event detail page 404 for logged-out users.
--
-- Fix: scope the member-management policy to `authenticated`, matching the
-- pattern already used in 20260624000009_scope_member_policies.sql. Anonymous
-- reads then only hit "Public read listing exceptions" and never touch
-- is_org_member. Members (authenticated) keep full manage access.

drop policy if exists "Members manage organisation listing exceptions" on public.listing_exceptions;

create policy "Members manage organisation listing exceptions"
  on public.listing_exceptions for all
  to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));
