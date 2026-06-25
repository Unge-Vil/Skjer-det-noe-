import type { Dictionary } from "./nb";

export const en: Dictionary = {
  locale: { label: "Language", nb: "Norwegian", en: "English" },
  theme: { label: "Theme", auto: "Auto", light: "Light", dark: "Dark" },
  nav: {
    skipToContent: "Skip to content",
    tagline: "Recurring activities and events near you.",
  },
  hero: {
    eyebrowNear: "Activities near you",
    eyebrowIn: "Activities in {place}",
    searchPlaceholder: "Search for activities…",
  },
  explorer: {
    nearMe: "Near me",
    allMunicipalities: "All municipalities",
    allCategories: "All categories",
    within: "Within {km} km",
    results: "{count} results",
    loading: "Loading…",
    all: "All",
    empty: "No results here. Try increasing the radius or changing filters.",
    notConfigured:
      "Supabase isn't configured yet. Add the environment variables in .env.local.",
    geoUnsupported: "Location isn't supported in this browser.",
    geoDenied: "Couldn't access your location.",
  },
  view: { list: "List", map: "Map" },
  card: {
    activity: "Recurring",
    event: "Event",
    moreInfo: "More info",
    ageRange: "Ages {min}–{max}",
    ageFrom: "From age {min}",
    ageTo: "Up to age {max}",
  },
  status: {
    free: "Free",
    paid: "Paid",
    dropin: "Drop in",
    registration: "Registration",
    beginners: "Beginners welcome",
    accessible: "Accessible",
    full: "Full",
    cancelled: "Cancelled",
  },
  categories: {
    gaming: "Gaming",
    music: "Music",
    film: "Film",
    sports: "Sports",
    outdoor: "Outdoor life",
    creative: "Creative",
    social: "Meeting place",
    courses: "Courses",
    club: "Youth club",
  },
};
