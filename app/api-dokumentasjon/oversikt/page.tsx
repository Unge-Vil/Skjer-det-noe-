import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Icon, type IconName } from "@/components/ds/Icon";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = {
  title: "API-dokumentasjon – Skjer det noe?",
  description:
    "Teknisk referanse for Skjer det noe?-API-et: autentisering, endepunkter, feltreferanse, feilkoder og eksempler for å publisere aktiviteter og arrangementer fra egne systemer.",
};

const BASE_URL = "https://skjerdetnoe.no";

/* ---------- Small presentational helpers (server component) ---------- */

const codeBlock: CSSProperties = {
  overflowX: "auto",
  margin: "0 0 4px",
  padding: 16,
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border-subtle)",
  background: "var(--surface-sunk)",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--fs-sm)",
  lineHeight: 1.6,
};

function CodeBlock({ children }: { children: ReactNode }) {
  return (
    <pre style={codeBlock}>
      <code>{children}</code>
    </pre>
  );
}

function Method({ verb }: { verb: "GET" | "POST" }) {
  const isWrite = verb === "POST";
  return (
    <code
      style={{
        display: "inline-block",
        minWidth: 46,
        padding: "2px 9px",
        borderRadius: "var(--radius-sm)",
        background: isWrite ? "var(--surface-brand-soft)" : "var(--surface-sunk)",
        border: "1px solid var(--border-subtle)",
        color: isWrite ? "var(--text-brand)" : "var(--text-muted)",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--fs-xs)",
        fontWeight: 800,
        textAlign: "center",
        letterSpacing: "0.03em",
      }}
    >
      {verb}
    </code>
  );
}

function Endpoint({ verb, path, children }: { verb: "GET" | "POST"; path: string; children: ReactNode }) {
  return (
    <div
      style={{
        margin: "0 0 14px",
        padding: "14px 16px",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        background: "var(--surface-card)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Method verb={verb} />
        <code style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-sm)", color: "var(--text-heading)", fontWeight: 700 }}>{path}</code>
      </div>
      <p style={{ margin: "9px 0 0", color: "var(--text-muted)", fontSize: "var(--fs-sm)", lineHeight: 1.55 }}>{children}</p>
    </div>
  );
}

type Row = { name: string; type: string; note: ReactNode };

function FieldTable({ caption, rows }: { caption: string; rows: Row[] }) {
  return (
    <div style={{ overflowX: "auto", margin: "0 0 8px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--fs-sm)" }}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {["Felt", "Type", "Beskrivelse"].map((h) => (
              <th
                key={h}
                scope="col"
                style={{
                  padding: "8px 12px",
                  borderBottom: "2px solid var(--border-strong)",
                  color: "var(--text-muted)",
                  fontSize: "var(--fs-xs)",
                  fontWeight: 800,
                  textAlign: "left",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td style={{ padding: "9px 12px", borderBottom: "1px solid var(--border-subtle)", verticalAlign: "top", whiteSpace: "nowrap" }}>
                <code style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", color: "var(--text-heading)", fontWeight: 700 }}>{row.name}</code>
              </td>
              <td style={{ padding: "9px 12px", borderBottom: "1px solid var(--border-subtle)", verticalAlign: "top", whiteSpace: "nowrap", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)" }}>
                {row.type}
              </td>
              <td style={{ padding: "9px 12px", borderBottom: "1px solid var(--border-subtle)", verticalAlign: "top", color: "var(--text-body)", lineHeight: 1.5 }}>
                {row.note}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusTable({ caption, rows }: { caption: string; rows: { code: string; when: ReactNode }[] }) {
  return (
    <div style={{ overflowX: "auto", margin: "0 0 8px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--fs-sm)" }}>
        <caption className="sr-only">{caption}</caption>
        <tbody>
          {rows.map((row) => (
            <tr key={row.code}>
              <td style={{ padding: "9px 12px", borderBottom: "1px solid var(--border-subtle)", verticalAlign: "top", whiteSpace: "nowrap" }}>
                <code style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", color: "var(--text-heading)", fontWeight: 700 }}>{row.code}</code>
              </td>
              <td style={{ padding: "9px 12px", borderBottom: "1px solid var(--border-subtle)", verticalAlign: "top", color: "var(--text-body)", lineHeight: 1.5 }}>
                {row.when}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Mono({ children }: { children: ReactNode }) {
  return <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.92em", color: "var(--text-heading)" }}>{children}</code>;
}

const navSections: { id: string; label: string; icon: IconName }[] = [
  { id: "intro", label: "Introduksjon", icon: "info" },
  { id: "autentisering", label: "Autentisering", icon: "key" },
  { id: "rategrenser", label: "Rategrenser", icon: "clock" },
  { id: "konvensjoner", label: "Konvensjoner", icon: "sliders-horizontal" },
  { id: "endepunkter", label: "Endepunkter", icon: "plug" },
  { id: "felt", label: "Feltreferanse", icon: "list" },
  { id: "kategorier", label: "Kategorier", icon: "tag" },
  { id: "svar", label: "Svar og statuskoder", icon: "check-circle-2" },
  { id: "feil", label: "Feil", icon: "ban" },
  { id: "eksempler", label: "Eksempler", icon: "clipboard-list" },
];

export default function ApiDocumentationPage() {
  return (
    <>
      <main id="main" className="sdn-page-enter" style={{ maxWidth: 960, margin: "0 auto", padding: "42px 20px 70px" }}>
        <Link
          href="/hjelp"
          style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--text-link)", fontSize: "var(--fs-sm)", fontWeight: 700, textDecoration: "none" }}
        >
          <Icon name="arrow-left" size={16} /> Til hjelpesenteret
        </Link>

        <p style={{ margin: "42px 0 10px", color: "var(--text-brand)", fontSize: "var(--fs-sm)", fontWeight: 800 }}>API-dokumentasjon</p>
        <h1 style={{ margin: "0 0 12px", color: "var(--text-heading)", fontSize: "var(--fs-h1)", lineHeight: 1.08, fontWeight: 850 }}>
          Skjer det noe? REST API
        </h1>
        <p style={{ maxWidth: 680, margin: "0 0 20px", color: "var(--text-muted)", fontSize: "var(--fs-lg)", lineHeight: 1.5 }}>
          Publiser og oppdater aktiviteter, arrangementer og endringsmeldinger automatisk fra organisasjonens egne systemer. API-et er et enkelt
          JSON over HTTPS-grensesnitt med nøkkelbasert autentisering.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 34 }}>
          <span style={{ padding: "5px 12px", borderRadius: "var(--radius-pill)", background: "var(--surface-sunk)", color: "var(--text-muted)", fontSize: "var(--fs-xs)", fontWeight: 700 }}>
            Base-URL: <code style={{ fontFamily: "var(--font-mono)" }}>{BASE_URL}</code>
          </span>
          <span style={{ padding: "5px 12px", borderRadius: "var(--radius-pill)", background: "var(--surface-sunk)", color: "var(--text-muted)", fontSize: "var(--fs-xs)", fontWeight: 700 }}>
            Versjon: <code style={{ fontFamily: "var(--font-mono)" }}>v1</code>
          </span>
          <span style={{ padding: "5px 12px", borderRadius: "var(--radius-pill)", background: "var(--surface-sunk)", color: "var(--text-muted)", fontSize: "var(--fs-xs)", fontWeight: 700 }}>
            Format: JSON
          </span>
        </div>

        {/* On-page navigation */}
        <nav aria-label="På denne siden" style={{ margin: "0 0 40px", padding: 18, border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", background: "var(--surface-card)" }}>
          <p style={{ margin: "0 0 12px", color: "var(--text-muted)", fontSize: "var(--fs-xs)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>På denne siden</p>
          <ul style={{ listStyle: "none", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 6, margin: 0, padding: 0 }}>
            {navSections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 4px", color: "var(--text-link)", fontSize: "var(--fs-sm)", fontWeight: 600, textDecoration: "none" }}>
                  <Icon name={section.icon} size={16} color="var(--icon-brand)" /> {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sdn-richtext" style={{ maxWidth: 720, padding: 0 }}>
          {/* 1. Intro */}
          <h2 id="intro">Introduksjon</h2>
          <p>
            API-et lar organisasjoner sende innhold til Skjer det noe? fra et system de allerede bruker, slik at de slipper å registrere det samme
            to steder. Alle endepunkter ligger under <Mono>{`${BASE_URL}/api/v1`}</Mono> og svarer med JSON. Bruk API-et når kildesystemet ditt eier
            innholdet, og du vil at endringer der skal speiles hos oss.
          </p>
          <ul>
            <li>Alle forespørsler må gå over HTTPS og autentiseres med en API-nøkkel.</li>
            <li>En organisasjonsnøkkel kan bare lese og endre sin egen organisasjons oppføringer.</li>
            <li>Opprett, oppdater og list opp uten å bygge egen synkroniseringslogikk – bruk <Mono>external_ref</Mono> for idempotens.</li>
          </ul>

          {/* 2. Auth */}
          <h2 id="autentisering">Autentisering</h2>
          <p>
            Opprett en API-nøkkel under organisasjonens <strong>Integrasjoner → API</strong>. Nøkkelen vises bare én gang – kopier den og lagre
            den som en hemmelighet. Send den som en Bearer-token i <Mono>Authorization</Mono>-headeren på hver forespørsel.
          </p>
          <CodeBlock>Authorization: Bearer sdn_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</CodeBlock>
          <p>Det finnes to nøkkeltyper med hvert sitt prefiks:</p>
          <FieldTable
            caption="Nøkkeltyper"
            rows={[
              { name: "sdn_live_…", type: "organisasjon", note: <>Full tilgang til å opprette, oppdatere og liste organisasjonens egne aktiviteter, arrangementer og endringsmeldinger.</> },
              { name: "sdn_muni_…", type: "kommune", note: <>Lesetilgang til publiserte oppføringer i kommunen. Kan ikke opprette eller endre innhold.</> },
            ]}
          />
          <p>
            Nøkkelen er knyttet til én organisasjon (eller kommune). API-et avviser forespørsler uten en gyldig, aktiv nøkkel med <Mono>401</Mono>.
            Del aldri nøkkelen i klientkode eller offentlige repositorier, og logg den aldri. Er en nøkkel lekket, tilbakekall den umiddelbart og
            opprett en ny.
          </p>

          {/* 3. Rate limits */}
          <h2 id="rategrenser">Rategrenser</h2>
          <p>
            Forespørsler begrenses både per IP-adresse og per nøkkel innenfor et rullerende vindu på 60 sekunder. Overskrider du grensen, svarer
            API-et med <Mono>429</Mono> og en <Mono>Retry-After</Mono>-header som forteller hvor mange sekunder du bør vente.
          </p>
          <FieldTable
            caption="Rategrenser per minutt"
            rows={[
              { name: "POST (skriv)", type: "30 / nøkkel", note: <>Maks 30 opprettelser eller oppdateringer per nøkkel per minutt, og 60 per IP.</> },
              { name: "GET (les)", type: "120 / nøkkel", note: <>Maks 120 leseforespørsler per nøkkel per minutt, og 120 per IP.</> },
            ]}
          />
          <p>Bygg inn en enkel backoff som respekterer <Mono>Retry-After</Mono>, så unngår du å bli begrenset ved store importer.</p>

          {/* 4. Conventions */}
          <h2 id="konvensjoner">Konvensjoner</h2>
          <h3>JSON og innhold</h3>
          <p>
            Send <Mono>Content-Type: application/json</Mono> på alle skriveforespørsler. Ugyldig JSON gir <Mono>400 invalid_json</Mono>. Tekstfelt
            trimmes for mellomrom, og tomme strenger behandles som «ikke satt».
          </p>
          <h3>Idempotens med external_ref</h3>
          <p>
            Sett feltet <Mono>external_ref</Mono> til en stabil identifikator fra kildesystemet ditt (for eksempel en intern ID). Sender du samme
            {" "}<Mono>external_ref</Mono> på nytt, oppdaterer API-et den eksisterende oppføringen i stedet for å lage en dublett. Det gjør det trygt
            å kjøre den samme importen flere ganger.
          </p>
          <h3>Auto-publisering</h3>
          <p>
            Hver nøkkel har en innstilling for auto-publisering. Er den på, publiseres nye oppføringer direkte (<Mono>status: published</Mono>). Er
            den av, opprettes de som utkast (<Mono>status: draft</Mono>) og må publiseres manuelt av organisasjonen. Innstillingen styres på
            nøkkelen, ikke i forespørselen.
          </p>
          <h3>Referanser</h3>
          <p>Noen felt viser til andre ressurser med lesbare verdier i stedet for interne ID-er:</p>
          <ul>
            <li><Mono>category</Mono> / <Mono>categories</Mono> – kategori-slug, se listen under.</li>
            <li><Mono>municipality</Mono> – kommunenummer (for eksempel <Mono>1106</Mono>) eller kommune-slug.</li>
            <li><Mono>profile</Mono> – slug for en av organisasjonens avdelingsprofiler.</li>
          </ul>

          {/* 5. Endpoints */}
          <h2 id="endepunkter">Endepunkter</h2>
          <h3>Aktiviteter</h3>
          <p>Faste eller gjentakende tilbud, som en ukentlig gamingkveld eller en åpen møteplass.</p>
          <Endpoint verb="POST" path="/api/v1/activities">Oppretter en aktivitet, eller oppdaterer en eksisterende med samme <Mono>external_ref</Mono>.</Endpoint>
          <Endpoint verb="GET" path="/api/v1/activities?limit=50">Lister organisasjonens aktiviteter, nyeste først. <Mono>limit</Mono> er 1–100 (standard 50).</Endpoint>

          <h3>Arrangementer</h3>
          <p>Enkelthendelser med et bestemt start- og eventuelt sluttidspunkt.</p>
          <Endpoint verb="POST" path="/api/v1/events">Oppretter et arrangement, eller oppdaterer et eksisterende med samme <Mono>external_ref</Mono>. Krever <Mono>starts_at</Mono>.</Endpoint>
          <Endpoint verb="GET" path="/api/v1/events?limit=50">Lister organisasjonens arrangementer, nyeste først. <Mono>limit</Mono> er 1–100 (standard 50).</Endpoint>

          <h3>Bilder</h3>
          <p>Last opp et bilde og bruk URL-en i <Mono>image_url</Mono> når du oppretter eller oppdaterer en aktivitet eller et arrangement.</p>
          <Endpoint verb="POST" path="/api/v1/media">Tar imot <Mono>multipart/form-data</Mono> med ett <Mono>file</Mono>-felt og returnerer <Mono>{'{ url }'}</Mono>. Godtar PNG, JPEG og WebP opptil 5 MB.</Endpoint>

          <h3>Endringsmeldinger</h3>
          <p>
            Marker at en enkelt forekomst av en aktivitet eller et arrangement er avlyst, stengt, endret eller har en beskjed – uten å endre selve
            oppføringen.
          </p>
          <Endpoint verb="POST" path="/api/v1/updates">Oppretter eller oppdaterer en endringsmelding for én dato. Krever <Mono>listing_kind</Mono>, <Mono>listing_id</Mono>, <Mono>occurrence_date</Mono> og <Mono>kind</Mono>.</Endpoint>
          <Endpoint verb="GET" path="/api/v1/updates?listing_kind=event&listing_id=…">Lister endringsmeldinger for en bestemt oppføring. Begge parametrene er påkrevd.</Endpoint>

          <h3>Kommune (lesetilgang)</h3>
          <p>Kun tilgjengelig med en kommunenøkkel (<Mono>sdn_muni_…</Mono>).</p>
          <Endpoint verb="GET" path="/api/v1/municipality/listings?kind=activities&limit=50">Lister publiserte oppføringer i kommunen. <Mono>kind</Mono> er <Mono>activities</Mono> (standard) eller <Mono>events</Mono>, og <Mono>limit</Mono> er 1–100.</Endpoint>

          {/* 6. Field reference */}
          <h2 id="felt">Feltreferanse</h2>
          <h3>Felles felt (aktiviteter og arrangementer)</h3>
          <FieldTable
            caption="Felles felt for aktiviteter og arrangementer"
            rows={[
              { name: "title", type: "string, ≤255", note: <><strong>Påkrevd.</strong> Navnet på tilbudet.</> },
              { name: "title_en", type: "string, ≤255", note: <>Engelsk tittel (valgfritt).</> },
              { name: "description", type: "string, ≤10000", note: <>Beskrivelse.</> },
              { name: "description_en", type: "string, ≤10000", note: <>Engelsk beskrivelse (valgfritt).</> },
              { name: "category", type: "slug", note: <>Én kategori. Se gyldige verdier under Kategorier.</> },
              { name: "categories", type: "slug[]", note: <>Flere kategorier, opptil 20.</> },
              { name: "municipality", type: "string", note: <>Kommunenummer eller kommune-slug.</> },
              { name: "profile", type: "slug", note: <>Avdelingsprofil i organisasjonen.</> },
              { name: "address", type: "string, ≤500", note: <>Gateadresse eller stedsnavn.</> },
              { name: "location", type: "{ lat, lng }", note: <>Koordinater. <Mono>lat</Mono> −90…90, <Mono>lng</Mono> −180…180.</> },
              { name: "area", type: "string, ≤255", note: <>Område eller bydel.</> },
              { name: "accessibility", type: "string, ≤2000", note: <>Informasjon om universell utforming.</> },
              { name: "age_min", type: "integer 0–120", note: <>Laveste anbefalte alder.</> },
              { name: "age_max", type: "integer 0–120", note: <>Høyeste anbefalte alder (≥ <Mono>age_min</Mono>).</> },
              { name: "price", type: "string, ≤255", note: <>Pris som tekst, for eksempel «Gratis» eller «50 kr».</> },
              { name: "url", type: "http(s) URL", note: <>Lenke til påmelding eller mer informasjon.</> },
              { name: "image_url", type: "http(s) URL", note: <>Lenke til et bilde. Last opp via <Mono>POST /api/v1/media</Mono>, eller bruk en offentlig ekstern bilde-URL.</> },
              { name: "external_ref", type: "string, ≤255", note: <>Din egen ID for idempotent oppdatering.</> },
            ]}
          />
          <h3>Kun aktiviteter</h3>
          <FieldTable
            caption="Felt som kun gjelder aktiviteter"
            rows={[
              { name: "weekday", type: "integer 0–6", note: <>Ukedag, der 0 er søndag og 6 er lørdag.</> },
              { name: "start_time", type: "HH:MM[:SS]", note: <>Starttidspunkt på dagen.</> },
              { name: "end_time", type: "HH:MM[:SS]", note: <>Sluttidspunkt på dagen.</> },
              { name: "recurrence_note", type: "string, ≤500", note: <>Fritekst om gjentakelse, for eksempel «Hver torsdag i skoleåret».</> },
              { name: "ends_on", type: "dato (YYYY-MM-DD)", note: <>Siste dato tilbudet gjelder.</> },
            ]}
          />
          <h3>Kun arrangementer</h3>
          <FieldTable
            caption="Felt som kun gjelder arrangementer"
            rows={[
              { name: "starts_at", type: "ISO 8601", note: <><strong>Påkrevd.</strong> Starttidspunkt, for eksempel <Mono>2026-09-01T18:00:00+02:00</Mono>.</> },
              { name: "ends_at", type: "ISO 8601", note: <>Sluttidspunkt (≥ <Mono>starts_at</Mono>).</> },
            ]}
          />
          <h3>Endringsmeldinger (updates)</h3>
          <FieldTable
            caption="Felt for endringsmeldinger"
            rows={[
              { name: "listing_kind", type: "\"event\" | \"activity\"", note: <><strong>Påkrevd.</strong> Hvilken type oppføring meldingen gjelder.</> },
              { name: "listing_id", type: "id", note: <><strong>Påkrevd.</strong> ID-en til oppføringen (må tilhøre organisasjonen).</> },
              { name: "occurrence_date", type: "dato (YYYY-MM-DD)", note: <><strong>Påkrevd.</strong> Datoen meldingen gjelder.</> },
              { name: "kind", type: "enum", note: <><strong>Påkrevd.</strong> <Mono>cancelled</Mono>, <Mono>closed</Mono>, <Mono>changed</Mono> eller <Mono>notice</Mono>.</> },
              { name: "message", type: "string", note: <>Beskjed til publikum.</> },
              { name: "reason", type: "string", note: <>Årsak (vises internt).</> },
              { name: "start_time", type: "HH:MM[:SS]", note: <>Nytt starttidspunkt. Må sendes sammen med <Mono>end_time</Mono>.</> },
              { name: "end_time", type: "HH:MM[:SS]", note: <>Nytt sluttidspunkt. Må sendes sammen med <Mono>start_time</Mono>.</> },
              { name: "external_ref", type: "string, ≤255", note: <>Din egen ID for idempotent oppdatering.</> },
            ]}
          />

          {/* 7. Categories */}
          <h2 id="kategorier">Kategorier</h2>
          <p>Gyldige verdier for <Mono>category</Mono> og <Mono>categories</Mono>:</p>
          <FieldTable
            caption="Kategori-slugs"
            rows={[
              { name: "gaming", type: "Gaming", note: <>Gaming og e-sport.</> },
              { name: "music", type: "Musikk", note: <>Musikk, band og øvingslokaler.</> },
              { name: "film", type: "Film", note: <>Film og media.</> },
              { name: "sports", type: "Sport", note: <>Idrett og fysisk aktivitet.</> },
              { name: "outdoor", type: "Friluftsliv", note: <>Uteliv og friluft.</> },
              { name: "creative", type: "Skapende", note: <>Kunst, håndverk og skaping.</> },
              { name: "social", type: "Møteplass", note: <>Sosiale møteplasser.</> },
              { name: "courses", type: "Kurs", note: <>Kurs og opplæring.</> },
              { name: "club", type: "Ungdomsklubb", note: <>Ungdomsklubber og fritidsklubber.</> },
            ]}
          />

          {/* 8. Responses */}
          <h2 id="svar">Svar og statuskoder</h2>
          <p>
            Ved opprettelse svarer API-et med <Mono>201</Mono>, og ved oppdatering av samme <Mono>external_ref</Mono> med <Mono>200</Mono>.
            Skriveendepunktene returnerer en kompakt kvittering:
          </p>
          <CodeBlock>{`{
  "id": "8f3c…",
  "slug": "apen-gamingkveld",
  "status": "draft",
  "url": "/aktivitet/apen-gamingkveld"
}`}</CodeBlock>
          <p>Leseendepunktene returnerer et objekt med en <Mono>data</Mono>-liste. Oversikten over statuskoder:</p>
          <StatusTable
            caption="Statuskoder"
            rows={[
              { code: "200 OK", when: <>Oppdatering eller vellykket henting.</> },
              { code: "201 Created", when: <>Ny oppføring ble opprettet.</> },
              { code: "400 invalid_json", when: <>Forespørselens body er ikke gyldig JSON.</> },
              { code: "401 invalid_key", when: <>Nøkkelen mangler, er ugyldig eller er tilbakekalt.</> },
              { code: "404 not_found", when: <>Oppføringen finnes ikke, eller tilhører ikke organisasjonen.</> },
              { code: "422 validation_error", when: <>Ett eller flere felt er ugyldige – se <Mono>details</Mono>.</> },
              { code: "429 rate_limited", when: <>Rategrensen er nådd. Se <Mono>Retry-After</Mono>.</> },
              { code: "500 internal_error", when: <>Uventet feil på tjeneren. Prøv igjen senere.</> },
            ]}
          />

          {/* 9. Errors */}
          <h2 id="feil">Feil</h2>
          <p>
            Feil returneres som JSON med et maskinlesbart <Mono>error</Mono>-felt og en <Mono>message</Mono>. Valideringsfeil (<Mono>422</Mono>)
            inkluderer i tillegg en <Mono>details</Mono>-liste med feltet og hva som er galt, slik at du kan rette forespørselen presist.
          </p>
          <CodeBlock>{`{
  "error": "validation_error",
  "message": "One or more fields are invalid",
  "details": [
    { "field": "starts_at", "message": "must be a valid date" },
    { "field": "age_max", "message": "must be greater than or equal to age_min" }
  ]
}`}</CodeBlock>

          {/* 10. Examples */}
          <h2 id="eksempler">Eksempler</h2>
          <h3>Opprett en aktivitet</h3>
          <CodeBlock>{`curl -X POST ${BASE_URL}/api/v1/activities \\
  -H "Authorization: Bearer sdn_live_…" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Åpen gamingkveld",
    "description": "Gratis tilbud hver torsdag.",
    "category": "gaming",
    "municipality": "1106",
    "weekday": 4,
    "start_time": "18:00",
    "end_time": "21:00",
    "price": "Gratis",
    "external_ref": "gaming-torsdag-01"
  }'`}</CodeBlock>

          <h3>Opprett et arrangement</h3>
          <CodeBlock>{`curl -X POST ${BASE_URL}/api/v1/events \\
  -H "Authorization: Bearer sdn_live_…" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Konsert i kulturhuset",
    "category": "music",
    "municipality": "1106",
    "starts_at": "2026-09-01T19:00:00+02:00",
    "ends_at": "2026-09-01T22:00:00+02:00",
    "external_ref": "konsert-2026-09-01"
  }'`}</CodeBlock>

          <h3>Meld en avlysning</h3>
          <CodeBlock>{`curl -X POST ${BASE_URL}/api/v1/updates \\
  -H "Authorization: Bearer sdn_live_…" \\
  -H "Content-Type: application/json" \\
  -d '{
    "listing_kind": "activity",
    "listing_id": "8f3c…",
    "occurrence_date": "2026-09-11",
    "kind": "cancelled",
    "message": "Avlyst denne uken på grunn av ferie."
  }'`}</CodeBlock>

          <h3>List organisasjonens arrangementer</h3>
          <CodeBlock>{`curl ${BASE_URL}/api/v1/events?limit=20 \\
  -H "Authorization: Bearer sdn_live_…"`}</CodeBlock>

          <div style={{ margin: "36px 0 0", padding: "18px 20px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", background: "var(--surface-brand-soft)" }}>
            <p style={{ margin: 0, color: "var(--text-body)", fontSize: "var(--fs-sm)", lineHeight: 1.6 }}>
              <strong>Trenger du hjelp?</strong> Kontakt oss på <a href="mailto:org@ungevil.no" style={{ color: "var(--text-link)", fontWeight: 600 }}>org@ungevil.no</a>. Se også
              veiledningene under <Link href="/hjelp/kategori/api-dokumentasjon" style={{ color: "var(--text-link)", fontWeight: 600 }}>API-dokumentasjon</Link> i hjelpesenteret.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
