import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Personvern og vilkår – Skjer det noe?" };

export default function PersonvernOgVilkarPage() {
  return (
    <LegalPage title="Personvern og vilkår" updated="19. august 2026">
      <h2 id="personvern">Personvern</h2>
      <p>
        «Skjer det noe?» er en tjeneste fra Unge Vil som hjelper deg å finne faste aktiviteter og
        arrangementer i nærheten. Vi er opptatt av å samle inn så få personopplysninger som mulig.
      </p>

      <h3>Behandlingsansvarlig</h3>
      <p>
        Unge Vil er behandlingsansvarlig for personopplysningene som behandles gjennom tjenesten. Har du
        spørsmål om personvern, kontakt oss på <a href="mailto:org@ungevil.no">org@ungevil.no</a>.
      </p>

      <h3>For deg som besøker tjenesten</h3>
      <ul>
        <li>Du trenger verken konto eller innlogging for å bruke tjenesten.</li>
        <li>Favoritter lagres kun lokalt i nettleseren din og sendes ikke til oss.</li>
        <li>Språk, tema, lokasjonsmodus og standardkommune lagres på enheten din. GPS-koordinater lagres ikke.</li>
        <li>Anonyme sidevisninger brukes for å se hvilke oppføringer som er populære.</li>
        <li>Hvis du bruker «nær meg», brukes posisjonen midlertidig til avstandssortering og kommuneoppslag.</li>
      </ul>

      <h3>For organisasjoner og kommuner</h3>
      <p>
        Oppretter du en konto for å administrere en organisasjon eller kommune, behandler vi e-postadressen din
        og navnet på kontaktpersonen for å gi tilgang og administrere oppføringer.
      </p>

      <h3>Databehandlere og rettigheter</h3>
      <p>
        Vi bruker Supabase til database og autentisering, Cloudflare til hosting og Kartverket til kommuneoppslag.
        Du har rett til innsyn, retting og sletting av personopplysninger vi behandler om deg, og til å klage
        til Datatilsynet. Ta kontakt på <a href="mailto:org@ungevil.no">org@ungevil.no</a>.
      </p>

      <h2 id="vilkar">Vilkår for bruk</h2>
      <p>
        Disse vilkårene gjelder for bruk av «Skjer det noe?», en gratis oversikt over fritidsaktiviteter og
        arrangementer levert av Unge Vil.
      </p>

      <h3>Bruk av tjenesten</h3>
      <p>
        Tjenesten er åpen for alle. Du kan fritt bruke informasjonen til å finne og delta på aktiviteter og
        arrangementer.
      </p>

      <h3>Innhold og akseptabel bruk</h3>
      <p>
        Oppføringer publiseres av organisasjoner og kommuner, som selv er ansvarlige for at informasjonen er
        korrekt og oppdatert. Ikke forsøk å skaffe deg uautorisert tilgang, publiser ulovlig eller krenkende
        innhold, eller bruk tjenesten på en måte som forstyrrer driften eller andre brukere.
      </p>

      <h3>Ansvarsfraskrivelse og endringer</h3>
      <p>
        Tjenesten leveres «som den er». Unge Vil er ikke ansvarlig for tap eller skade som følge av bruk av
        tjenesten eller deltakelse på aktiviteter og arrangementer som er oppført. Vi kan oppdatere disse
        vilkårene. Fortsatt bruk av tjenesten innebærer at du aksepterer oppdaterte vilkår.
      </p>

      <h2 id="tilgjengelighet">Tilgjengelighet</h2>
      <p>
        «Skjer det noe?» skal kunne brukes av alle, uansett forutsetninger. Tjenesten er utviklet med universell
        utforming som utgangspunkt, og vi arbeider mot WCAG 2.2 på nivå AA.
      </p>

      <h3>Hva vi har gjort</h3>
      <ul>
        <li>Vi kontrollerer sentrale fargekombinasjoner automatisk i lyst og mørkt tema.</li>
        <li>Vi tester de viktigste offentlige sidene automatisk for WCAG A- og AA-brudd.</li>
        <li>De sentrale kontrollene kan brukes med tastatur og har synlig fokusmarkering.</li>
        <li>Farge brukes aldri alene for å formidle status eller kategorier.</li>
        <li>Redusert bevegelse er støttet.</li>
      </ul>

      <h3>Kjente begrensninger og tilbakemeldinger</h3>
      <p>
        Innhold fra kommuner og organisasjoner kan variere i tilgjengelighet. Opplever du noe som er vanskelig
        å bruke, kontakt oss på <a href="mailto:org@ungevil.no">org@ungevil.no</a>, så retter vi det så raskt
        som mulig. Manuell skjermleser-, zoom- og reflow-testing pågår fortsatt. Kommunene er selv ansvarlige
        for sine lovpålagte tilgjengelighetserklæringer.
      </p>
    </LegalPage>
  );
}
