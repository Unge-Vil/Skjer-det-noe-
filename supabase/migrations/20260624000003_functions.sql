-- Proximity search RPCs
--
-- Called from the client/server via PostgREST (supabase.rpc(...)). They run
-- with the caller's role, so RLS still applies (only published rows returned).
-- Coordinates are returned as plain lat/lng so the frontend never needs PostGIS.

-- Recurring activities within p_radius_m of (p_lat, p_lng), nearest first.
create or replace function public.nearby_activities(
  p_lat          double precision,
  p_lng          double precision,
  p_radius_m     integer default 10000,
  p_category     text default null,
  p_municipality text default null
)
returns table (
  id                uuid,
  title             text,
  slug              text,
  description       text,
  organization_name text,
  category_slug     text,
  municipality_name text,
  address           text,
  lat               double precision,
  lng               double precision,
  weekday           smallint,
  start_time        time,
  end_time          time,
  recurrence_note   text,
  age_min           smallint,
  age_max           smallint,
  price             text,
  url               text,
  image_url         text,
  distance_m        double precision
)
language sql
stable
set search_path = public, extensions
as $$
  select
    a.id, a.title, a.slug, a.description,
    o.name as organization_name,
    c.slug as category_slug,
    m.name as municipality_name,
    a.address,
    st_y(a.location::geometry) as lat,
    st_x(a.location::geometry) as lng,
    a.weekday, a.start_time, a.end_time, a.recurrence_note,
    a.age_min, a.age_max, a.price, a.url, a.image_url,
    st_distance(
      a.location,
      st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography
    ) as distance_m
  from public.activities a
  left join public.organizations o on o.id = a.organization_id
  left join public.categories    c on c.id = a.category_id
  left join public.municipalities m on m.id = a.municipality_id
  where a.status = 'published'
    and a.location is not null
    and st_dwithin(
      a.location,
      st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
      p_radius_m
    )
    and (p_category is null or c.slug = p_category)
    and (p_municipality is null or m.kommunenummer = p_municipality)
  order by distance_m asc;
$$;

-- Upcoming one-off events within p_radius_m of (p_lat, p_lng), nearest first.
create or replace function public.nearby_events(
  p_lat          double precision,
  p_lng          double precision,
  p_radius_m     integer default 10000,
  p_category     text default null,
  p_municipality text default null
)
returns table (
  id                uuid,
  title             text,
  slug              text,
  description       text,
  organization_name text,
  category_slug     text,
  municipality_name text,
  address           text,
  lat               double precision,
  lng               double precision,
  starts_at         timestamptz,
  ends_at           timestamptz,
  age_min           smallint,
  age_max           smallint,
  price             text,
  url               text,
  image_url         text,
  distance_m        double precision
)
language sql
stable
set search_path = public, extensions
as $$
  select
    e.id, e.title, e.slug, e.description,
    o.name as organization_name,
    c.slug as category_slug,
    m.name as municipality_name,
    e.address,
    st_y(e.location::geometry) as lat,
    st_x(e.location::geometry) as lng,
    e.starts_at, e.ends_at,
    e.age_min, e.age_max, e.price, e.url, e.image_url,
    st_distance(
      e.location,
      st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography
    ) as distance_m
  from public.events e
  left join public.organizations o on o.id = e.organization_id
  left join public.categories    c on c.id = e.category_id
  left join public.municipalities m on m.id = e.municipality_id
  where e.status = 'published'
    and e.location is not null
    and coalesce(e.ends_at, e.starts_at) >= now()
    and st_dwithin(
      e.location,
      st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
      p_radius_m
    )
    and (p_category is null or c.slug = p_category)
    and (p_municipality is null or m.kommunenummer = p_municipality)
  order by e.starts_at asc, distance_m asc;
$$;

grant execute on function public.nearby_activities(double precision, double precision, integer, text, text) to anon, authenticated;
grant execute on function public.nearby_events(double precision, double precision, integer, text, text) to anon, authenticated;

-- Municipalities with their center exposed as plain lat/lng (so the frontend
-- can recenter the map without parsing PostGIS geometry). security_invoker so
-- the underlying table's RLS (public read) applies.
create or replace view public.municipalities_view
with (security_invoker = true) as
  select
    id,
    kommunenummer,
    name,
    county,
    slug,
    extensions.st_y(center::extensions.geometry) as lat,
    extensions.st_x(center::extensions.geometry) as lng
  from public.municipalities;

grant select on public.municipalities_view to anon, authenticated;
