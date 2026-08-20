<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Skjer det noe — project notes

Leisure-activity directory (Unge Vil). See README.md for full overview.

- **DB:** Supabase Postgres + PostGIS, linked to this GitHub repo. Schema lives
  in `supabase/migrations/` — add a new timestamped migration; don't edit
  applied ones. Geography columns use `extensions.geography(Point, 4326)`;
  qualify PostGIS funcs (`extensions.st_*`) or `set search_path` in functions.
- **Data flow:** proximity search goes through the `nearby_activities` /
  `nearby_events` RPCs (return plain lat/lng, RLS-respecting). The frontend
  never parses PostGIS. Merge/sort helpers in `lib/listings.ts`,
  domain types + row mappers in `lib/types.ts`.
- **Supabase clients:** `lib/supabase/server.ts` (RSC/actions) and
  `lib/supabase/client.ts` (browser). App stays functional without env vars.
- **Map:** Leaflet via `components/ListingMap.tsx`, loaded with
  `dynamic(..., { ssr: false })` from the client `Explorer`.
- **Hosting:** Cloudflare via `@opennextjs/cloudflare` (`pnpm cf:*`).
- **Language:** UI copy is Norwegian (bokmål).
- **Documentation:** GitBook is the source of truth for public help, guides,
  product information, changelog and API documentation. When a change affects
  user workflows, admin workflows, municipal or organisation features, public
  content, integrations or API contracts, update the relevant GitBook pages in
  the same work item through a GitBook change request. Keep guides, links,
  examples and API documentation aligned with the implemented behaviour; remove
  template or outdated content when it no longer describes the product.
- **Design system:** "Skjer det noe?" tokens in `app/ds-tokens/*.css` (imported
  by `globals.css`); primitives in `components/ds/`. Use CSS vars (`--fjord-*`,
  `--accent`, `--surface-card`, `--text-*`) — never invent brand colours. Icons
  are Lucide via `components/ds/Icon.tsx` (add to its registry before use).
  **No emoji** in product UI. Theme via `data-theme` on `<html>` (auto/light/dark).
  Category slugs (`gaming, music, film, sports, outdoor, creative, social,
  courses, club`) are shared between the DB and `components/ds/categories.ts`.
  Admin UI kits (municipality/organisation) from the design are not built yet.
