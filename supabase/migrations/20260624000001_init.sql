-- Skjer det noe — initial schema
-- Leisure-activity directory: municipalities, organizations, recurring
-- activities and one-off events, located via PostGIS for proximity search.

-- PostGIS for geography(Point) columns + distance queries.
create extension if not exists postgis with schema extensions;

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Publication state shared by listing tables.
create type public.listing_status as enum ('draft', 'published', 'archived');

-- ---------------------------------------------------------------------------
-- Municipalities (kommuner)
-- ---------------------------------------------------------------------------

create table public.municipalities (
  id              uuid primary key default gen_random_uuid(),
  kommunenummer   text not null unique,                 -- official 4-digit code
  name            text not null,
  county          text,                                 -- fylke
  slug            text not null unique,
  center          extensions.geography(Point, 4326),    -- default map center
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  icon        text,                                     -- emoji or icon name
  sort_order  smallint not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Organizations
-- ---------------------------------------------------------------------------

create table public.organizations (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  description     text,
  website         text,
  email           text,
  phone           text,
  municipality_id uuid references public.municipalities(id) on delete set null,
  address         text,
  location        extensions.geography(Point, 4326),
  logo_url        text,
  status          public.listing_status not null default 'published',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Activities (recurring — "faste aktiviteter")
-- ---------------------------------------------------------------------------

create table public.activities (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text not null unique,
  description     text,
  organization_id uuid references public.organizations(id) on delete set null,
  category_id     uuid references public.categories(id) on delete set null,
  municipality_id uuid references public.municipalities(id) on delete set null,
  address         text,
  location        extensions.geography(Point, 4326),
  -- recurrence
  weekday         smallint check (weekday between 0 and 6),  -- 0=Sun .. 6=Sat
  start_time      time,
  end_time        time,
  recurrence_note text,                                       -- e.g. "Annenhver tirsdag"
  -- audience
  age_min         smallint,
  age_max         smallint,
  price           text,                                       -- "Gratis", "50 kr"
  url             text,
  image_url       text,
  status          public.listing_status not null default 'published',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Events (one-off — "eventer")
-- ---------------------------------------------------------------------------

create table public.events (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text not null unique,
  description     text,
  organization_id uuid references public.organizations(id) on delete set null,
  category_id     uuid references public.categories(id) on delete set null,
  municipality_id uuid references public.municipalities(id) on delete set null,
  address         text,
  location        extensions.geography(Point, 4326),
  starts_at       timestamptz not null,
  ends_at         timestamptz,
  age_min         smallint,
  age_max         smallint,
  price           text,
  url             text,
  image_url       text,
  status          public.listing_status not null default 'published',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index organizations_location_idx on public.organizations using gist (location);
create index activities_location_idx    on public.activities    using gist (location);
create index events_location_idx        on public.events        using gist (location);

create index activities_municipality_idx on public.activities (municipality_id);
create index events_municipality_idx     on public.events (municipality_id);
create index activities_category_idx     on public.activities (category_id);
create index events_category_idx         on public.events (category_id);
create index events_starts_at_idx        on public.events (starts_at);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create trigger set_updated_at before update on public.municipalities
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.activities
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.events
  for each row execute function public.set_updated_at();
