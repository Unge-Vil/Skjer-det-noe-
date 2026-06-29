-- Co-organisers on listings, and department-scoped listing management.
--
-- (1) Activities/events can name other organisations as co-organisers
--     ("medarrangør"). Public read; managed by anyone who can edit the listing.
-- (2) Department members (people who administer one org × municipality) can
--     create and edit that org's listings in their municipality.

-- ---------------------------------------------------------------------------
-- Department members manage their org's listings in their municipality
-- ---------------------------------------------------------------------------

create policy "Department members manage activities"
  on public.activities for all to authenticated
  using (public.is_department_member(organization_id, municipality_id) or public.is_platform_admin())
  with check (public.is_department_member(organization_id, municipality_id) or public.is_platform_admin());

create policy "Department members manage events"
  on public.events for all to authenticated
  using (public.is_department_member(organization_id, municipality_id) or public.is_platform_admin())
  with check (public.is_department_member(organization_id, municipality_id) or public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Co-organisers
-- ---------------------------------------------------------------------------

create table public.activity_co_organizers (
  activity_id     uuid not null references public.activities(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  primary key (activity_id, organization_id)
);
create index activity_co_organizers_org_idx on public.activity_co_organizers (organization_id);

create table public.event_co_organizers (
  event_id        uuid not null references public.events(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  primary key (event_id, organization_id)
);
create index event_co_organizers_org_idx on public.event_co_organizers (organization_id);

alter table public.activity_co_organizers enable row level security;
alter table public.event_co_organizers enable row level security;

grant select on public.activity_co_organizers to anon, authenticated;
grant select on public.event_co_organizers to anon, authenticated;
grant insert, delete on public.activity_co_organizers to authenticated;
grant insert, delete on public.event_co_organizers to authenticated;

-- Public read (co-organisers are shown on the public listing).
create policy "Public read activity co-orgs"
  on public.activity_co_organizers for select using (true);
create policy "Public read event co-orgs"
  on public.event_co_organizers for select using (true);

-- Whoever can edit the listing can manage its co-organisers.
create policy "Editors manage activity co-orgs"
  on public.activity_co_organizers for all to authenticated
  using (
    exists (
      select 1 from public.activities a
      where a.id = activity_id and (
        public.is_org_member(a.organization_id)
        or public.is_department_member(a.organization_id, a.municipality_id)
        or public.is_platform_admin()
      )
    )
  )
  with check (
    exists (
      select 1 from public.activities a
      where a.id = activity_id and (
        public.is_org_member(a.organization_id)
        or public.is_department_member(a.organization_id, a.municipality_id)
        or public.is_platform_admin()
      )
    )
  );

create policy "Editors manage event co-orgs"
  on public.event_co_organizers for all to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id and (
        public.is_org_member(e.organization_id)
        or public.is_department_member(e.organization_id, e.municipality_id)
        or public.is_platform_admin()
      )
    )
  )
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_id and (
        public.is_org_member(e.organization_id)
        or public.is_department_member(e.organization_id, e.municipality_id)
        or public.is_platform_admin()
      )
    )
  );
