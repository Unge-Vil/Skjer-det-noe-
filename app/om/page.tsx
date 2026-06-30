import Link from "next/link";
import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { Icon } from "@/components/ds/Icon";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = { title: "Om – Skjer det noe?" };
export const dynamic = "force-dynamic";

export default async function OmPage() {
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
        <h1 style={{ margin: "16px 0 16px", fontSize: "var(--fs-h1)", fontWeight: 800 }}>
          Om Skjer det noe<span style={{ color: "var(--accent)" }}>?</span>
        </h1>

        <div className="sdn-richtext" style={{ minHeight: 0, padding: 0 }}>
          <p>
            «Skjer det noe?» er en gratis oversikt over fritidsaktiviteter og arrangementer for barn og unge.
            Målet er å gjøre det enklere å finne noe å gjøre i nærområdet – uten innlogging og uten terskel.
          </p>

          <h2>Et initiativ fra Unge Vil</h2>
          <p>
            Tjenesten er et initiativ fra Unge Vil, som jobber for at flere barn og unge skal finne meningsfulle
            fritidstilbud og møteplasser. Vi tror at det å vite hva som skjer i nærmiljøet er et viktig steg på
            veien til å delta.
          </p>

          <h2>For innbyggere</h2>
          <p>
            Du kan søke, utforske på kart og lagre favoritter rett i nettleseren – helt uten konto. Aktiviteter
            er gratis eller lavterskel, og åpne for alle.
          </p>

          <h2>For kommuner og organisasjoner</h2>
          <p>
            Kommuner og lag/foreninger kan legge ut sine aktiviteter og arrangementer, lage egne profiler og
            informasjonssider, og nå innbyggerne der de leter. Vil dere være med? Ta kontakt på{" "}
            <a href="mailto:org@ungevil.no">org@ungevil.no</a>.
          </p>

          <h2>Tilgjengelig for alle</h2>
          <p>
            Tjenesten er universelt utformet og følger WCAG 2.2 AA, slik at flest mulig kan bruke den – uansett
            forutsetninger.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
