# Rate limiting

Sist oppdatert: 20. august 2026

## Status

Applikasjonen har en baseline-ratebegrensning i serverrutene via `lib/rate-limit.ts`.
Dette beskytter lokal utvikling og pre-produksjon, men er prosesslokal (in-memory)
og ikke distribuert pa tvers av instanser.

Ved produksjon i Cloudflare skal policyen flyttes til edge-laget for global,
instansuavhengig handheving.

## Aktiv policy i appen

- `GET /api/public/v1/listings`: 60 per minutt per IP
- `GET /api/public/v1/feeds/:publicId/rss`: 30 per minutt per IP
- `GET /api/brreg/:orgnr`: 20 per minutt per IP
- `GET /api/location/municipality`: 20 per minutt per IP
- `POST /api/oauth/register`: 10 per minutt per IP
- `POST /api/oauth/token`: 30 per minutt per IP
- `POST /api/v1/activities`: 60 per minutt per IP + 30 per minutt per API-nokkel
- `GET /api/v1/activities`: 120 per minutt per IP + 120 per minutt per API-nokkel
- `POST /api/v1/events`: 60 per minutt per IP + 30 per minutt per API-nokkel
- `GET /api/v1/events`: 120 per minutt per IP + 120 per minutt per API-nokkel
- `GET /api/v1/municipality/listings`: 120 per minutt per IP + 120 per minutt per API-nokkel
- `POST /api/integrations/feeds/:id/sync`: 20 per minutt per IP + 5 per minutt per (user, feed)

Alle avviste kall returnerer HTTP 429 med `Retry-After`.

## Cloudflare migreringsplan

1. Etabler edge-rate limiting
- Implementer limitere i Cloudflare (Durable Objects anbefales for sterk konsistens).
- Nokkeldimensjon:
  - Offentlige ruter: IP
  - API-ruter med nokkel: API-nokkel-ID
  - OAuth token/register: IP og eventuelt client_id
  - Manuell feed-sync: user_id + feed_id

2. Speil samme terskler
- Start med tersklene over for enkel overgang uten overraskelser.
- Innfor burst-policy bare i edge-laget ved behov.

3. Behold stabil kontrakt
- Returner samme format ved avvisning: HTTP 429 + `Retry-After`.
- Ikke eksponer interne detaljer i feilmelding.

4. Observability
- Metrikker per rute: total requests, tillatt, avvist (429), p95 latency.
- Logg bucket, anonymisert key-type og retryAfter.
- Sett alarm ved unormal 429-rate.

5. Verifisering
- Lasttest per rute for a bekrefte terskler.
- Verifiser at legitime integrasjoner ikke blir blokkert.
- Etter produksjon: juster terskler etter faktisk trafikk.

## Cloudflare regelmatrise

Denne matrisen speiler dagens app-policy og kan brukes direkte ved produksjonsdeploy.

| Prioritet | Metode | Path-match | Nokkeldimensjon | Grense |
|---|---|---|---|---|
| 1 | GET | `/api/public/v1/listings` | IP | 60/min |
| 2 | GET | `/api/public/v1/feeds/*/rss` | IP | 30/min |
| 3 | GET | `/api/brreg/*` | IP | 20/min |
| 4 | GET | `/api/location/municipality` | IP | 20/min |
| 5 | POST | `/api/oauth/register` | IP | 10/min |
| 6 | POST | `/api/oauth/token` | IP + `client_id` | 30/min per IP, 60/min per client |
| 7 | POST | `/api/v1/activities` | API-nokkel-ID + IP fallback | 30/min per nokkel, 60/min per IP |
| 8 | GET | `/api/v1/activities` | API-nokkel-ID + IP fallback | 120/min per nokkel, 120/min per IP |
| 9 | POST | `/api/v1/events` | API-nokkel-ID + IP fallback | 30/min per nokkel, 60/min per IP |
| 10 | GET | `/api/v1/events` | API-nokkel-ID + IP fallback | 120/min per nokkel, 120/min per IP |
| 11 | GET | `/api/v1/municipality/listings` | API-nokkel-ID + IP fallback | 120/min per nokkel, 120/min per IP |
| 12 | POST | `/api/integrations/feeds/*/sync` | user_id + feed_id, IP fallback | 5/min per bruker/feed, 20/min per IP |

## Cloudflare implementasjonsdetaljer

1. Matching
- Bruk metode + path i match-regler, ikke bare path.
- Prioriter mer spesifikke ruter foran generelle `/api/*`.

2. Nokkeler
- IP: `cf-connecting-ip`.
- API-nokkel-ID: hash av bearer token etter vellykket validering i Worker (unnga logging av ra token).
- OAuth client: `client_id` fra form body for `/api/oauth/token`.
- Feed sync: bruker-id + feed-id fra autentisert kontekst.

3. Svar-kontrakt
- Ved blokkering: HTTP 429.
- Sett `Retry-After` i sekunder.
- Returner JSON med `error`, `message`, `retryAfter`.

4. Lagring
- Anbefalt: Durable Objects for konsistent teller pa tvers av alle edge-instanser.
- Alternativ: KV for enklere oppsett, men med svakere konsistens under hoy last.

## Cloudflare deploy-sjekkliste

- [ ] Opprett rate-limit buckets i edge for alle rader i matrisen.
- [ ] Verifiser at `Retry-After` er satt pa alle 429-svar.
- [ ] Bekreft at offentlige ruter begrenses pa IP, og private ruter pa nodvendig domene-nokkel.
- [ ] Logg antall blokkerte kall per bucket uten sensitiv payload.
- [ ] Sett alarm for hoy 429-andel per rute.
- [ ] Kjor en kort lasttest mot hver rute for a verifisere terskel og reset-vindu.
