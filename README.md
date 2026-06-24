# Skjer det noe?

Fritidsaktivitet-oversikt: faste aktiviteter, arrangementer og organisasjoner
i nærheten av deg. Koblet via lokasjon (OpenStreetMap) og knyttet til kommuner.
Målet er et felles alternativ kommuner kan bruke i stedet for egne
opplistingssider.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind v4)
- **Supabase** (Postgres + PostGIS) — database, koblet til dette GitHub-repoet,
  så migrasjoner i `supabase/migrations/` kjøres mot prosjektet.
- **Leaflet + OpenStreetMap** — kart og markører.
- **Cloudflare Workers** via `@opennextjs/cloudflare` — hosting.

## Kom i gang

```bash
pnpm install
cp .env.example .env.local   # fyll inn Supabase URL + publishable key
pnpm dev                     # http://localhost:3000
```

Miljøvariabler (se `.env.example`): `NEXT_PUBLIC_SUPABASE_URL` og
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` brukes av både nettleser- og
server-klienten. `SUPABASE_SECRET_KEY` er kun server-side (aldri eksponert) og
trengs bare for admin-skriving/skript som omgår RLS.

Uten Supabase-variabler kjører appen fortsatt, men viser en
"ikke konfigurert"-melding i stedet for data.

## Database

Skjemaet ligger i `supabase/migrations/`:

| Migrasjon | Innhold |
|-----------|---------|
| `..._init.sql` | PostGIS, `municipalities`, `categories`, `organizations`, `activities` (faste), `events` (engangs), indekser, triggere |
| `..._rls.sql` | Row Level Security — offentlig lesing av publiserte rader |
| `..._functions.sql` | `nearby_activities` / `nearby_events` RPC-er (avstandssøk) + `municipalities_view` |
| `..._reference_data.sql` | Kategorier + kommuner (Haugalandet/Rogaland til å begynne med) |

`supabase/seed.sql` legger inn eksempeldata lokalt (`supabase db reset`).

Lokal utvikling med Supabase CLI:

```bash
supabase start          # lokal stack (Docker)
supabase db reset       # kjør migrasjoner + seed
supabase link --project-ref <ref>   # koble til remote-prosjektet
```

Generér typer når MCP/CLI er koblet til:

```bash
supabase gen types typescript --linked > lib/database.types.ts
```

## Deploy til Cloudflare

```bash
pnpm cf:preview   # bygg + kjør Worker lokalt
pnpm cf:deploy    # bygg + deploy (krever wrangler-innlogging)
```

Sett Supabase-variablene som Worker-secrets:
`wrangler secret put NEXT_PUBLIC_SUPABASE_URL` osv.

## Designsystem

UI-en følger **«Skjer det noe?»-designsystemet** (Fjord/Coral/Sol/Sand-palett,
Schibsted Grotesk, Lucide-ikoner, lyst/mørkt tema, WCAG 2.2 AA).

- **Tokens:** `app/ds-tokens/*.css` (farger, type, spacing, radius, skygger,
  motion, base) importeres i `app/globals.css`. Bruk CSS-variablene
  (`--fjord-600`, `--accent`, `--surface-card`, …) — aldri nye merkevarefarger.
- **Komponenter:** `components/ds/` (Wordmark, Button, IconButton, CategoryPill,
  StatusLabel, SearchBar, FilterChip, MapListToggle, Icon, ThemeToggle).
- **Tema:** `data-theme="auto|light|dark"` på `<html>`, satt før paint i layout
  og styrt av `ThemeToggle` (lagres i localStorage).
- **Ingen emoji** i produkt-UI — mening bæres av ikon + tekst.

## Struktur

```
app/                  Next.js App Router (layout, forside, ds-tokens/)
components/ds/         Designsystem-primitiver (knapper, pills, ikoner …)
components/            Explorer (filtre), ListingCard, ListingMap (Leaflet)
lib/                  Supabase-klienter, domenetyper, spørringer, formatering
supabase/migrations/  SQL-skjema
supabase/seed.sql     Lokale eksempeldata
```

## Status / videre arbeid

- [x] Public-opplevelsen bygget på designsystemet (liste + kart + filtre + tema)
- [ ] Admin-UI: kommune- og organisasjons-dashboards (egne UI-kits i designet) — krever auth + write-policies
- [ ] Sveip/«Oppdag» og detaljside-overlay fra mobil-kitet
- [ ] Importere full liste over norske kommuner
- [ ] Ekte bilder for aktiviteter/organisasjoner
