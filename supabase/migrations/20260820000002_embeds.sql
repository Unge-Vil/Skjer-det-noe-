-- Embeddable widgets. One table for both authorities so the render path has a
-- single shape; the check constraint keeps every row owned by exactly one.
create table public.embeds (
  id              uuid primary key default gen_random_uuid(),
  public_id       text not null unique,
  organization_id uuid references public.organizations(id) on delete cascade,
  municipality_id uuid references public.municipalities(id) on delete cascade,
  label           text,
  kind            text not null check (kind in ('events', 'activities', 'kiosk')),
  layout          text not null default 'list' check (layout in ('list', 'grid')),
  theme           text not null default 'auto' check (theme in ('auto', 'light', 'dark')),
  item_limit      integer not null default 6 check (item_limit between 1 and 24),
  category_slugs  text[] not null default '{}',
  allowed_origins text[] not null default '{}',
  active          boolean not null default true,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint embeds_single_owner check (num_nonnulls(organization_id, municipality_id) = 1),
  constraint embeds_public_id_shape check (public_id ~ '^[A-Za-z0-9_-]{8,32}$')
);

create index embeds_org_idx on public.embeds (organization_id);
create index embeds_muni_idx on public.embeds (municipality_id);

create trigger embeds_set_updated_at
  before update on public.embeds
  for each row execute function public.set_updated_at();

alter table public.embeds enable row level security;

create policy "Owners read own embeds"
  on public.embeds for select to authenticated
  using (
    (organization_id is not null and public.is_org_member(organization_id))
    or (municipality_id is not null and public.is_municipality_admin(municipality_id))
    or public.is_platform_admin()
  );

create policy "Owners create own embeds"
  on public.embeds for insert to authenticated
  with check (
    (organization_id is not null and public.is_org_member(organization_id))
    or (municipality_id is not null and public.is_municipality_admin(municipality_id))
  );

create policy "Owners update own embeds"
  on public.embeds for update to authenticated
  using (
    (organization_id is not null and public.is_org_member(organization_id))
    or (municipality_id is not null and public.is_municipality_admin(municipality_id))
  )
  with check (
    (organization_id is not null and public.is_org_member(organization_id))
    or (municipality_id is not null and public.is_municipality_admin(municipality_id))
  );

create policy "Owners delete own embeds"
  on public.embeds for delete to authenticated
  using (
    (organization_id is not null and public.is_org_member(organization_id))
    or (municipality_id is not null and public.is_municipality_admin(municipality_id))
  );

grant select, insert, update, delete on public.embeds to authenticated;

-- Anonymous render path. The table itself stays closed; these two functions are
-- the only public surface and expose nothing beyond what the widget draws.
create or replace function public.embed_config(p_public_id text)
returns table (
  kind text,
  layout text,
  theme text,
  item_limit integer,
  category_slugs text[],
  allowed_origins text[],
  owner_kind text,
  owner_name text,
  owner_slug text
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    e.kind, e.layout, e.theme, e.item_limit, e.category_slugs, e.allowed_origins,
    case when e.organization_id is not null then 'organization' else 'municipality' end,
    coalesce(o.name, m.name),
    coalesce(o.slug, m.slug)
  from public.embeds e
  left join public.organizations o on o.id = e.organization_id
  left join public.municipalities m on m.id = e.municipality_id
  where e.public_id = p_public_id
    and e.active;
$$;

create or replace function public.embed_listings(p_public_id text)
returns table (
  kind text,
  id uuid,
  title text,
  title_en text,
  slug text,
  description text,
  description_en text,
  organization_name text,
  category_slug text,
  municipality_name text,
  address text,
  age_min smallint,
  age_max smallint,
  price text,
  image_url text,
  weekday smallint,
  start_time time,
  end_time time,
  recurrence_note text,
  starts_at timestamptz,
  ends_at timestamptz
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  with cfg as (
    select
      e.organization_id,
      e.municipality_id,
      e.kind,
      e.category_slugs,
      least(greatest(e.item_limit, 1), 24) as item_limit
    from public.embeds e
    where e.public_id = p_public_id
      and e.active
  )
  (
    select
      'event', e.id, e.title, e.title_en, e.slug, e.description, e.description_en,
      o.name, c.slug, m.name, e.address, e.age_min, e.age_max, e.price, e.image_url,
      null::smallint, null::time, null::time, null::text, e.starts_at, e.ends_at
    from cfg
    join public.events e on
      (cfg.organization_id is not null and e.organization_id = cfg.organization_id)
      or (cfg.municipality_id is not null and e.municipality_id = cfg.municipality_id)
    left join public.organizations o on o.id = e.organization_id
    left join public.categories c on c.id = e.category_id
    left join public.municipalities m on m.id = e.municipality_id
    where cfg.kind in ('events', 'kiosk')
      and e.status = 'published'
      and coalesce(e.ends_at, e.starts_at) >= now()
      and (
        cardinality(cfg.category_slugs) = 0
        or c.slug = any(cfg.category_slugs)
        or exists (
          select 1 from public.categories cx
          where cx.id = any(e.category_ids) and cx.slug = any(cfg.category_slugs)
        )
      )
    order by e.starts_at
    limit (select item_limit from cfg)
  )
  union all
  (
    select
      'activity', a.id, a.title, a.title_en, a.slug, a.description, a.description_en,
      o.name, c.slug, m.name, a.address, a.age_min, a.age_max, a.price, a.image_url,
      a.weekday, a.start_time, a.end_time, a.recurrence_note, null::timestamptz, null::timestamptz
    from cfg
    join public.activities a on
      (cfg.organization_id is not null and a.organization_id = cfg.organization_id)
      or (cfg.municipality_id is not null and a.municipality_id = cfg.municipality_id)
    left join public.organizations o on o.id = a.organization_id
    left join public.categories c on c.id = a.category_id
    left join public.municipalities m on m.id = a.municipality_id
    where cfg.kind = 'activities'
      and a.status = 'published'
      and (a.ends_on is null or a.ends_on >= current_date)
      and (
        cardinality(cfg.category_slugs) = 0
        or c.slug = any(cfg.category_slugs)
        or exists (
          select 1 from public.categories cx
          where cx.id = any(a.category_ids) and cx.slug = any(cfg.category_slugs)
        )
      )
    order by a.title
    limit (select item_limit from cfg)
  );
$$;

revoke all on function public.embed_config(text) from public;
revoke all on function public.embed_listings(text) from public;
grant execute on function public.embed_config(text) to anon, authenticated;
grant execute on function public.embed_listings(text) to anon, authenticated;
