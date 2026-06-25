import { INTL_LOCALE, type Locale } from "./i18n/config";

/** Localized weekday name for 0=Sunday..6=Saturday, capitalized. */
export function weekdayName(
  weekday: number | null | undefined,
  locale: Locale,
): string | null {
  if (weekday == null) return null;
  // 2024-01-07 is a Sunday → add `weekday` days for the right name.
  const d = new Date(Date.UTC(2024, 0, 7 + weekday));
  const name = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    weekday: "long",
  }).format(d);
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** "17:30:00" -> "17:30" */
export function formatTime(time: string | null | undefined): string | null {
  if (!time) return null;
  return time.slice(0, 5);
}

export function formatTimeRange(
  start: string | null | undefined,
  end: string | null | undefined,
): string | null {
  const s = formatTime(start);
  const e = formatTime(end);
  if (s && e) return `${s}–${e}`;
  return s ?? null;
}

export function formatEventDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDistance(meters: number, locale: Locale): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toLocaleString(INTL_LOCALE[locale], {
    maximumFractionDigits: 1,
  })} km`;
}
