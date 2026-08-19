import Link from "next/link";
import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { Icon, type IconName } from "@/components/ds/Icon";
import { LinkButton } from "@/components/ds/LinkButton";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = { title: "For organisasjoner – Skjer det noe?" };
export const dynamic = "force-dynamic";

const features: { icon: IconName; title: string; body: string }[] = [
  { icon: "eye", title: "Gratis synlighet", body: "Vis frem aktivitetene deres for hele nærmiljøet – uten kostnad." },
  { icon: "pencil", title: "Registrer selv", body: "Logg inn og oppdater aktiviteter, arrangementer og profil når som helst." },
  { icon: "building-2", title: "Profil og avdelinger", body: "Egen organisasjonsside, med egne profiler/avdelinger per kommune." },
  { icon: "repeat", title: "Aktiviteter og arrangementer", body: "Legg ut både faste, ukentlige tilbud og enkeltstående arrangementer." },
  { icon: "plug", title: "Integrasjoner", body: "Koble til via API/Zapier eller synk en kalender (ICS) automatisk." },
  { icon: "image", title: "Bilder og rik tekst", body: "Logo, banner og fyldige beskrivelser som gir et godt førsteinntrykk." },
];

const steps = [
  "Registrer organisasjonen – vi henter navn og detaljer fra Brønnøysund.",
  "Fyll ut profilen med beskrivelse, kontaktinfo og bilder.",
  "Legg ut aktivitetene og arrangementene deres.",
  "Koble eventuelt til integrasjoner for automatisk publisering.",
];

const card = {
  background: "var(--surface-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-lg)",
  padding: 20,
} as const;

export default async function ForOrganisasjonerPage() {
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
          <h1 style={{ margin: "0 0 12px", fontSize: "var(--fs-h1)", fontWeight: 800 }}>For organisasjoner</h1>
          <p style={{ margin: 0, maxWidth: "var(--content-measure)", fontSize: "var(--fs-body-lg)", lineHeight: 1.5, color: "var(--text-body)" }}>
            Nå innbyggerne der de leter etter noe å gjøre. Legg ut aktiviteter, arrangementer og mer – gratis, og
            helt selvbetjent.
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
          <p style={{ margin: 0, fontWeight: 700, fontSize: "var(--fs-h4)" }}>Klar til å legge ut aktivitetene deres?</p>
          <div className="flex flex-wrap gap-3">
            <LinkButton href="/registrer" leadingIcon="sparkles">Registrer organisasjon</LinkButton>
            <LinkButton href="/logg-inn" variant="secondary">{t.nav.login}</LinkButton>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
