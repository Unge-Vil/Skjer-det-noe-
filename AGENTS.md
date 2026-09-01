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
- **Documentation:** The local help centre in `app/hjelp/` and API documentation
  in `app/api-dokumentasjon/` are the source of truth for customer-facing help,
  guides, product information and API documentation. When a change affects user
  workflows, admin workflows, municipal or organisation features, public
  content, integrations or API contracts, update the relevant local pages in
  the same work item. Keep guides, links, examples and API documentation aligned
  with the implemented behaviour; remove template or outdated content when it
  no longer describes the product. Keep both Norwegian and English variants
  documented when both are published; Norwegian is the default. Customer-facing
  pages must not include internal notes, implementation details, agent
  instructions, speculative roadmap items, security-team language or references
  to private systems. Rewrite technical constraints as clear user guidance with
  a purpose, practical steps and customer-relevant limitations.
- **Design system:** "Skjer det noe?" tokens in `app/ds-tokens/*.css` (imported
  by `globals.css`); primitives in `components/ds/`. Use CSS vars (`--fjord-*`,
  `--accent`, `--surface-card`, `--text-*`) — never invent brand colours. Icons
  are Lucide via `components/ds/Icon.tsx` (add to its registry before use).
  **No emoji** in product UI. Theme via `data-theme` on `<html>` (auto/light/dark).
  Category slugs (`gaming, music, film, sports, outdoor, creative, social,
  courses, club`) are shared between the DB and `components/ds/categories.ts`.
  Admin UI kits (municipality/organisation) from the design are not built yet.
