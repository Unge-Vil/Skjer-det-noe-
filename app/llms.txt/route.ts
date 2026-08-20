import { absoluteUrl, SITE_NAME } from "@/lib/seo";

export function GET() {
  const content = `# ${SITE_NAME}

> En norsk oversikt over fritidsaktiviteter, arrangementer, organisasjoner, kommunesider, tjenester og frivilligoppdrag. Bruk kanoniske detaljsider som kilde og følg lenkene til oppdatert innhold.

Kun publisert, offentlig innhold er tilgjengelig. Utkast, kontoer, administrasjon og personlige søkeresultater er ikke offentlige kilder.

## Utforsk

- [Aktiviteter og arrangementer](${absoluteUrl("/utforsk")}): Finn aktiviteter og arrangementer etter sted, kategori og tidspunkt.
- [Organisasjoner](${absoluteUrl("/organisasjoner")}): Offentlige organisasjonsprofiler med aktiviteter og arrangementer.
- [Kommuner](${absoluteUrl("/kommuner")}): Kommunesider og lokalt, publisert innhold.
- [Tjenester](${absoluteUrl("/tjenester")}): Offentlige tjenester fra organisasjoner.
- [Frivilligtorg](${absoluteUrl("/frivilligtorg")}): Frivilligoppdrag og muligheter.

## Maskinlesbare innganger

- [Sitemap](${absoluteUrl("/sitemap.xml")}): Full liste over kanoniske, indekserbare URL-er.
- [Crawler-policy](${absoluteUrl("/robots.txt")}): Regler for automatisert innhenting.
- [Offentlig listing-feed](${absoluteUrl("/api/public/v1/listings?kind=activity")}): Publiserte oppføringer med canonical URL og oppdateringstid.
- [API-dokumentasjon](https://unge-vil.gitbook.io/skjer-det-noe/api-reference/): Dokumentasjon for organisasjons- og kommuneintegrasjoner.
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, must-revalidate",
    },
  });
}