-- Row Level Security
--
-- Read access is public (anon) for reference data and *published* listings.
-- No write policies are defined, so inserts/updates/deletes are denied for
-- anon and authenticated roles; the service_role bypasses RLS for admin
-- tooling. A proper admin role + write policies come with the admin UI.

alter table public.municipalities enable row level security;
alter table public.categories     enable row level security;
alter table public.organizations  enable row level security;
alter table public.activities     enable row level security;
alter table public.events         enable row level security;

-- Reference data: fully public read.
create policy "Public read municipalities"
  on public.municipalities for select
  using (true);

create policy "Public read categories"
  on public.categories for select
  using (true);

-- Listings: only published rows are publicly visible.
create policy "Public read published organizations"
  on public.organizations for select
  using (status = 'published');

create policy "Public read published activities"
  on public.activities for select
  using (status = 'published');

create policy "Public read published events"
  on public.events for select
  using (status = 'published');
