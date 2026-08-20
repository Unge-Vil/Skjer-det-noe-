export type HelpAudience = "innbyggere" | "organisasjoner" | "kommuner" | "integratører";

export type HelpCategory = "kom i gang" | "publisering" | "integrasjoner" | "konto";

export interface HelpArticle {
  slug: string;
  title: string;
  excerpt: string;
  audience: HelpAudience[];
  category: HelpCategory;
  keywords: string[];
  updatedAt: string;
}

export const HELP_AUDIENCES: { id: HelpAudience; label: string; description: string }[] = [
  { id: "innbyggere", label: "Innbyggere", description: "Finn aktiviteter, arrangementer og tilbud." },
  { id: "organisasjoner", label: "Organisasjoner", description: "Publiser tilbud og administrer profilen deres." },
  { id: "kommuner", label: "Kommuner", description: "Få oversikt og gjør lokale tilbud synlige." },
  { id: "integratører", label: "Integratører", description: "Koble tjenester og data til plattformen." },
];

export const HELP_CATEGORIES: { id: HelpCategory; label: string }[] = [
  { id: "kom i gang", label: "Kom i gang" },
  { id: "publisering", label: "Publisering" },
  { id: "integrasjoner", label: "Integrasjoner" },
  { id: "konto", label: "Konto" },
];

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "slik-finner-du-noe-a-gjore",
    title: "Slik finner du noe å gjøre",
    excerpt: "Søk etter aktiviteter, arrangementer og tilbud i nærheten av deg.",
    audience: ["innbyggere"],
    category: "kom i gang",
    keywords: ["søk", "kart", "aktivitet", "arrangement"],
    updatedAt: "2026-08-20",
  },
  {
    slug: "lagre-favoritter-uten-konto",
    title: "Lagre favoritter uten konto",
    excerpt: "Du kan ta vare på aktiviteter du liker, direkte i nettleseren.",
    audience: ["innbyggere"],
    category: "konto",
    keywords: ["lagre", "favoritt", "nettleser"],
    updatedAt: "2026-08-20",
  },
  {
    slug: "opprett-organisasjon",
    title: "Opprett en organisasjon",
    excerpt: "Kom i gang med organisasjonsprofil og gjør tilbudene deres synlige.",
    audience: ["organisasjoner"],
    category: "kom i gang",
    keywords: ["lag", "forening", "profil", "registrere"],
    updatedAt: "2026-08-20",
  },
  {
    slug: "publiser-en-aktivitet",
    title: "Publiser en aktivitet",
    excerpt: "Slik legger du ut en fast aktivitet som innbyggerne kan finne.",
    audience: ["organisasjoner"],
    category: "publisering",
    keywords: ["aktivitet", "publisere", "redigere"],
    updatedAt: "2026-08-20",
  },
  {
    slug: "publiser-et-arrangement",
    title: "Publiser et arrangement",
    excerpt: "Legg ut et engangsarrangement med tid, sted og praktisk informasjon.",
    audience: ["organisasjoner"],
    category: "publisering",
    keywords: ["arrangement", "event", "publisere"],
    updatedAt: "2026-08-20",
  },
  {
    slug: "for-kommuner",
    title: "Slik bruker kommunen plattformen",
    excerpt: "Få oversikt over kommunens rolle, organisasjoner og lokale tilbud.",
    audience: ["kommuner"],
    category: "kom i gang",
    keywords: ["kommune", "godkjenne", "oversikt"],
    updatedAt: "2026-08-20",
  },
  {
    slug: "kom-i-gang-med-api-et",
    title: "Kom i gang med API-et",
    excerpt: "Finn riktig API-nøkkel, endepunkt og neste steg for integrasjonen.",
    audience: ["integratører", "organisasjoner", "kommuner"],
    category: "integrasjoner",
    keywords: ["api", "nøkkel", "integrasjon", "utvikler"],
    updatedAt: "2026-08-20",
  },
  {
    slug: "bruk-offentlig-feed",
    title: "Bruk den offentlige feeden",
    excerpt: "Hent publiserte aktiviteter og arrangementer uten API-nøkkel.",
    audience: ["integratører", "kommuner"],
    category: "integrasjoner",
    keywords: ["feed", "json", "offentlig", "api"],
    updatedAt: "2026-08-20",
  },
];

export function getHelpArticle(slug: string) {
  return HELP_ARTICLES.find((article) => article.slug === slug);
}