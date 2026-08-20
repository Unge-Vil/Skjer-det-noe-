import type { NextRequest } from "next/server";
import { clientIp, enforceRateLimit, limitKey } from "@/lib/rate-limit";

interface MunicipalityResponse {
  kommunenummer?: string;
  kommunenavn?: string;
  fylkesnummer?: string;
  fylkesnavn?: string;
}

export async function GET(request: NextRequest) {
  const limited = enforceRateLimit({
    bucket: "api_municipality_lookup",
    key: limitKey([clientIp(request)]),
    max: 20,
    windowMs: 60_000,
  });
  if (limited) return limited;

  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lng = Number(request.nextUrl.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return Response.json({ error: "Ugyldig posisjon" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    for (const endpoint of [
      "https://api.kartverket.no/kommuneinfo/v1/punkt",
      "https://ws.geonorge.no/kommuneinfo/v1/punkt",
    ]) {
      try {
        const url = new URL(endpoint);
        url.searchParams.set("nord", String(lat));
        url.searchParams.set("ost", String(lng));
        url.searchParams.set("koordsys", "4258");
        const response = await fetch(url, { cache: "no-store", signal: controller.signal });
        if (!response.ok) continue;

        const result = (await response.json()) as MunicipalityResponse;
        if (!result.kommunenummer || !result.kommunenavn) continue;
        return Response.json({
          kommunenummer: result.kommunenummer,
          name: result.kommunenavn,
          county: result.fylkesnavn ?? null,
        });
      } catch {
        if (controller.signal.aborted) break;
      }
    }
    return Response.json({ error: "Fant ikke kommune" }, { status: 502 });
  } catch {
    return Response.json({ error: "Kommuneoppslag feilet" }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
