-- Integrations foundation: let events/activities carry a source + external id
-- (for idempotent inbound sync from the API and ICS feeds), plus the two config
-- tables that back per-organisation API keys and calendar feeds.

-- ── Provenance + idempotency on listings ────────────────────────────────────
alter table public.activities
  add column source text not null default 'manual',
  add column external_ref text;
alter table public.events
  add column source text not null default 'manual',
  add column external_ref text;

-- One row per (org, source, external id): re-posting the same external event
-- updates it instead of creating a duplicate.
create unique index activities_external_ref_idx
  on public.activities (organization_id, source, external_ref)
  where external_ref is not null;
create unique index events_external_ref_idx
  on public.events (organization_id, source, external_ref)
  where external_ref is not null;

-- ── API keys ────────────────────────────────────────────────────────────────
-- Only the sha-256 hash of the token is stored; the raw token is shown once at
-- creation. `key_prefix` is a display-only fragment (e.g. sdn_live_ab12…).
create table public.api_keys (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  label           text,
  key_prefix      text not null,
  key_hash        text not null unique,
  auto_publish    boolean not null default true,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  last_used_at    timestamptz,
  revoked_at      timestamptz
);
create index api_keys_org_idx on public.api_keys (organization_id);

alter table public.api_keys enable row level security;
create policy "Org members read own api keys"
  on public.api_keys for select to authenticated
  using (public.is_org_member(organization_id) or public.is_platform_admin());
create policy "Org members create own api keys"
  on public.api_keys for insert to authenticated
  with check (public.is_org_member(organization_id));
create policy "Org members update own api keys"
  on public.api_keys for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

-- ── Calendar (ICS) feeds ────────────────────────────────────────────────────
create table public.calendar_feeds (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  profile_id          uuid references public.org_profiles(id) on delete set null,
  url                 text not null,
  label               text,
  default_category_id uuid references public.categories(id) on delete set null,
  auto_publish        boolean not null default true,
  active              boolean not null default true,
  last_synced_at      timestamptz,
  last_status         text,
  last_error          text,
  created_at          timestamptz not null default now()
);
create index calendar_feeds_org_idx on public.calendar_feeds (organization_id);

alter table public.calendar_feeds enable row level security;
create policy "Org members read own feeds"
  on public.calendar_feeds for select to authenticated
  using (public.is_org_member(organization_id) or public.is_platform_admin());
create policy "Org members create own feeds"
  on public.calendar_feeds for insert to authenticated
  with check (public.is_org_member(organization_id));
create policy "Org members update own feeds"
  on public.calendar_feeds for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));
create policy "Org members delete own feeds"
  on public.calendar_feeds for delete to authenticated
  using (public.is_org_member(organization_id));

grant select, insert, update, delete on public.api_keys to authenticated;
grant select, insert, update, delete on public.calendar_feeds to authenticated;
