# Forbedringsplan for plattformen

Sist oppdatert: 19. august 2026

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

- Velg og implementer ratebegrensning per API-nøkkel, for eksempel Cloudflare
  KV eller Durable Objects, og legg til stabile `429`-svar.
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
Adminmenyer, desktopinnstillinger og øvrige overlays gjenstår.

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