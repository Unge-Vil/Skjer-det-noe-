import Link from "next/link";
import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { Icon } from "@/components/ds/Icon";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = { title: "Tilgjengelighet – Skjer det noe?" };
export const dynamic = "force-dynamic";

export default async function TilgjengelighetPage() {
  const t = getDictionary(await getLocale());
  return (
    <>
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <Link
          href="/"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-link)", fontWeight: 600, fontSize: "var(--fs-sm)", textDecoration: "none" }}
        >
          <Icon name="arrow-left" size={15} />
          {t.footer.backHome}
        </Link>
        <h1 style={{ margin: "16px 0 16px", fontSize: "var(--fs-h1)", fontWeight: 800 }}>Tilgjengelighet</h1>

        <div className="sdn-richtext" style={{ minHeight: 0, padding: 0 }}>
          <p>
            «Skjer det noe?» skal kunne brukes av alle, uansett forutsetninger. Tjenesten er utviklet med
            universell utforming som utgangspunkt. Vi arbeider mot WCAG 2.2 på nivå AA.
          </p>

          <h2>Hva vi har gjort</h2>
          <ul>
            <li>Vi kontrollerer sentrale tekst-, kontroll- og fokusfarger automatisk i lyst og mørkt tema.</li>
            <li>Vi tester de viktigste offentlige sidene automatisk for WCAG A- og AA-brudd.</li>
            <li>De sentrale kontrollene kan brukes med tastatur og har synlig fokusmarkering.</li>
            <li>Farge brukes aldri alene – status og kategorier har alltid ikon og tekst.</li>
            <li>Redusert bevegelse er støttet, og brødtekst er aldri mindre enn 16px.</li>
          </ul>

          <h2>Kjente begrensninger</h2>
          <p>
            Innhold som legges ut av kommuner og organisasjoner (for eksempel bilder og innebygde skjemaer)
            kan variere i kvalitet. Vi veileder om alt-tekst og god praksis, men kan ikke garantere at alt
            tredjepartsinnhold er fullt tilgjengelig til enhver tid.
          </p>
          <p>
            Vi gjennomfører fortsatt manuelle tester med skjermleser, 200 % tekstforstørring, 400 % reflow og
            native app-teknologi. Tilgjengelighetstester av innloggede administrasjonsflater krever testkonto og
            kjøres separat.
          </p>

          <h2>Meld fra om problemer</h2>
          <p>
            Opplever du noe som er vanskelig å bruke, vil vi gjerne høre fra deg. Ta kontakt på{" "}
            <a href="mailto:org@ungevil.no">org@ungevil.no</a>, så retter vi det så raskt vi kan.
          </p>

          <h2>Kommunenes egne erklæringer</h2>
          <p>
            Hver kommune er selv ansvarlig for sin lovpålagte tilgjengelighetserklæring. Der en kommune har
            publisert sin erklæring, lenker vi til den fra kommunens egen side her.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
