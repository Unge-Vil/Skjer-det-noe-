-- Lightweight view analytics.
-- page_views is written only through log_view() (SECURITY DEFINER) and read only
-- through org_view_count_30d() (gated by can_admin_org); no direct table access.

create table public.page_views (
  id          uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('activity', 'event', 'organization')),
  entity_id   uuid not null,
  viewed_at   timestamptz not null default now()
);
create index page_views_entity_idx on public.page_views (entity_id, viewed_at);

alter table public.page_views enable row level security;

-- Log a view (any visitor).
create or replace function public.log_view(p_type text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_type not in ('activity', 'event', 'organization') then
    return;
  end if;
  insert into public.page_views (entity_type, entity_id) values (p_type, p_id);
end;
$$;

revoke execute on function public.log_view(text, uuid) from public;
grant execute on function public.log_view(text, uuid) to anon, authenticated;

-- 30-day view total for an organisation (its profile + its activities + events).
create or replace function public.org_view_count_30d(p_org uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select case when public.can_admin_org(p_org) then (
    select count(*)::int
    from public.page_views v
    where v.viewed_at >= now() - interval '30 days'
      and (
        (v.entity_type = 'organization' and v.entity_id = p_org)
        or (v.entity_type = 'activity' and v.entity_id in (select id from public.activities where organization_id = p_org))
        or (v.entity_type = 'event' and v.entity_id in (select id from public.events where organization_id = p_org))
      )
  ) else 0 end;
$$;

revoke execute on function public.org_view_count_30d(uuid) from public, anon;
grant execute on function public.org_view_count_30d(uuid) to authenticated;
