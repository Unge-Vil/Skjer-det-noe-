/** Build a URL-safe slug from a title plus a short random suffix for uniqueness. */
export function makeSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[æå]/g, "a")
    .replace(/ø/g, "o")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || "x"}-${suffix}`;
}

/** PostGIS EWKT for a geography point (note: POINT is lng lat). */
export function pointEwkt(lat: number, lng: number): string {
  return `SRID=4326;POINT(${lng} ${lat})`;
}
