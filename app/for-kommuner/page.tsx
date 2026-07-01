import Link from "next/link";
import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { Icon, type IconName } from "@/components/ds/Icon";
import { Button } from "@/components/ds/Button";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = { title: "For kommuner – Skjer det noe?" };
export const dynamic = "force-dynamic";

const features: { icon: IconName; title: string; body: string }[] = [
  { icon: "map-pin", title: "Egen lokal portal", body: "Én oversikt over fritidstilbud, arrangementer og frivillighet i kommunen." },
  { icon: "file-text", title: "Infosider", body: "Bygg egne informasjonssider med en enkel drag-and-drop-editor." },
  { icon: "layout-dashboard", title: "Oversikt og nøkkeltall", body: "Godkjenn organisasjoner og følg med på aktivitet i kommunen." },
  { icon: "accessibility", title: "Universelt utformet", body: "Følger WCAG 2.2 AA, så tjenesten er tilgjengelig for alle innbyggere." },
  { icon: "map", title: "Kart og søk", body: "Innbyggerne finner raskt tilbud i sitt eget nærområde." },
  { icon: "users-round", title: "Administrer tilgang", body: "Gi lokale lag og foreninger tilgang til å legge ut selv." },
];

const steps = [
  "Ta kontakt, så setter vi opp kommunen deres.",
  "Fyll ut kommuneprofil, kontaktinfo og infosider.",
  "Inviter organisasjoner og gi dem tilgang.",
  "Innbyggerne får én samlet oversikt over hva som skjer.",
];

const card = {
  background: "var(--surface-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-lg)",
  padding: 20,
} as const;

export default async function ForKommunerPage() {
  const t = getDictionary(await getLocale());
  return (
    <>
      <main id="main" className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <Link
          href="/"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-link)", fontWeight: 600, fontSize: "var(--fs-sm)", textDecoration: "none" }}
        >
          <Icon name="arrow-left" size={15} />
          {t.footer.backHome}
        </Link>

        <header style={{ margin: "16px 0 28px" }}>
          <h1 style={{ margin: "0 0 12px", fontSize: "var(--fs-h1)", fontWeight: 800 }}>For kommuner</h1>
          <p style={{ margin: 0, maxWidth: "var(--content-measure)", fontSize: "var(--fs-body-lg)", lineHeight: 1.5, color: "var(--text-body)" }}>
            Gi innbyggerne én samlet oversikt over fritidstilbud, arrangementer og frivillighet – i deres egen
            lokale portal.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2" style={{ marginBottom: 32 }}>
          {features.map((f) => (
            <div key={f.title} style={{ ...card, display: "flex", gap: 14 }}>
              <span style={{ flex: "none", display: "inline-flex", width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-md)", background: "var(--surface-brand-soft)", color: "var(--text-brand)" }}>
                <Icon name={f.icon} size={20} />
              </span>
              <div>
                <h2 style={{ margin: "0 0 4px", fontSize: "var(--fs-h4)", fontWeight: 700 }}>{f.title}</h2>
                <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)", lineHeight: 1.5 }}>{f.body}</p>
              </div>
            </div>
          ))}
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: "var(--fs-h2)", fontWeight: 800 }}>Slik kommer dere i gang</h2>
          <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
            {steps.map((s, i) => (
              <li key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ flex: "none", display: "inline-flex", width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-pill)", background: "var(--surface-brand-strong)", color: "var(--text-on-brand)", fontWeight: 700, fontSize: "var(--fs-sm)" }}>
                  {i + 1}
                </span>
                <span style={{ paddingTop: 3, color: "var(--text-body)", lineHeight: 1.5 }}>{s}</span>
              </li>
            ))}
          </ol>
        </section>

        <section style={{ ...card, background: "var(--surface-brand-soft)", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "var(--fs-h4)" }}>Vil dere ha deres egen portal?</p>
          <a href="mailto:org@ungevil.no"><Button leadingIcon="mail">Ta kontakt</Button></a>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
