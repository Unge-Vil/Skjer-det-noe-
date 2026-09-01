# Forbedringsplan for plattformen

Sist oppdatert: 25. august 2026

## Formål

Denne planen samler de viktigste forbedringene som ble funnet i den helhetlige
plattformgjennomgangen. Den skal brukes som en prioritert arbeidsliste, ikke som
en komplett produkt-roadmap.

Prioriteringen er:

1. Steng sikkerhetshull som kan gi uautorisert tilgang eller datamanipulasjon.
2. Sikre dataintegritet og tydelige roller.
3. Gjør løsningen robust nok for produksjonsdrift.
4. Bygg test-, tilgjengelighets- og skaleringskvalitet over tid.

## Arbeidsprinsipper

- Lever én liten, fungerende vertikal forbedring om gangen.
- Legg databaseendringer i nye tidsstemplede migrasjoner. Ikke endre migrasjoner
  som allerede er kjørt.
- La databasen håndheve autorisasjon og dataintegritet. UI-kontroller alene er
  ikke en sikkerhetsgrense.
- Legg ved en regresjonstest for hver sikkerhetsfeil som rettes.
- Kryss av et punkt først når akseptansekriteriene er verifisert.

## Gjeldende avgrensning

Cloudflare-spesifikke tiltak som KV-ratebegrensning, produksjonsobservability,
runtime-målinger og endelig cache-/service-worker-verifikasjon utsettes til
deployarbeidet starter. Databaseendringer og integrasjonstester kjøres mot det
linkede Supabase-prosjektet så lenge lokal WSL/Docker ikke er tilgjengelig.

## Gjennomført 19. august 2026

Følgende er implementert i repoet og verifisert mot det linkede
Supabase-prosjektet:

- Plattformadministratorflagget er beskyttet med kolonnerettigheter og en
  autorisert RPC. Vanlige brukere kan fortsatt redigere trygge profilfelt.
- Organisasjonsmedlemmer kan ikke endre publiseringsstatus. Moderering går via
  en RPC for riktig kommuneadministrator eller plattformadministrator.
- `owner` og `editor` håndheves for medlemmer, rolleendringer, API-nøkler og
  kalenderfeeds. Siste organisasjons- eller profileier kan ikke fjernes eller
  nedgraderes.
- Media-bøtten bruker eierskapsbaserte `org/`, `profile/` og `municipality/`-
  stier. Bøtten håndhever tillatte bildetyper og 5 MB maksimal filstørrelse.
- Profil, organisasjon og kommune må samsvare for aktiviteter, arrangementer og
  katalogoppføringer. Eksisterende data ble kontrollert før håndhevingen.
- Kalenderhenting har HTTPS-/IP-/vertsvalidering, kontroll av redirectmål,
  timeout, bytegrense og blokkering av komprimerte svar.
- Kalendersynk har atomisk feedlås, idempotent lagring, kontrollerte delvise
  feil, korrekt telling, varighet og feilkategori.
- API-et validerer støttede felt, tekstlengder, alder, koordinater, URL-er og
  datoer før databasekall. Rå databasefeil returneres ikke til klienten.
- Service workeren cacher bare eksplisitt offentlige ruter og bruker ny
  cacheversjon som sletter tidligere cache.
- Nærhetssøk har standardgrense og hard cap; forsiden henter bare seks
  aktiviteter og tre arrangementer.
- Fjorten ugyldige lenke/knapp-nestinger er erstattet med semantiske lenker.
  Mobilinnstillinger har fokus inn, fokusfelle, Escape og fokusretur.
- Forsiden har en tilgjengelig feilgrense med retry, og databasefeil vises ikke
  lenger som falskt tomme resultater.
- README, rollemodell, integrasjonsgrenser og testkommandoer er oppdatert.

Databaseleveransen ligger i migrasjonene
`20260819000002`–`20260819000010`. Alle lokale migrasjonsversjoner er registrert
som anvendt i remote migrasjonshistorikk.

Verifisert etter implementasjonen:

- 15 lokale tester for SSRF, service-worker-policy og API-validering.
- 8 remote integrasjonsskript for roller, moderering, media, dataintegritet,
  feedlås og begrenset nærhetssøk.
- `pnpm lint`, `pnpm exec tsc --noEmit` og `pnpm build` uten feil.
- Separate read-only review-subagenter for sikkerhetsleveransene og en samlet
  sluttreview. Blokkerende funn ble rettet før siste verifikasjon.

## Gjøres senere

### Før Cloudflare-deploy

- [ ] Sett `NEXT_PUBLIC_SITE_URL` til den ene kanoniske offentlige HTTPS-
  adressen i Cloudflare og verifiser at `robots.txt`, `sitemap.xml`, canonical
  metadata og JSON-LD bruker denne adressen. Verifiser deretter domenet i Google
  Search Console og Bing Webmaster Tools før sitemap sendes inn.
- [x] Etabler baseline-ratebegrensning i app-rutene med stabile `429`-svar og
  `Retry-After` for offentlige oppslag, OAuth-endepunkter og API-nøkkelruter.
- [ ] Flytt ratebegrensning til Cloudflare edge (Durable Objects/KV) med delt,
  global teller per nøkkel/IP på tvers av instanser.
- [ ] Speil rutepolicyen i Cloudflare (offentlig feed/oppslag, OAuth,
  organisasjons-API, kommune-API, manuell feed-sync) og verifiser at terskler
  matcher dokumenterte grenser.
- [ ] Legg til observability for ratebegrensning i Cloudflare: antall 429,
  toppnøkler/IP-er, og alarm ved vedvarende avvisningsrate.
- Verifiser DNS-/tilkoblingspinning i Worker-runtime for å lukke det gjenværende
  DNS-rebinding-vinduet ved kalenderhenting.
- Kjør produksjonsbrowser-test av service workeren: privat admininnhold skal
  aldri ligge i Cache Storage, gammel cache skal slettes, og offentlig offline-
  fallback skal fungere etter utlogging.
- Etabler logging, feilsporing, varsling, backup-/restore-test, nøkkelrotasjon og
  hendelseshåndtering.
- Mål kalender-cron, bundle, kartlasting og Core Web Vitals i Cloudflare-runtime.

### Videre produkt- og kvalitetsarbeid

- Fullfør feil-, loading- og not-found-grenser for `/utforsk`, `/kart`,
  detaljsider og administrative ruter.
- Gjør adminmenyer, desktopinnstillinger og øvrige overlays tastaturkomplette.
- Kjør full WCAG 2.2 AA-gjennomgang med tastatur, zoom, skjermleser, kontrast og
  redusert bevegelse, og oppdater tilgjengelighetserklæringen.
- Legg til CI for lint, typecheck, tester, build og isolerte database-/RLS-tester.
- Legg til cursor/paginering i nærhetssøk og mål spørringsplaner med realistisk
  nasjonalt datavolum.
- Avklar og dokumenter publiseringsmodell for aktiviteter/arrangementer,
  kommuneadministratorers redigeringsrett og eventuelle finmaskede API-scopes.

### Konkurranse-gap (vurdert mot Kulby, 25. august 2026)

Bakgrunn: Kulby (kulby.no) er venue-drevet og kommersielt («Kultur.
Billettsystem. Promotering.»), men utvider inn i vårt område med gratis
aktivitet («Aktivitet for alle») og interessefellesskap («Klubber»). Vår moat er
kommune-først-modellen, bredden (faste aktiviteter, tjenester, frivilligtorg) og
den åpne API-/feed-tilnærmingen. Punktene under lukker de reelle gapene uten å
flytte oss vekk fra den profilen. Prioritert rekkefølge:

- [ ] **Publiser native-appen.** Capacitor-skallet er allerede forberedt; sett
  `server.url`, kjør `pnpm cap:sync` og publiser til App Store og Google Play.
  Dette er det mest synlige gapet mot Kulby, som allerede er live i butikkene.
- [ ] **Server-side brukerkonto-favoritter.** Flytt «Lagret» fra localStorage
  (`sdn-saved`) til en kontobundet tabell med RLS, slik at favoritter følger
  brukeren på tvers av enheter og appen.
- [ ] **Påminnelser/varsler.** La innloggede brukere sette påminnelse på et
  arrangement, med web-push/native-varsel. Høy gjenbesøksverdi, lav kompleksitet
  bygget oppå kontomodellen over.
- [ ] **Klubber/grupper (brukervendt fellesskap).** Bygg videre på
  organisasjons-konseptet til grupper brukere kan bli med i, tilsvarende Kulbys
  «Klubber». Treffer direkte deres utvidelse inn i vårt aktivitetsområde.
- [ ] **Enkel påmelding/RSVP for gratis arrangementer.** Lettvekts-alternativ
  til Kulbys billettsystem: påmelding uten betaling, som dekker det meste av
  behovet for kommune- og frivillighetsarrangementer uten å dra inn
  betalings-compliance.
- [ ] **Personlige anbefalinger.** Krever konto-historikk (favoritter + påmelding
  som datagrunnlag). Utsettes til punktene over er på plass.

Bevisst avgrenset: fullt billettsystem med betaling er Kulbys kommersielle
kjerne, men trekker oss vekk fra kommune-/gratis-profilen og innfører
betalings-compliance. RSVP-punktet over dekker behovet uten den kostnaden.

### Bredere målgruppe og voksenarrangementer (retning besluttet 25. august 2026)

Beslutning: «Skjer det noe?» utvides til å dekke hele kommunens tilbud —
inkludert voksenarrangementer som konserter og festivaler — og blir det
nøytrale, komplette oppdagelseslaget for kommunen. Vi blir **ikke** en
billettselger; kommersielle arrangementer lenker ut til ekstern billettløsning.
Slik beholder vi nøytraliteten (kan liste alle arrangører, også de som selger
via Kulby/TicketCo) og den offentlige forankringen (kommune-API, offentlig feed,
frivilligtorg) som en kommersiell billettplattform ikke kan matche.

For å unngå å vanne ut Unge Vil-forankringen skiller vi på målgruppe med
metadata og filtrering i stedet for å velge bort unge-innhold:

- [ ] **Målgruppe-/aldersmetadata på oppføringer.** Legg til målgruppe
  (f.eks. barn, ungdom, voksen, familie/alle) og eventuell aldersgrense på
  aktiviteter og arrangementer, som strukturerte felt i databasen og API-et.
- [ ] **Målgruppefilter i appen.** La brukeren sette sin alder eller velge hvilken
  målgruppe hun vil se arrangementer for, og filtrere liste/kart/«Oppdag»
  deretter. Lagres på kontoen når brukeren er innlogget, ellers lokalt.
- [ ] **Ekstern billett-lenke på arrangementer.** Valgfritt «billett-URL»-felt
  som gir en «Kjøp billett»-knapp som deep-linker ut. Ingen betaling, refusjon
  eller billett-compliance i vår plattform.

Rekkefølge: metadata og billett-lenke er forutsetninger; målgruppefilteret bygger
oppå kontomodellen (server-side favoritter) fra listen over.

### Billettsystem-integrasjoner (research 25. august 2026)

Mål: la organisasjoner synkronisere arrangementer fra eksisterende
billettsystemer inn i «Skjer det noe?». Vi importerer bare metadata og en
billett-URL og deep-linker ut for selve kjøpet — ingen betaling, billettdata
eller PCI-/GDPR-eksponering hos oss. Dette gjenbruker mønstrene fra
kalenderimporten (`lib/feeds.ts`: idempotent upsert på ekstern id, sikkerhetshardet
henting i `lib/feed-security.ts`, geokoding, feedlås, statuslogging).

Legitimasjonsmodell: for de fleste leverandører oppretter organisasjonen selv en
API-nøkkel/token hos leverandøren og limer den inn hos oss. Legitimasjon lagres
server-side med eierskaps-scope (som dagens API-nøkler og kalenderfeeds), aldri i
klient eller MCP, og token-utløp håndteres (f.eks. DX-token som varer 1 år).

- [ ] **Generisk kilde-connector.** Adapter-mønster som normaliserer eksterne
  arrangementer til `events` (idempotent på `source` + ekstern id, lagrer
  `ticket_url`). Gjenbruk feedlås, geokoding og statuslogging fra `syncFeed`.
  Bygg connector-kjernen først, så leverandøradaptere etterspørselsdrevet: når
  første organisasjon ber om f.eks. DX, bygger vi den ene adapteren og den blir
  deretter et gjenbrukbart valg for alle andre organisasjoner.
- [ ] **ICS-kalenderfeed.** Finnes allerede; dokumentér den som den enkleste
  veien for arrangører som eksponerer en kalender-URL.
- [ ] **TicketCo.** «TicketCo Media Services» REST/JSON-API. Norsk, driver
  allerede kommuner (svømmehaller m.m.). Prioritet 1 blant API-adapterne.
- [ ] **Billetto.** Offentlig utvikler-API (go.billetto.com/resources/developers).
  Prioritet 2.
- [ ] **eBillett/DX.** Offentlig API bekreftet: Personal Access Token (Bearer)
  fra id.dx.no + Partner ID (`GET public.dx.no/v1/services/1/partners/{PID}/events`),
  token gyldig 1 år. Krever at kunden ber DX om tilgang først. Håndter
  token-utløpsvarsel.
- [ ] **Leverandører uten selvbetjent offentlig API (f.eks. Tixly/TIX).** Ikke
  bygg automatisk kobling. Vis en «ta kontakt»-flyt som ber arrangøren kontakte
  oss/leverandøren for en avtalebasert integrasjon.

Åpne punkter å bekrefte per adapter mot leverandørens dokumentasjon før bygging:
felt (pris, bilde, kategori, billett-URL), rate limits og vilkår. Bruk alltid
offisielle API-er eller arrangør-oppgitte feeds — ikke skrap offentlige lister.

### Åpne registrering for flere aktørtyper og kommunal utgiverprofil

I dag er registreringen (`app/registrer/page.tsx`) frivillig-først i framingen, selv
om `is_volunteer`-flagget og `create_organization`-RPC-en teknisk tåler andre
aktører. Kommuner finnes bare i en admin-/modereringsrolle, ikke som utgivere.
Profil-/avdelingsmodellen (organisasjon → profiler → aktiviteter/arrangementer)
finnes allerede og kan gjenbrukes for «ulike profiler».

- [ ] **Generaliser organisasjonstype.** Erstatt ja/nei på frivillig med en type
  (`frivillig`, `kommunal enhet`, `kulturinstitusjon`, `annen/næring`).
  Veiviseren spør «hva slags aktør er du?» først, i stedet for å anta frivillig.
- [ ] **Kommunal utgiverprofil.** La en kommune opptre som utgiver med flere
  profiler (bibliotek, kulturhus, ungdomsklubb, kulturkontor) via den
  eksisterende profil-/avdelingsmodellen. Holdes adskilt fra kommunens
  moderator-rolle: samme kommune kan både godkjenne andres innhold og legge ut
  sitt eget.
- [ ] **Behold publiseringsflyt og roller.** Nye aktørtyper starter som utkast og
  går gjennom godkjenning; RLS håndhever fortsatt tilgang. Verifiser at
  moderering er robust nok til at kommune-admin vil bruke den som portvakt.

### ChatGPT-app / MCP-connector for discovery

Mål: la folk søke i og kalle «Skjer det noe?» direkte fra ChatGPT (og lignende
AI-verktøy), som en ekstra discovery-kanal. Bygg videre på det eksisterende
MCP-endepunktet (`POST /api/mcp`, i preview med `list_categories` og
`list_municipalities`).

- [ ] **Utvid MCP-toolsene** med offentlig søk/oppslag av publiserte aktiviteter
  og arrangementer (nærhet, kommune, kategori), skrivebeskyttet og uten
  persondata — samme grenser som den offentlige feeden.
- [ ] **Pakk som ChatGPT-app/connector** oppå MCP-endepunktet, med tydelig
  beskrivelse, eksempelspørsmål og canonical lenker tilbake til plattformen.
- [ ] **Hold det offentlig og trygt.** Bare publisert innhold, aldri utkast,
  API-nøkler eller kontoavgrensede tools i den offentlige connectoren.

### Kart-forbedringer (vurdert mot Kulby-kartet 25. august 2026)

Kartet ([app/kart](app/kart), `components/ListingMap.tsx`) plotter i dag
enkeltoppføringer. Kulby plotter steder/arrangører og viser arrangørens kommende
arrangementer i en bunn-sheet — smartere når mange events deler samme sted.
OpenStreetMap-valget beholdes (billigere og mer fleksibelt enn Mapbox).

- [ ] **Arrangør-/stedssentrisk lag.** Én markør per arrangør/lokasjon; klikk
  åpner en bunn-sheet med arrangørens oppføringer. Gjenbruk organisasjonsmodellen
  (organisasjon → profiler → aktiviteter/arrangementer) og `OrganisationCard`.
- [ ] **Markør-klynging.** Legg til clustering (f.eks. Leaflet.markercluster) så
  kartet tåler mange events uten overlappende markører.
- [ ] **Mer immersivt kart.** Vurder et mer full-bleed kart for en tydeligere
  utforskningsopplevelse.
- [ ] **Produksjons-tile-leverandør.** Den offentlige `tile.openstreetmap.org`
  er ikke ment for tung produksjonstrafikk. Bytt til en tile-leverandør
  (MapTiler, Stadia eller selvhostet Protomaps) før nasjonal skala — Leaflet
  beholdes uendret.

### Mobil/app-discovery (vurdert mot Kulby-appen 25. august 2026)

Utgangspunkt: mesteparten av trafikken vil være mobil nettside og app, så
discovery må utnytte liten skjermflate godt og gi en god opplevelse der først.
Behold vårt designspråk (ingen emoji, WCAG-fokus, Swipe/Oppdag) og la gratis
fritidstilbud være like synlig som billetterte arrangementer — ikke bare
kultur/arrangører slik Kulby vekter det.

- [ ] **Horisontale hyller på mobil.** Grupper innhold i skumbare rader (per
  arrangør/sted og per kategori/aktivitetstype) med tellebadge («7 denne uke»),
  i stedet for tunge vertikale band. Skalerer bedre når event-volumet vokser.
- [ ] **Tidsbaserte innganger + datofilter.** Legg til fremtredende «I dag / I
  helgen / Velg dato»-innganger. Tid er den viktigste filterdimensjonen for
  arrangementer og voksenretningen; i dag finnes bare «Skjer denne uka».
- [ ] **Følg arrangør/sted + «For deg» med begrunnelse.** La brukere følge et
  sted/arrangør; bruk det til en personlig rad med begrunnelse («Fordi du følger
  …»). Dette er den manglende brikken som gjør konto/favoritter/varsler/
  anbefalinger levende, og henger sammen med gruppe- og anbefalingspunktene over.

## Fase 0: Sikkerhet før lansering

Disse punktene bør behandles som lanseringsblokkere.

### [x] 0.1 Hindre selv-eskalering til plattformadministrator

**Problem:** En innlogget bruker kan oppdatere sin egen rad i `profiles`.
`UPDATE`-rettigheten omfatter også `is_platform_admin`, slik at brukeren kan gi
seg selv plattformtilgang.

**Berørte områder:**

- `supabase/migrations/20260624000007_auth_foundation.sql`
- `supabase/migrations/20260624000010_roles_and_registration.sql`

**Tiltak:**

- Opprett en ny migrasjon som begrenser vanlige brukere til trygge profilfelt,
  for eksempel `full_name`.
- Beskytt `is_platform_admin` med kolonne-rettigheter, trigger eller en separat,
  autorisert administrasjonsfunksjon.
- Kontroller om andre privilegerte profilfelt trenger samme beskyttelse.

**Ferdig når:**

- En vanlig bruker ikke kan endre `is_platform_admin` via Supabase-klienten.
- En plattformadministrator fortsatt kan administreres gjennom en eksplisitt,
  kontrollert prosess.
- En automatisert RLS-test dekker begge tilfellene.

### [x] 0.2 Beskytt publiseringsstatus for organisasjoner

**Problem:** Organisasjonsmedlemmer har bred `UPDATE`-tilgang og kan sette egen
organisasjon til `published` uten kommunal eller plattformbasert godkjenning.

**Berørte områder:**

- `supabase/migrations/20260624000010_roles_and_registration.sql`
- `components/admin/OrgStatusButton.tsx`

**Tiltak:**

- Hindre organisasjonsmedlemmer i å endre `status` direkte.
- Flytt godkjenning og arkivering til en autorisert databasefunksjon for kommune-
  og plattformadministratorer.
- Avklar om publisering av aktiviteter og arrangementer skal følge samme modell.

**Ferdig når:**

- Eiere og editorer kan redigere organisasjonsprofilen, men ikke godkjenne den.
- Bare korrekt kommuneadministrator eller plattformadministrator kan endre
  organisasjonens publiseringsstatus.
- Forsøk på direkte statusendring avvises av databasen.

### [x] 0.3 Håndhev eier- og editorrollene

**Problem:** `owner` og `editor` lagres, men autorisasjonssjekkene spør bare om
brukeren er medlem. En editor kan derfor administrere medlemmer og integrasjoner,
og kan i verste fall fjerne siste eier.

**Berørte områder:**

- `supabase/migrations/20260628000002_org_members.sql`
- `supabase/migrations/20260629000009_org_profiles.sql`
- `supabase/migrations/20260701000003_integrations_foundation.sql`

**Tiltak:**

- Innfør rollebevisste hjelpefunksjoner, for eksempel `is_org_owner()`.
- Begrens medlemsstyring, API-nøkler og andre sensitive innstillinger til eiere.
- Hindre at siste eier fjernes eller nedgraderes.
- Definer eksplisitt hvilke handlinger en editor kan utføre.

**Ferdig når:**

- Rolleoversikten er dokumentert og håndheves i RLS/RPC-er.
- En editor kan redigere innhold, men ikke administrere eiere eller API-nøkler.
- En organisasjon kan ikke ende uten minst én eier.

### [x] 0.4 Begrens tilgang til mediefiler

**Problem:** Alle innloggede brukere kan i dag oppdatere og slette alle objekter
i den offentlige `media`-bøtten.

**Berørte områder:**

- `supabase/migrations/20260628000003_media_storage.sql`
- `components/admin/ImageUploader.tsx`

**Tiltak:**

- Bruk eierskapsbaserte filstier, for eksempel `org/<organization-id>/...` og
  `municipality/<municipality-id>/...`.
- Kontroller filstien mot brukerens organisasjons-, profil- eller kommunetilgang
  i storage-policyene.
- Valider filtype og maksimal størrelse server-side eller i storage-reglene.
- Vurder opprydding av erstattede og foreldreløse filer.

**Ferdig når:**

- En bruker kan laste opp og endre filer bare innenfor egne områder.
- En bruker kan ikke overskrive eller slette en annen organisasjons filer.
- Offentlig lesing av publiserte bilder fungerer fortsatt.

### [ ] 0.5 Sikre kalenderhenting mot SSRF

**Status:** HTTPS, lokale/private IP-er og vertsnavn, redirectmål, timeout,
komprimerte svar og maksimal responsstørrelse er håndhevet og enhetstestet.
Tilkoblingspinning mot DNS-rebinding må verifiseres/løses i Cloudflare-runtime.

**Problem:** Kalenderfeed-URL-er lagres av organisasjonen og hentes senere fra
serveren. Dette kan brukes til å kontakte interne tjenester eller svært store og
langsomme ressurser.

**Berørte områder:**

- `components/admin/CalendarFeedsManager.tsx`
- `app/api/integrations/feeds/[id]/sync/route.ts`
- `lib/feeds.ts`

**Tiltak:**

- Godta bare `https` og eventuelt eksplisitt begrunnede `http`-kilder.
- Avvis localhost, private IP-områder, link-local-adresser og interne vertsnavn.
- Valider hvert redirectmål, ikke bare den opprinnelige URL-en.
- Legg inn timeout og maksimal responsstørrelse.
- Flytt URL-valideringen til en server-side grense som ikke kan omgås av klienten.

**Ferdig når:**

- Private og lokale mål avvises før nettverkskall.
- Redirect til et privat mål avvises.
- Hengende eller for store svar avbrytes kontrollert.
- Feilen vises forståelig uten å lekke intern nettverksinformasjon.

### [x] 0.6 Sikre sammenhengen mellom profil og oppføring

**Problem:** En profiladministrator kan administrere en oppføring basert på
`profile_id`, uten at databasen alltid sikrer at `organization_id` og
`municipality_id` tilhører samme profil.

**Berørte områder:**

- `supabase/migrations/20260629000009_org_profiles.sql`
- `activities`, `events` og `directory_listings`

**Tiltak:**

- Håndhev at profil, organisasjon og kommune samsvarer ved insert og update.
- Bruk constraints eller en databasefunksjon/trigger der en vanlig foreign key
  ikke er tilstrekkelig.
- Inkluder alle tre oppføringstypene i samme kontroll.

**Ferdig når:**

- Det er umulig å lagre en oppføring med motstridende profil, organisasjon og
  kommune.
- Eksisterende inkonsistente rader er kartlagt og rettet.
- Regresjonstester dekker oppretting og flytting av oppføringer.

### [ ] 0.7 Ikke cache private administrasjonssider

**Status:** Service workeren bruker nå eksplisitt offentlig allowlist, hopper over
private ruter/API og sletter gammel cache via ny cacheversjon. Produksjonsbrowser-
testen etter inn-/utlogging gjenstår fordi service workeren ikke registreres i dev.

**Problem:** Service workeren cacher alle vellykkede navigasjoner, inkludert
innloggede sider under `/admin`, `/kommune` og `/plattform`.

**Berørt område:** `public/sw.js`

**Tiltak:**

- Ekskluder autentiserte områder, API-ruter og andre private sider fra cache.
- Cache bare eksplisitt valgte offentlige navigasjoner og vellykkede, cachebare
  responser.
- Øk cacheversjonen slik at eldre private responser slettes ved aktivering.
- Verifiser oppførsel etter utlogging og på en delt enhet.

**Ferdig når:**

- Admininnhold aldri skrives til Cache Storage.
- Tidligere cache slettes ved oppgradering.
- Offentlig offline-fallback fungerer som før.

## Fase 1: Robust produksjonsdrift

### [ ] 1.1 Stram inn API-validering

**Status:** Strukturert payloadvalidering, feltgrenser, dato-/URL-/koordinatregler,
stabile 400/422-svar og skjulte databasefeil er implementert. Ratebegrensning
per API-nøkkel utsettes til Cloudflare KV eller tilsvarende er valgt.

**Berørte områder:**

- `app/api/v1/activities/route.ts`
- `app/api/v1/events/route.ts`
- `lib/api/listings.ts`

**Tiltak:**

- Valider hele request-kroppen med et strukturert skjema.
- Sett grenser for tekstlengder, alder, koordinater, datoer og URL-er.
- Krev at sluttdato er gyldig og ikke tidligere enn startdato.
- Returner stabile 4xx-feil for ugyldig input i stedet for ubehandlede 500-feil.
- Legg inn ratebegrensning per API-nøkkel og eventuelt IP.
- Returner ikke rå databasefeilmeldinger til klienten.

**Ferdig når:**

- Ugyldige payloads gir forutsigbare 400/422-svar.
- Gyldige payloads fungerer bakoverkompatibelt.
- Ratebegrensning og sentrale valideringsgrenser er testet.

### [ ] 1.2 Gjør kalender- og cron-synkronisering pålitelig

**Status:** Atomisk feedlås, idempotent lagring, kontroll av databasefeil,
korrekt telling, varighet og feilkategori er implementert. Volumtest mot
Cloudflare sine kjøretidsgrenser gjenstår.

**Tiltak:**

- Kontroller og håndter feil fra hver databaseoperasjon.
- Tell bare hendelser som faktisk er lagret.
- Unngå ubegrenset sekvensiell behandling; bruk kontrollert parallellitet eller
  kø/batching når volumet krever det.
- Hindre samtidige synkroniseringer av samme feed.
- Legg inn tydelig status, varighet og feilkategori per kjøring.

**Ferdig når:**

- Delvise feil rapporteres korrekt.
- Ny kjøring lager ikke duplikater.
- Samme feed kan ikke behandles parallelt på en skadelig måte.
- Cron-jobben holder seg innenfor Cloudflare sine kjøretidsgrenser.

### [ ] 1.3 Legg til feilgrenser og gode tomtilstander

**Status:** Rotgrense med retry er lagt til, og forsiden skiller nå databasefeil
fra tomme resultater. Egne grenser/loading-/not-found-tilstander for øvrige
offentlige og administrative ruter gjenstår.

**Tiltak:**

- Opprett relevante `error.tsx`, `loading.tsx` og `not-found.tsx`-filer.
- Skill mellom «ingen treff», «ikke konfigurert» og «tjenesten er utilgjengelig».
- Gi brukeren en gjenopprettingshandling der det er mulig.
- Unngå at databasefeil lydløst fremstår som tomme resultater.

**Ferdig når:**

- Viktige offentlige og administrative ruter har forståelige feiltilstander.
- En midlertidig Supabase-feil kan prøves på nytt uten full omstart av appen.

### [ ] 1.4 Etabler observability og driftsrutiner

**Tiltak:**

- Samle serverfeil med kontekst, uten tokens eller personopplysninger.
- Overvåk feilrate og varighet for API, kalenderjobber og databasekall.
- Lag varsling for gjentatte cron-feil og kritiske autentiseringsfeil.
- Dokumenter backup, restore-test, nøkkelrotasjon og hendelseshåndtering.

**Ferdig når:**

- En produksjonsfeil kan spores til rute og operasjon.
- Kritiske feil varsles uten at noen må lese Cloudflare-logger manuelt.
- Restore-prosedyren er testet minst én gang.

## Fase 2: Automatisert kvalitetskontroll

### [ ] 2.1 Opprett et lite, målrettet testfundament

Start med grensene som kan gi størst skade:

- RLS og rolleeskalering.
- Organisasjonsgodkjenning.
- Eier/editor-rettigheter.
- Storage-eierskap.
- Profil/organisasjon/kommune-integritet.
- API-validering og idempotens.
- SSRF-validering.

**Ferdig når:**

- `package.json` har tydelige kommandoer for enhetstester og relevante
  integrasjonstester.
- Testene kan kjøres lokalt uten produksjonshemmeligheter.
- Minst én negativ test finnes for hver sikkerhetsgrense over.

### [ ] 2.2 Legg til CI

**Status:** GitHub Actions-workflow (`.github/workflows/ci.yml`) kjører lint,
TypeScript-sjekk, enhetstester, tilgjengelighetskontroll (token-kontrast +
axe-ruter) og produksjonsbuild på push til `main` og alle pull requests.
Gjenstår: isolerte database-/RLS-tester (krever Supabase-hemmeligheter),
periodisk avhengighets-/sårbarhetsskann, og å slå på påkrevde kontroller
(branch protection) i repoinnstillingene.

**Tiltak:**

- Kjør lint, TypeScript-sjekk, tester og produksjonsbuild på pull requests.
- Kjør database-/RLS-tester i et isolert lokalt Supabase-miljø.
- Stopp merge når en påkrevd kontroll feiler.
- Legg til en periodisk avhengighets- og sårbarhetssjekk.

**Ferdig når:**

- Hver pull request får automatisk og reproduserbar kvalitetsstatus.
- En bevisst brutt RLS-test blokkerer merge.

## Fase 3: Tilgjengelighet og brukeropplevelse

### [x] 3.1 Rett ugyldige nestede interaksjoner

**Problem:** Flere steder ligger `Button`-komponenten, som rendrer `<button>`,
inni en Next.js `Link`. Det gir ugyldig HTML og uforutsigbar tastatur-/
skjermleseratferd.

**Tiltak:**

- La lenker styles som knapper uten å legge `<button>` inni `<a>`.
- Gå gjennom alle `Link` + `Button`-kombinasjoner.
- Bruk ekte lenker for navigasjon og knapper for handlinger.

**Ferdig når:**

- Ingen interaktive elementer er nestet i andre interaktive elementer.
- Navigasjon fungerer med tastatur og skjermleser.

### [ ] 3.2 Gjør dialoger og drawers tastaturkomplette

**Status:** Mobilinnstillinger har fokus inn, fokusfelle, Escape og fokusretur.
Adminmenyer er tastaturkomplette. Desktopinnstillinger og øvrige overlays
gjenstår.

**Tiltak:**

- Flytt fokus inn ved åpning.
- Hold fokus innenfor dialogen mens den er åpen.
- Lukk med Escape og returner fokus til utløseren.
- Hindre interaksjon med bakgrunnen.
- Start med mobilinnstillinger og admin-draweren.

**Ferdig når:**

- Hele dialogflyten kan gjennomføres uten mus.
- Fokusrekkefølge og skjermlesernavn er verifisert.

### [ ] 3.3 Verifiser WCAG-påstandene

**Tiltak:**

- Kjør automatiserte kontroller på sentrale offentlige og administrative ruter.
- Gjennomfør manuell tastatur-, zoom-, skjermleser- og redusert-bevegelse-test.
- Kontroller kontrast i lyst og mørkt tema.
- Oppdater tilgjengelighetserklæringen med faktiske kjente avvik og dato for
  siste test.

**Ferdig når:**

- Kritiske brukerreiser er kontrollert mot WCAG 2.2 AA.
- Kjente avvik er dokumentert med eier og planlagt rettedato.

## Fase 4: Ytelse og skalering

### [ ] 4.1 Begrens og paginer nærhetssøk

**Status:** Begge RPC-er har nå standardgrense og hard cap på 500; forsiden ber
kun om 6 aktiviteter og 3 arrangementer. Cursor/paginering og måling med
realistisk nasjonalt datavolum gjenstår.

**Problem:** RPC-ene kan returnere alle treff innenfor radiusen. Forsiden henter
hele resultatsettet før den kutter listen i applikasjonen.

**Berørte områder:**

- `supabase/migrations/20260702000003_richer_listing_fields.sql`
- `lib/listings.ts`
- `app/page.tsx`

**Tiltak:**

- Legg til sikker maksimalgrense og paginering/cursor i søke-RPC-ene.
- La forsiden be om bare antallet den viser.
- Mål spørringsplaner med realistisk nasjonalt datavolum.
- Kontroller indekser for status, tid, kommune, kategori og geografi.

**Ferdig når:**

- Ingen offentlig forespørsel kan returnere et ubegrenset antall rader.
- Forsiden henter ikke data den kaster bort.
- Ytelsesmål er dokumentert og målt med realistiske testdata.

### [ ] 4.2 Gjennomgå rendering og caching

**Tiltak:**

- Vurder hvilke offentlige sider som faktisk må være `force-dynamic`.
- Bruk trygg revalidering for offentlig kataloginnhold der det passer.
- Behold administrasjonssider dynamiske og private.
- Mål bundle-størrelse, kartlasting og Core Web Vitals på mobil.

**Ferdig når:**

- Offentlige sider har en eksplisitt cache-strategi.
- Private sider kan ikke deles mellom brukere via cache.
- De viktigste mobilrutene møter avtalte ytelsesmål.

## Fase 5: Dokumentasjon og vedlikehold

### [x] 5.1 Oppdater prosjektstatusen

README beskriver admin-UI som ikke bygget, selv om store deler nå finnes.

**Tiltak:**

- Oppdater funksjonsstatus og arkitekturoversikt i `README.md`.
- Dokumenter rollemodellen og godkjenningsflyten.
- Dokumenter integrasjonenes sikkerhetsgrenser og driftskrav.
- Hold denne planen oppdatert når tiltak fullføres eller endres.

**Ferdig når:**

- README samsvarer med faktisk funksjonalitet.
- En ny utvikler kan forstå roller, dataflyt og lokale verifikasjonskommandoer.

## Anbefalt leveringsrekkefølge

| Leveranse | Omfang | Avhengighet |
| --- | --- | --- |
| 1 | Selv-eskalering og beskyttet publiseringsstatus | Ingen |
| 2 | Eier/editor-modell og medlemsstyring | Leveranse 1 |
| 3 | Storage-policyer og filstier | Rollemodellen |
| 4 | Profil–organisasjon–kommune-integritet | Rollemodellen |
| 5 | SSRF-sikring og privat service worker-cache | Ingen |
| 6 | Sikkerhetsregresjonstester og CI | Leveranse 1–5 |
| 7 | API-validering og robust synkronisering | Testfundament |
| 8 | Feiltilstander og observability | Ingen |
| 9 | Tilgjengelighetsrettinger og verifikasjon | Ingen |
| 10 | Paginering, caching og ytelsesmåling | Stabil datamodell |
| 11 | README og endelig driftsdokumentasjon | Løpende |

## Verifikasjon per leveranse

Bruk den smaleste relevante kontrollen under utvikling, og kjør hele settet før
en leveranse avsluttes:

```bash
pnpm test
pnpm test:integration
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

`pnpm test:integration` krever Supabase-variablene i `.env` og
`SUPABASE_TEST_PASSWORD` for de dokumenterte testkontoene.

## Beslutninger som må tas

Følgende produktbeslutninger bør avklares når den aktuelle leveransen starter:

- Skal organisasjoner kunne publisere egne aktiviteter og arrangementer direkte
  etter at selve organisasjonen er godkjent?
- Skal kommuneadministratorer kunne redigere organisasjonsinnhold, eller bare
  godkjenne og moderere det?
- Avklart: `owner` styrer medlemmer, roller, API-nøkler og kalenderintegrasjoner.
  `editor` kan redigere innhold, men ikke eiere eller integrasjonshemmeligheter.
- Skal API-nøkler ha finmaskede scopes, eller er én organisasjonsomfattende
  nøkkeltype tilstrekkelig i første versjon?
- Hvilke responstids- og tilgjengelighetsmål skal gjelde før nasjonal utrulling?

## Kort statusoversikt

- [ ] Fase 0: Delvis ferdig — 0.1–0.4 og 0.6 verifisert; runtime-test for 0.5 og 0.7 gjenstår
- [ ] Fase 1: Delvis ferdig — validering, synklås og første feilgrense levert; deploydrift gjenstår
- [ ] Fase 2: Delvis ferdig — målrettede tester finnes; CI og isolert lokal database gjenstår
- [ ] Fase 3: Delvis ferdig — 3.1 ferdig og mobil-dialog rettet; full WCAG-verifikasjon gjenstår
- [ ] Fase 4: Delvis ferdig — søk er begrenset; cursor, datavolummåling og cachemåling gjenstår
- [x] Fase 5: README, roller, sikkerhetsgrenser og verifikasjon er dokumentert