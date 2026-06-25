export const nb = {
  locale: { label: "Språk", nb: "Norsk", en: "Engelsk" },
  theme: { label: "Tema", auto: "Auto", light: "Lyst", dark: "Mørkt" },
  nav: {
    skipToContent: "Hopp til innhold",
    tagline: "Faste aktiviteter og arrangementer i nærheten av deg.",
    home: "Hjem",
    explore: "Utforsk",
    login: "Logg inn",
  },
  hero: {
    eyebrowNear: "Aktiviteter nær deg",
    eyebrowIn: "Aktiviteter i {place}",
    searchPlaceholder: "Søk etter aktiviteter…",
    tagline:
      "Finn noe å gjøre nær deg. Gratis, lavterskel og åpent for alle – uten innlogging.",
  },
  landing: {
    thisWeek: "Skjer denne uka",
    thisWeekSub: "Arrangementer du kan bli med på",
    allEvents: "Alle arrangementer",
    nearby: "Aktiviteter nær deg",
    nearbySub: "Faste tilbud i nærområdet",
    seeMap: "Se på kart",
    empty: "Ingenting her ennå.",
  },
  cta: {
    title: "Er du en kommune eller organisasjon?",
    body: "Gjør det enkelt for innbyggerne å finne aktiviteter. Få din egen lokale portal.",
    forMunicipalities: "For kommuner",
    forOrganisations: "For organisasjoner",
  },
  footer: {
    tagline:
      "Et initiativ fra Unge Vil · skjerdetnoe.no · Tilgjengelig for alle (WCAG 2.2 AA)",
  },
  explorer: {
    nearMe: "Nær meg",
    allMunicipalities: "Alle kommuner",
    allCategories: "Alle kategorier",
    within: "Innen {km} km",
    results: "{count} treff",
    loading: "Laster…",
    all: "Alle",
    empty: "Ingen treff her. Prøv å øke radius eller endre filter.",
    notConfigured:
      "Supabase er ikke konfigurert ennå. Legg inn miljøvariablene i .env.local.",
    geoUnsupported: "Posisjon støttes ikke i denne nettleseren.",
    geoDenied: "Fikk ikke tilgang til posisjonen din.",
  },
  view: { list: "Liste", map: "Kart" },
  card: {
    activity: "Fast aktivitet",
    event: "Arrangement",
    moreInfo: "Mer info",
    ageRange: "{min}–{max} år",
    ageFrom: "Fra {min} år",
    ageTo: "Opptil {max} år",
  },
  status: {
    free: "Gratis",
    paid: "Koster",
    dropin: "Stikk innom",
    registration: "Påmelding",
    beginners: "Nybegynnere velkommen",
    accessible: "Universelt utformet",
    full: "Fullt",
    cancelled: "Avlyst",
  },
  categories: {
    gaming: "Gaming",
    music: "Musikk",
    film: "Film",
    sports: "Sport",
    outdoor: "Friluftsliv",
    creative: "Skapende",
    social: "Møteplass",
    courses: "Kurs",
    club: "Ungdomsklubb",
  },
};

export type Dictionary = typeof nb;
