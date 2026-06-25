export const LOCALES = ["nb", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "nb";
export const LOCALE_COOKIE = "sdn-locale";

/** BCP-47 tags for Intl formatting. */
export const INTL_LOCALE: Record<Locale, string> = {
  nb: "nb-NO",
  en: "en-GB",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "nb" || value === "en";
}

/** Replace {placeholders} in a template string. */
export function fmt(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  );
}
