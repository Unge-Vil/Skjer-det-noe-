create type public.listing_exception_kind as enum ('cancelled', 'closed', 'changed', 'notice');

create table public.listing_exceptions (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid references public.events(id) on delete cascade,
  activity_id      uuid references public.activities(id) on delete cascade,
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  occurrence_date  date not null,
  kind             public.listing_exception_kind not null,
  message          text,
  reason           text,
  start_time       time,
  end_time         time,
  source           text not null default 'manual',
  external_ref     text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint listing_exceptions_one_listing check ((event_id is not null) <> (activity_id is not null)),
  constraint listing_exceptions_time_pair check ((start_time is null) = (end_time is null)),
  constraint listing_exceptions_external_ref_unique unique (organization_id, source, external_ref)
);

create index listing_exceptions_event_date_idx on public.listing_exceptions (event_id, occurrence_date);
create index listing_exceptions_activity_date_idx on public.listing_exceptions (activity_id, occurrence_date);
create unique index listing_exceptions_event_date_unique on public.listing_exceptions (event_id, occurrence_date) where event_id is not null;
create unique index listing_exceptions_activity_date_unique on public.listing_exceptions (activity_id, occurrence_date) where activity_id is not null;

create trigger listing_exceptions_updated_at
  before update on public.listing_exceptions
  for each row execute function public.set_updated_at();

alter table public.listing_exceptions enable row level security;

create policy "Public read listing exceptions"
  on public.listing_exceptions for select
  using (
    (event_id is not null and exists (select 1 from public.events e where e.id = event_id and e.status = 'published'))
    or
    (activity_id is not null and exists (select 1 from public.activities a where a.id = activity_id and a.status = 'published'))
  );

create policy "Members manage organisation listing exceptions"
  on public.listing_exceptions for all
  using (exists (select 1 from public.organization_members m where m.organization_id = organization_id and m.user_id = auth.uid()))
  with check (exists (select 1 from public.organization_members m where m.organization_id = organization_id and m.user_id = auth.uid()));