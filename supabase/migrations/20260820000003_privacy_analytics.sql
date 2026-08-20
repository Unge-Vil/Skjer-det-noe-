-- Privacy-preserving analytics reports. Raw view rows are retained for 90 days.

create index if not exists page_views_viewed_at_idx on public.page_views (viewed_at);

create or replace function public.cleanup_page_views()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.page_views
  where viewed_at < now() - interval '90 days';
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke execute on function public.cleanup_page_views() from public, anon, authenticated;

create or replace function public.org_analytics_30d(p_org uuid)
returns table (
  total_views bigint,
  organization_views bigint,
  activity_views bigint,
  event_views bigint,
  previous_total_views bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with authorized as (
    select public.can_admin_org(p_org) as allowed
  ), current_period as (
    select
      count(*) filter (where v.entity_type = 'organization') as organization_views,
      count(*) filter (where v.entity_type = 'activity') as activity_views,
      count(*) filter (where v.entity_type = 'event') as event_views
    from public.page_views v
    cross join authorized a
    where a.allowed
      and v.viewed_at >= now() - interval '30 days'
      and (
        (v.entity_type = 'organization' and v.entity_id = p_org)
        or (v.entity_type = 'activity' and v.entity_id in (select id from public.activities where organization_id = p_org))
        or (v.entity_type = 'event' and v.entity_id in (select id from public.events where organization_id = p_org))
      )
  ), previous_period as (
    select count(*) as previous_total_views
    from public.page_views v
    cross join authorized a
    where a.allowed
      and v.viewed_at >= now() - interval '60 days'
      and v.viewed_at < now() - interval '30 days'
      and (
        (v.entity_type = 'organization' and v.entity_id = p_org)
        or (v.entity_type = 'activity' and v.entity_id in (select id from public.activities where organization_id = p_org))
        or (v.entity_type = 'event' and v.entity_id in (select id from public.events where organization_id = p_org))
      )
  )
  select
    c.organization_views + c.activity_views + c.event_views,
    c.organization_views,
    c.activity_views,
    c.event_views,
    p.previous_total_views
  from current_period c cross join previous_period p;
$$;

revoke execute on function public.org_analytics_30d(uuid) from public, anon;
grant execute on function public.org_analytics_30d(uuid) to authenticated;

create or replace function public.municipality_analytics_30d(p_municipality uuid)
returns table (
  total_views bigint,
  organization_views bigint,
  activity_views bigint,
  event_views bigint,
  previous_total_views bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with authorized as (
    select public.is_municipality_admin(p_municipality) or public.is_platform_admin() as allowed
  ), orgs as (
    select organization_id from public.organization_municipalities where municipality_id = p_municipality
  ), current_period as (
    select
      count(*) filter (where v.entity_type = 'organization' and v.entity_id in (select organization_id from orgs)) as organization_views,
      count(*) filter (where v.entity_type = 'activity' and v.entity_id in (select id from public.activities where municipality_id = p_municipality)) as activity_views,
      count(*) filter (where v.entity_type = 'event' and v.entity_id in (select id from public.events where municipality_id = p_municipality)) as event_views
    from public.page_views v cross join authorized a
    where a.allowed and v.viewed_at >= now() - interval '30 days'
      and ((v.entity_type = 'organization' and v.entity_id in (select organization_id from orgs))
        or (v.entity_type = 'activity' and v.entity_id in (select id from public.activities where municipality_id = p_municipality))
        or (v.entity_type = 'event' and v.entity_id in (select id from public.events where municipality_id = p_municipality)))
  ), previous_period as (
    select count(*) as previous_total_views
    from public.page_views v cross join authorized a
    where a.allowed and v.viewed_at >= now() - interval '60 days' and v.viewed_at < now() - interval '30 days'
      and ((v.entity_type = 'organization' and v.entity_id in (select organization_id from orgs))
        or (v.entity_type = 'activity' and v.entity_id in (select id from public.activities where municipality_id = p_municipality))
        or (v.entity_type = 'event' and v.entity_id in (select id from public.events where municipality_id = p_municipality)))
  ), totals as (
    select c.organization_views, c.activity_views, c.event_views,
      c.organization_views + c.activity_views + c.event_views as total_views,
      p.previous_total_views
    from current_period c cross join previous_period p
  )
  select case when total_views >= 5 then total_views else 0 end,
    case when total_views >= 5 then organization_views else 0 end,
    case when total_views >= 5 then activity_views else 0 end,
    case when total_views >= 5 then event_views else 0 end,
    case when previous_total_views >= 5 then previous_total_views else 0 end
  from totals;
$$;

revoke execute on function public.municipality_analytics_30d(uuid) from public, anon;
grant execute on function public.municipality_analytics_30d(uuid) to authenticated;

create or replace function public.platform_analytics_30d()
returns table (
  total_views bigint,
  activity_views bigint,
  event_views bigint,
  organization_views bigint,
  previous_total_views bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with current_period as (
    select
      count(*) as total_views,
      count(*) filter (where entity_type = 'activity') as activity_views,
      count(*) filter (where entity_type = 'event') as event_views,
      count(*) filter (where entity_type = 'organization') as organization_views
    from public.page_views
    where public.is_platform_admin() and viewed_at >= now() - interval '30 days'
  ), previous_period as (
    select count(*) as previous_total_views
    from public.page_views
    where public.is_platform_admin()
      and viewed_at >= now() - interval '60 days' and viewed_at < now() - interval '30 days'
  )
  select case when c.total_views >= 5 then c.total_views else 0 end,
    case when c.total_views >= 5 then c.activity_views else 0 end,
    case when c.total_views >= 5 then c.event_views else 0 end,
    case when c.total_views >= 5 then c.organization_views else 0 end,
    case when p.previous_total_views >= 5 then p.previous_total_views else 0 end
  from current_period c cross join previous_period p;
$$;

revoke execute on function public.platform_analytics_30d() from public, anon;
grant execute on function public.platform_analytics_30d() to authenticated;