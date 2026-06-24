const WEEKDAYS_NB = [
  "Søndag",
  "Mandag",
  "Tirsdag",
  "Onsdag",
  "Torsdag",
  "Fredag",
  "Lørdag",
];

export function weekdayName(weekday: number | null | undefined): string | null {
  if (weekday == null) return null;
  return WEEKDAYS_NB[weekday] ?? null;
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

const dateFmt = new Intl.DateTimeFormat("nb-NO", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatEventDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toLocaleString("nb-NO", {
    maximumFractionDigits: 1,
  })} km`;
}

export function formatAge(
  min: number | null | undefined,
  max: number | null | undefined,
): string | null {
  if (min != null && max != null) return `${min}–${max} år`;
  if (min != null) return `Fra ${min} år`;
  if (max != null) return `Opptil ${max} år`;
  return null;
}
