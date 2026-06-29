-- Rich-text info pages owned by municipalities (#2). Content is stored as a
-- Tiptap/ProseMirror document (jsonb) so it can be rendered safely on the
-- server. Bilingual: nb required, en optional.

create table public.municipality_pages (
  id              uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references public.municipalities(id) on delete cascade,
  slug            text not null,
  title           text not null,
  title_en        text,
  content         jsonb not null default '{}'::jsonb,
  content_en      jsonb,
  status          public.listing_status not null default 'draft',
  sort_order      smallint not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (municipality_id, slug)
);

create index municipality_pages_muni_idx on public.municipality_pages (municipality_id);

create trigger set_updated_at before update on public.municipality_pages
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS + grants
-- ---------------------------------------------------------------------------

alter table public.municipality_pages enable row level security;

grant select on public.municipality_pages to anon, authenticated;
grant insert, update, delete on public.municipality_pages to authenticated;

-- Public sees published pages.
create policy "Public read published municipality pages"
  on public.municipality_pages for select
  using (status = 'published');

-- Municipality (and platform) admins read all their pages, incl. drafts.
create policy "Admins read own municipality pages"
  on public.municipality_pages for select to authenticated
  using (public.is_municipality_admin(municipality_id) or public.is_platform_admin());

create policy "Admins manage own municipality pages"
  on public.municipality_pages for all to authenticated
  using (public.is_municipality_admin(municipality_id) or public.is_platform_admin())
  with check (public.is_municipality_admin(municipality_id) or public.is_platform_admin());
