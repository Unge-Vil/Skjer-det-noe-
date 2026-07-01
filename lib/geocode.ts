/**
 * Best-effort geocoding via Kartverket/Geonorge address search. Returns null on
 * any failure (no match, network, bad shape) — callers store a null location.
 */
export async function geocodeAddress(query: string): Promise<{ lat: number; lng: number } | null> {
  const q = query.trim();
  if (!q) return null;
  try {
    const url = `https://ws.geonorge.no/adresser/v1/sok?sok=${encodeURIComponent(q)}&treffPerSide=1`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      adresser?: { representasjonspunkt?: { lat: number; lon: number } }[];
    };
    const p = data.adresser?.[0]?.representasjonspunkt;
    if (!p || typeof p.lat !== "number" || typeof p.lon !== "number") return null;
    return { lat: p.lat, lng: p.lon };
  } catch {
    return null;
  }
}
