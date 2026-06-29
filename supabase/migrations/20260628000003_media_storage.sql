-- Media storage: banner column + public "media" bucket with RLS.
-- (Recreated as a file to match the live DB — this migration was originally
-- applied directly; the db-live-sync branch reconciles the history.)

alter table public.organizations add column banner_url text;

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "Public read media"
  on storage.objects for select
  using (bucket_id = 'media');
create policy "Authenticated write media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media');
create policy "Authenticated update media"
  on storage.objects for update to authenticated
  using (bucket_id = 'media');
create policy "Authenticated delete media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media');
