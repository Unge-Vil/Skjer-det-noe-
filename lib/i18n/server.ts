import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { nb, type Dictionary } from "./dictionaries/nb";
import { en } from "./dictionaries/en";

const DICTIONARIES: Record<Locale, Dictionary> = { nb, en };

/** Resolve the active locale from the cookie (defaults to Norwegian). */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
