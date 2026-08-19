do $$
begin
  if exists (
    select 1
    from public.activities listing
    join public.org_profiles profile on profile.id = listing.profile_id
    where profile.organization_id is distinct from listing.organization_id
       or profile.municipality_id is distinct from listing.municipality_id
  ) or exists (
    select 1
    from public.events listing
    join public.org_profiles profile on profile.id = listing.profile_id
    where profile.organization_id is distinct from listing.organization_id
       or profile.municipality_id is distinct from listing.municipality_id
  ) or exists (
    select 1
    from public.directory_listings listing
    join public.org_profiles profile on profile.id = listing.profile_id
    where profile.organization_id is distinct from listing.organization_id
       or profile.municipality_id is distinct from listing.municipality_id
  ) then
    raise exception 'Existing profile-linked listings are inconsistent';
  end if;
end;
$$;

create or replace function public.enforce_listing_profile_integrity()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  profile_organization uuid;
  profile_municipality uuid;
begin
  if new.profile_id is null then return new; end if;

  select organization_id, municipality_id
    into profile_organization, profile_municipality
    from public.org_profiles
   where id = new.profile_id;

  if not found then
    raise exception 'Profile not found' using errcode = '23503';
  end if;

  if profile_organization is distinct from new.organization_id
     or profile_municipality is distinct from new.municipality_id then
    raise exception 'Listing profile does not match organization and municipality'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_listing_profile_integrity() from public, anon, authenticated;

create trigger enforce_activity_profile_integrity
  before insert or update of profile_id, organization_id, municipality_id
  on public.activities
  for each row execute function public.enforce_listing_profile_integrity();

create trigger enforce_event_profile_integrity
  before insert or update of profile_id, organization_id, municipality_id
  on public.events
  for each row execute function public.enforce_listing_profile_integrity();

create trigger enforce_directory_profile_integrity
  before insert or update of profile_id, organization_id, municipality_id
  on public.directory_listings
  for each row execute function public.enforce_listing_profile_integrity();