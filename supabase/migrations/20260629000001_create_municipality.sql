-- Platform-admin RPC to create new municipalities.
-- Municipalities are no longer only seeded — a platform admin can add one from
-- the dashboard. SECURITY DEFINER + gated on is_platform_admin(); auto-slugs
-- from the name and optionally sets the default map center.

create or replace function public.create_municipality(
  p_kommunenummer text,
  p_name          text,
  p_county        text default null,
  p_lat           double precision default null,
  p_lng           double precision default null
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_id     uuid;
  base_slug  text;
  final_slug text;
  n int := 0;
begin
  if not public.is_platform_admin() then
    raise exception 'Not authorized';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Name required';
  end if;
  if coalesce(trim(p_kommunenummer), '') = '' then
    raise exception 'Kommunenummer required';
  end if;

  base_slug := regexp_replace(lower(p_name), '[^a-z0-9]+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  if base_slug = '' then base_slug := 'kommune'; end if;
  final_slug := base_slug;
  while exists (select 1 from public.municipalities where slug = final_slug) loop
    n := n + 1;
    final_slug := base_slug || '-' || n;
  end loop;

  insert into public.municipalities (kommunenummer, name, county, slug, center)
  values (
    trim(p_kommunenummer),
    trim(p_name),
    nullif(trim(coalesce(p_county, '')), ''),
    final_slug,
    case
      when p_lat is not null and p_lng is not null
        then extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography
      else null
    end
  )
  returning id into new_id;

  return new_id;
end;
$$;

revoke execute on function
  public.create_municipality(text, text, text, double precision, double precision)
  from public, anon;
grant execute on function
  public.create_municipality(text, text, text, double precision, double precision)
  to authenticated;
