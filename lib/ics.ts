import ICAL from "ical.js";

export interface IcsEvent {
  uid: string;
  summary: string | null;
  description: string | null;
  location: string | null;
  startsAt: string; // ISO 8601
  endsAt: string | null;
  cancelled: boolean;
}

/** Parse an ICS document into normalised events. Malformed VEVENTs are skipped. */
export function parseIcs(text: string): IcsEvent[] {
  const comp = new ICAL.Component(ICAL.parse(text));
  const out: IcsEvent[] = [];
  for (const ve of comp.getAllSubcomponents("vevent")) {
    try {
      const e = new ICAL.Event(ve);
      if (!e.startDate) continue;
      const status = String(ve.getFirstPropertyValue("status") ?? "").toUpperCase();
      out.push({
        uid: e.uid || `${e.summary ?? "event"}-${e.startDate.toUnixTime()}`,
        summary: e.summary || null,
        description: e.description || null,
        location: e.location || null,
        startsAt: e.startDate.toJSDate().toISOString(),
        endsAt: e.endDate ? e.endDate.toJSDate().toISOString() : null,
        cancelled: status === "CANCELLED",
      });
    } catch {
      // Skip a single malformed VEVENT rather than failing the whole feed.
    }
  }
  return out;
}
