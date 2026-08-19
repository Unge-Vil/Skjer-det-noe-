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

Nyere migrasjoner utvider dette med innlogging, organisasjons- og kommuneadmin,
profiler/avdelinger, publiseringsflyt, medielagring, integrasjoner og
sikkerhetsgrenser. Legg alltid databaseendringer i en ny tidsstemplet migrasjon.

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

## Roller og publisering

- **Plattformadministrator** administrerer kommunetilganger og kan moderere alle
  organisasjoner.
- **Kommuneadministrator** kan godkjenne eller arkivere organisasjoner som er
  knyttet til egen kommune.
- **Organisasjonseier** styrer medlemmer, roller, API-nøkler og kalenderfeeds.
- **Editor** kan redigere organisasjons-, profil- og oppføringsinnhold, men kan
  ikke styre eiere eller integrasjonshemmeligheter.

Nye organisasjoner opprettes som utkast. Organisasjonsmedlemmer kan redigere
profilen, men bare riktig kommuneadministrator eller plattformadministrator kan
endre organisasjonens publiseringsstatus. Databasen hindrer at siste eier fjernes
eller nedgraderes.

## Integrasjoner

Det offentlige skrive-API-et bruker organisasjonsbundne Bearer-nøkler og
validerer hele payloaden før databasekall. Kalenderfeeds kan bare administreres
av eiere; serveren tillater kun HTTPS, avviser lokale/private mål og redirect,
og begrenser tid og responsstørrelse. `SUPABASE_SECRET_KEY` brukes bare i
serverruter og scripts som selv håndhever organisasjonsscope.

## Deploy til Cloudflare

```bash
pnpm cf:preview   # bygg + kjør Worker lokalt
pnpm cf:deploy    # bygg + deploy (krever wrangler-innlogging)
```

Sett Supabase-variablene som Worker-secrets:
`wrangler secret put NEXT_PUBLIC_SUPABASE_URL` osv.

## PWA & offline

Appen er en installerbar PWA (`app/manifest.ts` + ikoner). En enkel service
worker (`public/sw.js`) registreres i produksjon (`ServiceWorkerRegister`):

- Kun eksplisitt offentlige navigasjoner caches network-first; admin-, konto- og
  API-ruter skrives aldri til Cache Storage.
- Statiske assets: cache-first. Eksterne kall (Supabase, kart-fliser, Brønnøysund)
  røres ikke. Lagrede favoritter ligger i localStorage og virker offline uansett.

## Native app (Capacitor)

Appen er server-rendret, så den native skallet laster den hostede URL-en (ikke
en statisk eksport). I `capacitor.config.ts`: sett `server.url` til
produksjons-URL-en, så:

```bash
pnpm cap:sync
npx cap add ios       # krever Xcode
npx cap add android   # krever Android Studio
npx cap open ios|android
```

De native prosjektene (`/ios`, `/android`) genereres lokalt og er gitignorert.

## Test­brukere

Kjør `node --env-file=.env scripts/seed-test-users.mjs` (idempotent) for å
opprette demo-brukere (passord `demo`): plattform-admin, organisasjon og
kommune-admin. Se skriptet for detaljer.

## Verifikasjon

```bash
pnpm test                 # lokale enhetstester, ingen produksjonssecrets
pnpm test:integration     # remote Supabase; krever .env + SUPABASE_TEST_PASSWORD
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Integrasjonstestene oppretter isolerte testdata og rydder dem i `finally`.

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

Se `PLATTFORM_FORBEDRINGSPLAN.md` for datert leveranseloggbok, verifikasjon og
den prioriterte listen over arbeid som er utsatt til Cloudflare-deploy eller en
senere kvalitetsrunde.

- [x] Public-opplevelsen bygget på designsystemet (liste + kart + filtre + tema)
- [x] Organisasjons-, kommune- og plattformadministrasjon med databasehåndhevede roller
- [x] Sveip/«Oppdag», kart, detaljsider, tjenester og frivilligtorg
- [x] API-nøkler og kalenderimport med idempotent synkronisering
- [x] Logo/banner-opplasting med eierskapsbaserte storage-policyer
- [ ] Full WCAG 2.2 AA-verifikasjon og resterende dialogfokus
- [ ] Cloudflare-ratebegrensning, observability og produksjonsmålinger
