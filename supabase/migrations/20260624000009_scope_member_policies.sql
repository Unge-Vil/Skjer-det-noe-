-- Scope member policies to the authenticated role.
--
-- RLS evaluates every permissive policy for the querying role. The member
-- policies call is_org_member(), but anon lacks EXECUTE on it (0008), so anon's
-- public reads failed with "permission denied for function is_org_member".
-- Restricting these policies to `authenticated` means anon only ever evaluates
-- the public-read policies. Public read of published rows is unchanged.

-- organizations
drop policy "Members read own organization" on public.organizations;
create policy "Members read own organization" on public.organizations
  for select to authenticated using (public.is_org_member(id));
drop policy "Members update own organization" on public.organizations;
create policy "Members update own organization" on public.organizations
  for update to authenticated
  using (public.is_org_member(id)) with check (public.is_org_member(id));

-- activities
drop policy "Members read own activities" on public.activities;
create policy "Members read own activities" on public.activities
  for select to authenticated using (public.is_org_member(organization_id));
drop policy "Members insert own activities" on public.activities;
create policy "Members insert own activities" on public.activities
  for insert to authenticated with check (public.is_org_member(organization_id));
drop policy "Members update own activities" on public.activities;
create policy "Members update own activities" on public.activities
  for update to authenticated
  using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
drop policy "Members delete own activities" on public.activities;
create policy "Members delete own activities" on public.activities
  for delete to authenticated using (public.is_org_member(organization_id));

-- events
drop policy "Members read own events" on public.events;
create policy "Members read own events" on public.events
  for select to authenticated using (public.is_org_member(organization_id));
drop policy "Members insert own events" on public.events;
create policy "Members insert own events" on public.events
  for insert to authenticated with check (public.is_org_member(organization_id));
drop policy "Members update own events" on public.events;
create policy "Members update own events" on public.events
  for update to authenticated
  using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
drop policy "Members delete own events" on public.events;
create policy "Members delete own events" on public.events
  for delete to authenticated using (public.is_org_member(organization_id));

-- memberships
drop policy "Members read memberships" on public.organization_members;
create policy "Members read memberships" on public.organization_members
  for select to authenticated
  using (user_id = auth.uid() or public.is_org_member(organization_id));
