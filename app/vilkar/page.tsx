import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Vilkår – Skjer det noe?" };

export default function VilkarPage() {
  return (
    <LegalPage title="Vilkår for bruk" updated="29. juni 2026">
      <p>
        Disse vilkårene gjelder for bruk av «Skjer det noe?», en gratis oversikt over fritidsaktiviteter og
        arrangementer levert av Unge Vil.
      </p>

      <h2>Bruk av tjenesten</h2>
      <p>
        Tjenesten er åpen for alle. Du kan fritt bruke informasjonen til å finne og delta på aktiviteter og
        arrangementer.
      </p>

      <h2>Innhold fra organisasjoner og kommuner</h2>
      <p>
        Oppføringer publiseres av organisasjoner og kommuner, som selv er ansvarlige for at informasjonen er
        korrekt og oppdatert. Unge Vil kan ikke garantere at all informasjon til enhver tid er riktig.
      </p>

      <h2>Akseptabel bruk</h2>
      <ul>
        <li>Ikke forsøk å skaffe deg uautorisert tilgang til tjenesten eller andres kontoer.</li>
        <li>Ikke publiser ulovlig, villedende, krenkende eller diskriminerende innhold.</li>
        <li>Ikke bruk tjenesten på en måte som forstyrrer driften eller andre brukere.</li>
      </ul>

      <h2>Ansvarsfraskrivelse</h2>
      <p>
        Tjenesten leveres «som den er». Unge Vil er ikke ansvarlig for tap eller skade som følge av bruk av
        tjenesten eller deltakelse på aktiviteter og arrangementer som er oppført.
      </p>

      <h2>Endringer</h2>
      <p>
        Vi kan oppdatere disse vilkårene. Fortsatt bruk av tjenesten innebærer at du aksepterer de oppdaterte
        vilkårene.
      </p>

      <h2>Kontakt</h2>
      <p>
        Spørsmål om vilkårene: <a href="mailto:org@ungevil.no">org@ungevil.no</a>.
      </p>
    </LegalPage>
  );
}
