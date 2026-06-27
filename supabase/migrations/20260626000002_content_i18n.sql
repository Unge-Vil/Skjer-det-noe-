-- Multilingual content (Norwegian default + optional English) and
-- per-municipality profile overrides.
--
-- #3: add *_en columns alongside the Norwegian text (nb stays required, en
--     optional). Effective text = en when present for the English locale, else nb.
-- #2: organization_municipalities gets optional description overrides; the
--     effective org profile in a municipality is the override when set, else the
--     global organisations.description(_en).

alter table public.activities
  add column title_en text,
  add column description_en text;

alter table public.events
  add column title_en text,
  add column description_en text;

alter table public.organizations
  add column description_en text;

alter table public.organization_municipalities
  add column description text,
  add column description_en text;

-- Recreate the proximity RPCs to also return the English columns (the frontend
-- picks the locale and falls back to Norwegian).
drop function if exists public.nearby_activities(double precision, double precision, integer, text, text);
create function public.nearby_activities(
  p_lat          double precision,
  p_lng          double precision,
  p_radius_m     integer default 10000,
  p_category     text default null,
  p_municipality text default null
)
returns table (
  id uuid, title text, title_en text, slug text, description text, description_en text,
  organization_name text, category_slug text, municipality_name text, address text,
  lat double precision, lng double precision,
  weekday smallint, start_time time, end_time time, recurrence_note text,
  age_min smallint, age_max smallint, price text, url text, image_url text,
  distance_m double precision
)
language sql stable set search_path = public, extensions
as $$
  select
    a.id, a.title, a.title_en, a.slug, a.description, a.description_en,
    o.name, c.slug, m.name, a.address,
    st_y(a.location::geometry), st_x(a.location::geometry),
    a.weekday, a.start_time, a.end_time, a.recurrence_note,
    a.age_min, a.age_max, a.price, a.url, a.image_url,
    st_distance(a.location, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography) as distance_m
  from public.activities a
  left join public.organizations o on o.id = a.organization_id
  left join public.categories    c on c.id = a.category_id
  left join public.municipalities m on m.id = a.municipality_id
  where a.status = 'published' and a.location is not null
    and st_dwithin(a.location, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography, p_radius_m)
    and (p_category is null or c.slug = p_category)
    and (p_municipality is null or m.kommunenummer = p_municipality)
  order by distance_m asc;
$$;

drop function if exists public.nearby_events(double precision, double precision, integer, text, text);
create function public.nearby_events(
  p_lat          double precision,
  p_lng          double precision,
  p_radius_m     integer default 10000,
  p_category     text default null,
  p_municipality text default null
)
returns table (
  id uuid, title text, title_en text, slug text, description text, description_en text,
  organization_name text, category_slug text, municipality_name text, address text,
  lat double precision, lng double precision,
  starts_at timestamptz, ends_at timestamptz,
  age_min smallint, age_max smallint, price text, url text, image_url text,
  distance_m double precision
)
language sql stable set search_path = public, extensions
as $$
  select
    e.id, e.title, e.title_en, e.slug, e.description, e.description_en,
    o.name, c.slug, m.name, e.address,
    st_y(e.location::geometry), st_x(e.location::geometry),
    e.starts_at, e.ends_at,
    e.age_min, e.age_max, e.price, e.url, e.image_url,
    st_distance(e.location, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography) as distance_m
  from public.events e
  left join public.organizations o on o.id = e.organization_id
  left join public.categories    c on c.id = e.category_id
  left join public.municipalities m on m.id = e.municipality_id
  where e.status = 'published' and e.location is not null
    and coalesce(e.ends_at, e.starts_at) >= now()
    and st_dwithin(e.location, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography, p_radius_m)
    and (p_category is null or c.slug = p_category)
    and (p_municipality is null or m.kommunenummer = p_municipality)
  order by e.starts_at asc, distance_m asc;
$$;

grant execute on function public.nearby_activities(double precision, double precision, integer, text, text) to anon, authenticated;
grant execute on function public.nearby_events(double precision, double precision, integer, text, text) to anon, authenticated;
