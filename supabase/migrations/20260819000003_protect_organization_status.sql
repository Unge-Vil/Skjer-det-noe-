-- Organisation members may edit profile content, but publication status is
-- controlled by municipality and platform administrators.
revoke update on table public.organizations from authenticated;
grant update (
  name,
  slug,
  description,
  description_en,
  description_doc,
  description_doc_en,
  website,
  email,
  phone,
  municipality_id,
  address,
  location,
  logo_url,
  banner_url,
  org_number,
  is_volunteer,
  social_links
) on table public.organizations to authenticated;

create or replace function public.moderate_organization(
  p_organization uuid,
  p_status public.listing_status
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin()
     and not exists (
       select 1
       from public.organization_municipalities om
       where om.organization_id = p_organization
         and public.is_municipality_admin(om.municipality_id)
     ) then
    raise exception 'not_allowed';
  end if;

  update public.organizations
     set status = p_status
   where id = p_organization;

  if not found then
    raise exception 'Organization not found';
  end if;

  return true;
end;
$$;

revoke execute on function public.moderate_organization(uuid, public.listing_status) from public, anon;
grant execute on function public.moderate_organization(uuid, public.listing_status) to authenticated;