import type { IconName } from "@/components/ds/Icon";

export type HelpCategory = "Kom i gang" | "For organisasjoner" | "For kommuner" | "Konto og personvern" | "API-dokumentasjon";

/** A small icon + label + text block, rendered as a card grid for scanning. */
export type HelpCard = { icon: IconName; title: string; body: string };

/** A highlighted note with an icon, used sparingly for the one thing that matters. */
export type HelpCallout = { icon: IconName; title: string; body: string };

export type HelpLink = { href: string; label: string };

export type HelpSection = {
  heading: string;
  paragraphs?: string[];
  list?: string[];
  cards?: HelpCard[];
  callout?: HelpCallout;
  link?: HelpLink;
};

export type HelpArticle = {
  slug: string;
  title: string;
  description: string;
  category: HelpCategory;
  icon: IconName;
  readTime: string;
  sections: HelpSection[];
};

export const helpArticles: HelpArticle[] = [
  {
    slug: "kom-i-gang",
    title: "Kom i gang med Skjer det noe?",
    description: "Finn aktiviteter, arrangementer og organisasjoner nær deg.",
    category: "Kom i gang",
    icon: "sparkles",
    readTime: "3 min",
    sections: [
      {
        heading: "Tre måter å finne tilbud på",
        paragraphs: ["Du kan lete frem tilbud på den måten som passer deg best. Alle tre gir de samme oppføringene, bare sortert og vist på ulik måte."],
        cards: [
          { icon: "search", title: "Søk", body: "Skriv inn et navn, sted eller en interesse i søkefeltet på forsiden." },
          { icon: "layout-dashboard", title: "Utforsk", body: "Bla gjennom alle aktiviteter og arrangementer, og filtrer på kategori og kommune." },
          { icon: "map", title: "Kart", body: "Se hvor tilbudene er, og finn det som ligger nærmest deg." },
        ],
      },
      {
        heading: "Åpne en oppføring",
        paragraphs: ["Trykk på en oppføring for å se tid, sted, pris, aldersgruppe og kontaktinformasjon. Er det påmelding eller en nettside, finner du lenken samme sted."],
      },
      {
        heading: "Du trenger ikke konto",
        paragraphs: ["Alle kan søke, utforske og lagre favoritter uten å logge inn. Konto er bare for organisasjoner, kommuner og inviterte administratorer."],
        callout: { icon: "shield-check", title: "Ingen innlogging for å lete", body: "Du kan bruke hele tjenesten som innbygger uten å oppgi noe om deg selv." },
      },
    ],
  },
  {
    slug: "sok-og-filtrer",
    title: "Søk og filtrer etter noe som passer",
    description: "Finn riktig aktivitet ved å kombinere søk, kategori og kommune.",
    category: "Kom i gang",
    icon: "search",
    readTime: "3 min",
    sections: [
      {
        heading: "Start med et søk",
        paragraphs: ["Skriv inn et navn, sted eller en interesse. Søket finner aktiviteter, arrangementer og organisasjoner som passer teksten din."],
      },
      {
        heading: "Filtrer resultatene",
        paragraphs: ["Kombiner filtrene for å snevre inn, eller fjern et filter for å se et bredere utvalg."],
        list: [
          "Kategori – for eksempel sport, musikk, gaming eller møteplass.",
          "Kommune – vis bare tilbud i et bestemt område.",
          "Dato – finn arrangementer på en dag som passer.",
          "Avstand – sorter etter hva som er nærmest når du deler posisjon.",
        ],
      },
    ],
  },
  {
    slug: "kart-og-naer-meg",
    title: "Bruk kartet og Finn nær meg",
    description: "Se hvor tilbudene er, og sorter etter avstand når du vil.",
    category: "Kom i gang",
    icon: "map",
    readTime: "3 min",
    sections: [
      {
        heading: "Velg område eller del posisjon",
        paragraphs: [
          "Velg en kommune for et stabilt søk i et bestemt område. Med Finn nær meg kan nettleseren bruke posisjonen din til å vise det nærmeste først.",
          "Du bestemmer selv om nettleseren skal få tilgang til posisjonen. Avslår du, kan du fortsatt bruke kommune og kart manuelt.",
        ],
        callout: { icon: "shield-check", title: "Posisjonen lagres ikke", body: "Deler du posisjon, brukes den bare der og da for å sortere etter avstand. GPS-koordinatene dine lagres ikke." },
      },
    ],
  },
  {
    slug: "lagre-favoritter",
    title: "Lagre favoritter uten konto",
    description: "Slik holder du oversikt over aktivitetene du vil huske.",
    category: "Kom i gang",
    icon: "heart",
    readTime: "2 min",
    sections: [
      {
        heading: "Lagre en oppføring",
        paragraphs: ["Trykk på hjertet på en aktivitet eller et arrangement for å lagre det. Favorittene dine finner du igjen under Lagret."],
        callout: { icon: "info", title: "Lagret på denne enheten", body: "Favoritter lagres lokalt i nettleseren, så de følger ikke med til en annen enhet. Sletter du nettleserdata, kan de forsvinne." },
      },
    ],
  },
  {
    slug: "konto-og-innlogging",
    title: "Konto, innlogging og tilgang",
    description: "Når trenger du konto, og hva brukes den til?",
    category: "Konto og personvern",
    icon: "user",
    readTime: "3 min",
    sections: [
      {
        heading: "Du trenger ikke konto for å utforske",
        paragraphs: ["Alle kan søke etter aktiviteter og arrangementer uten å logge inn. Konto brukes bare når du skal administrere innhold."],
      },
      {
        heading: "Hvem trenger konto?",
        list: [
          "Organisasjoner som publiserer og oppdaterer egne tilbud.",
          "Kommuner som samler lokale tilbud og lager informasjonssider.",
          "Personer som er invitert som administrator av en organisasjon eller kommune.",
        ],
      },
      {
        heading: "Hvis du ikke kommer inn",
        paragraphs: ["Kontroller e-postadressen og bruk lenken for glemt passord på innloggingssiden. Mangler du tilgang til en organisasjon eller kommune, må en administrator der gi deg tilgang."],
      },
    ],
  },
  {
    slug: "publiser-aktivitet",
    title: "Publiser en aktivitet eller et arrangement",
    description: "En enkel introduksjon for lag, foreninger og andre arrangører.",
    category: "For organisasjoner",
    icon: "users-round",
    readTime: "5 min",
    sections: [
      {
        heading: "Opprett en organisasjon",
        paragraphs: ["Registrer en organisasjon og fyll inn hvem dere er. Når profilen er klar, kan dere legge ut aktiviteter og arrangementer."],
      },
      {
        heading: "Aktivitet eller arrangement?",
        paragraphs: ["Velg riktig type ut fra om tilbudet gjentar seg eller skjer én gang."],
        cards: [
          { icon: "repeat", title: "Aktivitet", body: "Faste eller gjentakende tilbud, som en ukentlig treningsgruppe eller åpen klubb." },
          { icon: "calendar-days", title: "Arrangement", body: "Enkelthendelser med en bestemt dato og et starttidspunkt, som en konsert eller turnering." },
        ],
      },
      {
        heading: "Skriv en god oppføring",
        paragraphs: ["Start med et tydelig navn og en kort beskrivelse. Ta så med det en innbygger trenger for å møte opp eller melde seg på:"],
        list: [
          "Hvem tilbudet passer for, og eventuell aldersgruppe.",
          "Når og hvor det skjer.",
          "Hva det koster, eller om det er gratis.",
          "Hvordan man melder seg på, med lenke.",
          "Praktisk informasjon om tilgjengelighet.",
        ],
        callout: { icon: "check-circle-2", title: "Hold det oppdatert", body: "Endrer tid, sted eller pris seg, oppdater oppføringen så innbyggeren alltid møter riktig informasjon." },
      },
    ],
  },
  {
    slug: "organisasjonsprofil",
    title: "Bygg en god organisasjonsprofil",
    description: "Gjør det lett å forstå hvem dere er og hva dere tilbyr.",
    category: "For organisasjoner",
    icon: "pencil",
    readTime: "4 min",
    sections: [
      {
        heading: "Fyll ut det viktigste først",
        paragraphs: ["En komplett profil gjør det tryggere for innbyggeren å ta kontakt. Prioriter disse feltene:"],
        list: [
          "Navn og en kort beskrivelse av hva dere driver med.",
          "Nettsted og kontaktinformasjon.",
          "Profilbilde, og gjerne et banner som representerer dere.",
        ],
      },
      {
        heading: "Hold profilen aktuell",
        paragraphs: ["Gå gjennom profilen når kontaktperson, tilbud eller åpningstider endrer seg. En oppdatert profil unngår at innbyggere tar kontakt på feil grunnlag."],
      },
    ],
  },
  {
    slug: "organisasjonsprofiler",
    title: "Flere profiler i organisasjonen",
    description: "Bruk egne profiler per kommune eller avdeling under samme organisasjon.",
    category: "For organisasjoner",
    icon: "building-2",
    readTime: "4 min",
    sections: [
      {
        heading: "Hovedprofil og underprofiler",
        paragraphs: ["Organisasjonen har én hovedprofil. Er dere aktive i flere kommuner, eller har flere avdelinger, kan dere opprette egne profiler under hovedprofilen."],
        cards: [
          { icon: "building-2", title: "Hovedprofil", body: "Organisasjonens felles informasjon: navn, beskrivelse, logo og kontakt." },
          { icon: "layout-dashboard", title: "Underprofil", body: "En egen profil for en bestemt kommune eller avdeling, med egne detaljer." },
        ],
      },
      {
        heading: "Opprett en profil",
        paragraphs: ["Gå til Profiler i organisasjonsadministrasjonen og opprett en ny. Velg kommunen profilen hører til, eller gi den et avdelingsnavn – for eksempel «Karmøy» eller «Ungdomsklubben»."],
      },
      {
        heading: "Arv fra hovedprofilen",
        paragraphs: ["En underprofil arver informasjon fra hovedprofilen. Fyller dere ut et felt på underprofilen, overstyrer det hovedprofilen for akkurat den profilen. Lar dere feltet stå tomt, brukes hovedprofilens verdi."],
        callout: { icon: "info", title: "Fyll bare ut det som er annerledes", body: "Tomme felt på en underprofil henter automatisk verdien fra hovedprofilen, så dere slipper å gjenta felles informasjon." },
      },
      {
        heading: "Knytt aktiviteter til en profil",
        paragraphs: ["Når dere oppretter en aktivitet eller et arrangement, kan dere velge hvilken profil det hører til. Da vises tilbudet under riktig profil for innbyggeren."],
      },
    ],
  },
  {
    slug: "inviter-team",
    title: "Inviter administratorer og team",
    description: "Gi kollegaer tilgang til å administrere organisasjonen og profilene.",
    category: "For organisasjoner",
    icon: "users-round",
    readTime: "3 min",
    sections: [
      {
        heading: "Legg til medlemmer",
        paragraphs: ["Gå til Innstillinger → Medlemmer og legg til en person med e-postadressen deres. Personen får da tilgang til å administrere organisasjonen."],
        callout: { icon: "mail", title: "Personen må ha en konto", body: "Legg til den e-postadressen personen har registrert seg med. Har de ikke konto ennå, be dem registrere seg først – så kan du legge dem til." },
      },
      {
        heading: "Roller",
        paragraphs: ["Hvert medlem har en rolle som bestemmer hva de kan gjøre:"],
        cards: [
          { icon: "shield-check", title: "Eier", body: "Full tilgang, inkludert å administrere medlemmer og innstillinger." },
          { icon: "pencil", title: "Redaktør", body: "Kan opprette og redigere aktiviteter, arrangementer og profil." },
        ],
      },
      {
        heading: "Administratorer for en enkelt profil",
        paragraphs: ["Har dere flere profiler, kan dere gi noen tilgang til bare én av dem. Åpne profilen under Profiler og legg til administratorer der. De kan da administrere kun den profilen, ikke resten av organisasjonen."],
        link: { href: "/hjelp/organisasjonsprofiler", label: "Les om flere profiler i organisasjonen" },
      },
    ],
  },
  {
    slug: "integrasjoner-oversikt",
    title: "Alle integrasjonene for organisasjoner",
    description: "En oversikt over måtene dere kan koble Skjer det noe? til egne systemer.",
    category: "For organisasjoner",
    icon: "plug",
    readTime: "4 min",
    sections: [
      {
        heading: "Fem måter å koble til",
        paragraphs: ["Under Integrasjoner i organisasjonsadministrasjonen finner dere alt dere trenger for å hente inn eller dele ut innhold automatisk."],
        cards: [
          { icon: "key", title: "API", body: "Publiser aktiviteter og arrangementer direkte fra egne systemer, Zapier eller Make." },
          { icon: "calendar-days", title: "Kalender-feeds", body: "Importer arrangementer fra en ICS-/webcal-lenke, som Google Kalender eller Eventbrite." },
          { icon: "monitor", title: "Innebygging", body: "Vis tilbudene på egen nettside eller en infoskjerm." },
          { icon: "rss", title: "RSS-feed", body: "Del publisert innhold til nettsider og publiseringsverktøy." },
          { icon: "sparkles", title: "MCP (preview)", body: "La AI-verktøy utforske offentlig katalogdata via MCP-serveren." },
        ],
      },
      {
        heading: "Hent inn eller del ut",
        paragraphs: [
          "API og kalender-feeds henter innhold inn til Skjer det noe? fra systemene deres.",
          "Innebygging og RSS deler publisert innhold ut til nettsidene deres. Velg det som passer arbeidsflyten deres – dere kan gjerne bruke flere samtidig.",
        ],
        link: { href: "/api-dokumentasjon/oversikt", label: "Åpne den tekniske API-dokumentasjonen" },
      },
    ],
  },
  {
    slug: "kalender-feeds",
    title: "Importer fra en kalender-feed",
    description: "La en eksisterende kalender oppdatere arrangementene deres automatisk.",
    category: "For organisasjoner",
    icon: "calendar-days",
    readTime: "4 min",
    sections: [
      {
        heading: "Slik fungerer ICS-import",
        paragraphs: [
          "Legg til en offentlig iCalendar-feed (en .ics-lenke) under Integrasjoner → Kalender-feeds. Tjenesten henter arrangementene fra kalenderen og holder dem oppdatert automatisk.",
          "Dere velger om importerte arrangementer skal publiseres direkte eller lagres som utkast. Du kan også kjøre «Synk nå» når du vil hente inn endringer med en gang.",
        ],
      },
      {
        heading: "Før dere aktiverer",
        paragraphs: ["Kontroller kilden, slik at importen blir riktig fra start:"],
        list: [
          "Feeden er offentlig tilgjengelig og stabil.",
          "Arrangementene har tydelige titler.",
          "Tid, sted og lenke stemmer i kildesystemet.",
        ],
        callout: { icon: "info", title: "Kilden bestemmer innholdet", body: "En feil i kalenderen dere importerer fra, blir også synlig hos oss. Rett den i kildesystemet, så oppdateres importen." },
      },
    ],
  },
  {
    slug: "rss-og-innebygging",
    title: "Vis tilbudene på egen nettside",
    description: "Bygg inn aktiviteter og arrangementer, eller del dem via RSS.",
    category: "For organisasjoner",
    icon: "monitor",
    readTime: "5 min",
    sections: [
      {
        heading: "Tre typer innebygging",
        paragraphs: ["Under Integrasjoner → Innebygging setter dere opp en visning og får en ferdig kodesnutt. Velg typen som passer der innholdet skal vises."],
        cards: [
          { icon: "calendar-days", title: "Arrangementer", body: "Kommende arrangementer, med det nærmeste øverst." },
          { icon: "repeat", title: "Aktiviteter", body: "Faste tilbud, sortert alfabetisk." },
          { icon: "monitor", title: "Infoskjerm", body: "Fullskjermsvisning med stor tekst som blar automatisk – laget for skjermer i resepsjon eller foaje." },
        ],
      },
      {
        heading: "Velg utseende",
        paragraphs: ["Tilpass visningen så den passer nettsiden deres:"],
        list: [
          "Layout: liste eller rutenett.",
          "Tema: automatisk, lyst eller mørkt.",
          "Antall elementer som vises.",
          "Kategorifilter, hvis dere bare vil vise noen typer tilbud.",
        ],
      },
      {
        heading: "To måter å sette det inn på",
        paragraphs: [
          "Skript-varianten limes inn på nettsiden og tilpasser høyden automatisk etter innholdet. Den passer når dere kan legge inn et lite skript.",
          "iframe-varianten er en enkel ramme som fungerer i de fleste publiseringsverktøy, også der skript ikke er tillatt. Infoskjerm-visningen åpnes som en egen fullskjermsside.",
        ],
      },
      {
        heading: "Begrens hvem som kan vise innholdet",
        paragraphs: ["Legg inn nettadressene (domenene) som skal få lov til å vise innebyggingen. Lar du feltet stå tomt, kan den vises på alle nettsteder."],
      },
      {
        heading: "RSS-feed",
        paragraphs: ["Trenger dere en feed i stedet, gir hver visning også en RSS-adresse som nettsider og publiseringsverktøy kan lese."],
        callout: { icon: "eye", title: "Bare publisert innhold vises", body: "Innebygging og RSS viser kun oppføringer som er publisert. Utkast holdes skjult til dere publiserer dem." },
      },
    ],
  },
  {
    slug: "kommuneportal",
    title: "Slik fungerer kommuneportalen",
    description: "Samle lokale tilbud og gjør dem enklere å finne for innbyggerne.",
    category: "For kommuner",
    icon: "building-2",
    readTime: "4 min",
    sections: [
      {
        heading: "En samlet lokal oversikt",
        paragraphs: ["Kommuneportalen samler aktiviteter, arrangementer og organisasjoner som er relevante for innbyggerne i kommunen, på ett sted."],
      },
      {
        heading: "Hva kommunen kan gjøre",
        list: [
          "Publisere egne informasjonssider om lokale tilbud og tjenester.",
          "Hjelpe lokale lag og foreninger med å holde tilbudene oppdaterte.",
          "Gi innbyggerne en tydelig inngang til hva som skjer i nærområdet.",
        ],
        callout: { icon: "shield-check", title: "Eieren kvalitetssikrer", body: "Innhold som vises offentlig, må være publisert og kvalitetssikret av den som eier oppføringen." },
      },
    ],
  },
  {
    slug: "publiser-kommuneside",
    title: "Lag og publiser en kommuneside",
    description: "Bruk egne informasjonssider til å forklare lokale tilbud og tjenester.",
    category: "For kommuner",
    icon: "building-2",
    readTime: "5 min",
    sections: [
      { heading: "Bygg siden", paragraphs: ["Gå til Sider i kommuneadministrasjonen og opprett en side med tittel, adresse og innhold. Bruk tydelige mellomtitler og lenk videre til relevante aktiviteter."] },
      {
        heading: "Sjekk før publisering",
        paragraphs: ["Forhåndsvis siden før du publiserer:"],
        list: [
          "Se hvordan den ser ut på både mobil og desktop.",
          "Kontroller at lenker og kontaktinformasjon stemmer.",
          "Sørg for at siden ikke lover mer enn tilbudet faktisk dekker.",
        ],
      },
    ],
  },
  {
    slug: "kommune-integrasjoner",
    title: "Integrasjoner for kommuner",
    description: "Koble kommunens nettsider og systemer til den lokale oversikten.",
    category: "For kommuner",
    icon: "plug",
    readTime: "3 min",
    sections: [
      {
        heading: "Fire integrasjoner",
        paragraphs: ["Under Integrasjoner i kommuneadministrasjonen kan kommunen dele og hente inn innhold automatisk."],
        cards: [
          { icon: "key", title: "API", body: "Kommune-API med lesetilgang til publiserte tilbud i kommunen." },
          { icon: "monitor", title: "Innebygging", body: "Vis lokale tilbud på kommunens nettsider og infoskjermer." },
          { icon: "rss", title: "RSS-feed", body: "Publiser aktiviteter og arrangementer automatisk på kommunens nettside." },
          { icon: "sparkles", title: "MCP (preview)", body: "La AI-verktøy utforske offentlig katalogdata via MCP-serveren." },
        ],
      },
      {
        heading: "Kommunens API-nøkkel",
        paragraphs: ["Kommune-nøkkelen begynner med sdn_muni_ og gir lesetilgang til publiserte oppføringer i kommunen. Bruk den til å hente lokale tilbud inn i egne løsninger."],
        link: { href: "/api-dokumentasjon/oversikt", label: "Se API-dokumentasjonen" },
      },
    ],
  },
  {
    slug: "kommune-tilgang",
    title: "Tilgang og roller i kommunen",
    description: "Hvem administrerer kommuneportalen, og hva de kan gjøre.",
    category: "For kommuner",
    icon: "shield-check",
    readTime: "3 min",
    sections: [
      {
        heading: "Hva en kommuneadministrator kan gjøre",
        list: [
          "Redigere kommuneprofilen og kontaktinformasjonen.",
          "Lage og publisere informasjonssider.",
          "Sette opp integrasjoner som innebygging, RSS og API.",
          "Følge med på den lokale oversikten over tilbud.",
        ],
      },
      {
        heading: "Slik får kommunen tilgang",
        paragraphs: ["Kommunen får administratortilgang tildelt når den tas i bruk. Trenger dere flere administratorer, eller skal noen bytte rolle, tar dere kontakt så ordner vi tilgangen."],
        callout: { icon: "mail", title: "Trenger dere tilgang?", body: "Kontakt oss på org@ungevil.no, så hjelper vi kommunen i gang med riktige administratorer." },
      },
    ],
  },
  {
    slug: "api-autentisering",
    title: "Autentisering og API-nøkler",
    description: "Slik oppretter, bruker og sikrer dere en API-nøkkel.",
    category: "API-dokumentasjon",
    icon: "key",
    readTime: "3 min",
    sections: [
      {
        heading: "Opprett en nøkkel",
        paragraphs: [
          "Gå til organisasjonens Integrasjoner → API og opprett en ny nøkkel. Nøkkelen begynner med sdn_live_ og vises i sin helhet bare én gang. Kopier den og lagre den som en hemmelighet med en gang – vi lagrer bare en kryptografisk hash og kan ikke vise nøkkelen på nytt.",
          "Hver nøkkel er knyttet til én organisasjon. API-et kan derfor bare lese og endre organisasjonens egne oppføringer, aldri andres.",
        ],
      },
      {
        heading: "Bruk en Bearer-token",
        paragraphs: [
          "Send nøkkelen i Authorization-headeren på hver forespørsel, på formen «Bearer sdn_live_...». Forespørsler uten en gyldig, aktiv nøkkel avvises med statuskode 401.",
          "Velg om nøkkelen skal publisere automatisk eller opprette utkast. Med auto-publisering på blir nye oppføringer synlige med en gang; er den av, må noen godkjenne og publisere dem manuelt.",
        ],
      },
      {
        heading: "Hold nøkkelen trygg",
        paragraphs: [
          "Legg aldri nøkkelen i klientkode, offentlige repositorier eller skjermbilder, og logg den ikke. Behandle den som et passord.",
          "Mistenker dere at en nøkkel er kommet på avveie, tilbakekall den umiddelbart og opprett en ny. En tilbakekalt nøkkel slutter å virke med en gang.",
        ],
        link: { href: "/api-dokumentasjon/oversikt", label: "Åpne den fullstendige API-dokumentasjonen" },
      },
    ],
  },
  {
    slug: "api-og-integrasjoner",
    title: "API og integrasjoner",
    description: "Automatiser publisering av aktiviteter og arrangementer fra egne systemer.",
    category: "API-dokumentasjon",
    icon: "plug",
    readTime: "6 min",
    sections: [
      {
        heading: "Hva kan API-et brukes til?",
        paragraphs: ["API-et lar organisasjoner sende innhold til Skjer det noe? fra et system de allerede bruker, slik at de slipper å registrere det samme to steder."],
        cards: [
          { icon: "plug", title: "Publiser", body: "Opprett aktiviteter og arrangementer direkte fra kildesystemet." },
          { icon: "repeat", title: "Oppdater trygt", body: "Send den samme importen om igjen uten å lage dubletter." },
          { icon: "ban", title: "Meld avlysning", body: "Marker at en enkelt dag er avlyst eller stengt." },
        ],
      },
      {
        heading: "Slipp doble oppføringer med external_ref",
        paragraphs: [
          "Sett feltet external_ref til en fast ID fra kildesystemet deres. Sender dere den samme external_ref på nytt, oppdaterer API-et den eksisterende oppføringen i stedet for å lage en dublett.",
          "Det gjør integrasjonen trygg å kjøre om og om igjen: en nattlig synkronisering kan sende hele katalogen hver gang uten å skape rot.",
        ],
      },
      {
        heading: "Kom trygt i gang",
        paragraphs: [
          "Start med én oppføring og kontroller resultatet i organisasjonens innholdsliste før dere kobler på hele kildesystemet. Slå på automatisk publisering først når dere er trygge på at dataene er riktige.",
          "Forespørsler er ratebegrenset per minutt. Bygg inn en enkel pause som følger Retry-After-headeren ved store importer, så unngår dere å bli midlertidig blokkert.",
        ],
        link: { href: "/api-dokumentasjon/oversikt", label: "Se endepunkter, feltreferanse og eksempler" },
      },
    ],
  },
  {
    slug: "api-aktiviteter-og-arrangementer",
    title: "API: aktiviteter og arrangementer",
    description: "Forstå forskjellen på faste aktiviteter og tidsbestemte arrangementer.",
    category: "API-dokumentasjon",
    icon: "key",
    readTime: "5 min",
    sections: [
      {
        heading: "Velg riktig endepunkt",
        paragraphs: ["Hvilket endepunkt du bruker avhenger av om tilbudet gjentar seg eller skjer én gang."],
        cards: [
          { icon: "repeat", title: "POST /api/v1/activities", body: "Faste tilbud. Sett opp med weekday (0–6), start_time og end_time, og eventuelt ends_on." },
          { icon: "calendar-days", title: "POST /api/v1/events", body: "Enkelthendelser. Krever starts_at i ISO 8601-format, og kan ha ends_at." },
        ],
      },
      {
        heading: "Fyll ut de viktigste feltene",
        paragraphs: [
          "Bare title er påkrevd, men en god oppføring har også description, category (kategori-slug), municipality (kommunenummer eller slug), address og price. Legg gjerne til url for påmelding og alderstrinn med age_min og age_max.",
        ],
      },
      {
        heading: "Meld endringer og avlysninger",
        paragraphs: ["Skal en enkelt dag avlyses eller stenges uten å endre selve oppføringen, bruk POST /api/v1/updates med listing_kind, listing_id, occurrence_date og kind (cancelled, closed, changed eller notice)."],
        link: { href: "/api-dokumentasjon/oversikt#felt", label: "Se den fullstendige feltreferansen" },
      },
    ],
  },
  {
    slug: "personvern-og-lagring",
    title: "Personvern og lagring",
    description: "Hva vi lagrer, hvorfor vi gjør det, og hvilke valg du har.",
    category: "Konto og personvern",
    icon: "shield-check",
    readTime: "4 min",
    sections: [
      {
        heading: "Minst mulig data",
        paragraphs: ["Du kan bruke tjenesten uten konto. Vi samler ikke mer enn det som trengs for at tjenesten skal fungere."],
      },
      {
        heading: "Hva lagres lokalt",
        list: [
          "Favoritter du lagrer, lagres i nettleseren på enheten din.",
          "Enkelte innstillinger, som valgt kommune og tema, huskes lokalt.",
          "Deler du posisjon, brukes den bare der og da – koordinatene lagres ikke.",
        ],
        link: { href: "/personvern", label: "Les den fullstendige personvernerklæringen" },
      },
    ],
  },
];

export function getHelpArticle(slug: string) {
  return helpArticles.find((article) => article.slug === slug);
}

export function getHelpCategory(slug: string) {
  const categorySlugs: Record<string, HelpCategory> = {
    "kom-i-gang": "Kom i gang",
    "for-organisasjoner": "For organisasjoner",
    "for-kommuner": "For kommuner",
    "api-dokumentasjon": "API-dokumentasjon",
    "konto-og-personvern": "Konto og personvern",
  };
  return categorySlugs[slug];
}
