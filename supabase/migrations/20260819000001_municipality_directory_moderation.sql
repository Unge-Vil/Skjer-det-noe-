-- Municipality admins can review directory content in their municipality.
-- They may only change publication status through the RPC below; ownership and
-- content editing remain with the organisation or profile members.

create policy "Municipality admins read directory listings"
  on public.directory_listings for select to authenticated
  using (public.is_municipality_admin(municipality_id));

create or replace function public.moderate_directory_listing(
  p_listing uuid,
  p_status public.listing_status
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  listing_municipality uuid;
begin
  select municipality_id
    into listing_municipality
    from public.directory_listings
   where id = p_listing;

  if listing_municipality is null
     or not public.is_municipality_admin(listing_municipality) then
    raise exception 'not_allowed';
  end if;

  update public.directory_listings
     set status = p_status, updated_at = now()
   where id = p_listing;

  return true;
end;
$$;

revoke execute on function public.moderate_directory_listing(uuid, public.listing_status) from public, anon;
grant execute on function public.moderate_directory_listing(uuid, public.listing_status) to authenticated;
