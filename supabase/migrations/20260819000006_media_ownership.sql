update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']
where id = 'media';

create or replace function public.can_manage_media_object(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public, storage
as $$
declare
  folders text[] := storage.foldername(object_name);
  entity_id uuid;
begin
  if public.is_platform_admin() then return true; end if;
  if array_length(folders, 1) < 2
     or folders[2] !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
    return false;
  end if;

  entity_id := folders[2]::uuid;
  return case folders[1]
    when 'org' then public.is_org_member(entity_id)
    when 'profile' then public.can_admin_profile(entity_id)
    when 'municipality' then public.is_municipality_admin(entity_id)
    else false
  end;
end;
$$;

revoke execute on function public.can_manage_media_object(text) from public, anon;
grant execute on function public.can_manage_media_object(text) to authenticated;

drop policy "Authenticated write media" on storage.objects;
drop policy "Authenticated update media" on storage.objects;
drop policy "Authenticated delete media" on storage.objects;

create policy "Members upload managed media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'media'
    and public.can_manage_media_object(name)
  );

create policy "Members update managed media"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'media'
    and public.can_manage_media_object(name)
  )
  with check (
    bucket_id = 'media'
    and public.can_manage_media_object(name)
  );

create policy "Members delete managed media"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'media'
    and public.can_manage_media_object(name)
  );