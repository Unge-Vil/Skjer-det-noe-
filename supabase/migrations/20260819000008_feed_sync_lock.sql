alter table public.calendar_feeds
  add column sync_locked_until timestamptz;

create or replace function public.acquire_feed_sync_lock(
  p_feed_id uuid,
  p_seconds integer default 120
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.calendar_feeds
     set sync_locked_until = now() + make_interval(secs => least(greatest(p_seconds, 30), 600))
   where id = p_feed_id
     and (sync_locked_until is null or sync_locked_until < now());
  return found;
end;
$$;

create or replace function public.release_feed_sync_lock(p_feed_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.calendar_feeds
     set sync_locked_until = null
   where id = p_feed_id;
$$;

revoke execute on function public.acquire_feed_sync_lock(uuid, integer) from public, anon, authenticated;
grant execute on function public.acquire_feed_sync_lock(uuid, integer) to service_role;
revoke execute on function public.release_feed_sync_lock(uuid) from public, anon, authenticated;
grant execute on function public.release_feed_sync_lock(uuid) to service_role;