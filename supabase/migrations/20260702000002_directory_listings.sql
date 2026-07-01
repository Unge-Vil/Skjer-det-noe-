-- Directory listings: two non-time-based listing types that mirror what
-- aktivikarmoy.no offers beyond activities/events —
--   'service'   (Tjenester): help/services offered by appointment
--   'volunteer' (Frivilligtorg): an organisation's need for volunteers
-- One generic table keeps the surface small. RLS mirrors activities: public read
-- of published rows; org members, department members and platform admins manage.

create table public.directory_listings (
  id              uuid primary key default gen_random_uuid(),
  kind            text not null check (kind in ('service', 'volunteer')),
  organization_id uuid references public.organizations(id) on delete set null,
  profile_id      uuid references public.org_profiles(id) on delete set null,
  municipality_id uuid references public.municipalities(id) on delete set null,
  category_id     uuid references public.categories(id) on delete set null,
  title           text not null,
  title_en        text,
  slug            text not null unique,
  description     text,
  description_en  text,
  area            text,
  contact_name    text,
  contact_email   text,
  contact_phone   text,
  url             text,
  image_url       text,
  price           text,           -- services
  time_commitment text,           -- volunteer ("2 timer/uke")
  status          public.listing_status not null default 'published',
  source          text not null default 'manual',
  external_ref    text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index directory_listings_org_idx  on public.directory_listings (organization_id);
create index directory_listings_kind_idx on public.directory_listings (kind, status);
create unique index directory_listings_external_ref_idx
  on public.directory_listings (organization_id, source, external_ref)
  where external_ref is not null;

alter table public.directory_listings enable row level security;

grant select on public.directory_listings to anon, authenticated;
grant insert, update, delete on public.directory_listings to authenticated;

create policy "Public read published directory listings"
  on public.directory_listings for select
  using (status = 'published');

create policy "Members manage own directory listings"
  on public.directory_listings for all to authenticated
  using (
    public.is_org_member(organization_id)
    or public.is_department_member(organization_id, municipality_id)
    or public.is_platform_admin()
  )
  with check (
    public.is_org_member(organization_id)
    or public.is_department_member(organization_id, municipality_id)
    or public.is_platform_admin()
  );
