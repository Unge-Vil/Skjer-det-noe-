import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Personvern – Skjer det noe?" };

export default function PersonvernPage() {
  return (
    <LegalPage title="Personvernerklæring" updated="20. august 2026">
      <p>
        «Skjer det noe?» er laget og driftes av J&amp;N Solutions. Konseptet har opphav i Unge Vil. Tjenesten
        hjelper deg å finne faste aktiviteter og arrangementer i nærheten, og vi er opptatt av å samle inn så få
        personopplysninger som mulig.
      </p>

      <h2>Behandlingsansvarlig</h2>
      <p>
        J&amp;N Solutions er behandlingsansvarlig for personopplysningene som behandles gjennom tjenesten. Har du
        spørsmål om personvern, kontakt oss på <a href="mailto:org@ungevil.no">org@ungevil.no</a>.
      </p>

      <h2>For deg som besøker tjenesten</h2>
      <ul>
        <li>Du trenger verken konto eller innlogging for å bruke tjenesten.</li>
        <li>
          Aktiviteter du lagrer som favoritter, lagres kun lokalt i nettleseren din – de sendes ikke til oss.
        </li>
        <li>
          Vi lagrer valg av språk, tema, lokasjonsmodus og standardkommune på enheten din, slik at tjenesten
          husker innstillingene dine. Vi lagrer ikke GPS-koordinatene dine.
        </li>
        <li>
          Vi teller anonyme sidevisninger for å se hvilke oppføringer som er populære. Disse tallene knyttes
          ikke til deg som person. Vi bruker ikke Google Analytics, sporingspiksler eller analytics-cookies.
          Rådata slettes etter 90 dager, og administratorer får bare se aggregerte tall for sitt område.
        </li>
        <li>
          Hvis du bruker «nær meg», sendes posisjonen midlertidig til tjenesten for å sortere oppføringer etter
          faktisk avstand. Den brukes også i et punkt-oppslag hos Kartverket for å finne kommunen du befinner
          deg i. Koordinatene lagres ikke av «Skjer det noe?».
        </li>
      </ul>

      <h2>For organisasjoner og kommuner</h2>
      <p>
        Oppretter du en konto for å administrere en organisasjon eller kommune, behandler vi e-postadressen din
        og navnet på kontaktpersonen for å gi tilgang og administrere oppføringer.
      </p>

      <h2>Databehandlere</h2>
      <p>Vi bruker disse leverandørene for å drifte tjenesten:</p>
      <ul>
        <li>Supabase – database og autentisering</li>
        <li>Cloudflare – hosting og levering av innhold</li>
        <li>Kartverket – oppslag av kommune fra posisjon</li>
      </ul>
      <p>De behandler data på våre vegne, og vi etterstreber lagring innenfor EU/EØS.</p>

      <h2>Dine rettigheter</h2>
      <p>
        Du har rett til innsyn, retting og sletting av personopplysninger vi behandler om deg, og til å klage
        til Datatilsynet. Ta kontakt for å bruke rettighetene dine.
      </p>

      <h2>Endringer</h2>
      <p>Vi kan oppdatere denne erklæringen. Vesentlige endringer varsles på denne siden.</p>

      <h2>Kontakt</h2>
      <p>
        Spørsmål om personvern: <a href="mailto:org@ungevil.no">org@ungevil.no</a>.
      </p>
    </LegalPage>
  );
}
