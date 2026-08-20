import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const KINDS = ["activity", "event", "service", "volunteer"] as const;
type Kind = (typeof KINDS)[number];

const BASE_SELECT = "id,slug,title,description,image_url,updated_at,categories(slug),municipalities!inner(name,kommunenummer)";
const ACTIVITY_SELECT = `${BASE_SELECT},organizations!activities_organization_id_fkey(name,slug)`;
const EVENT_SELECT = `${BASE_SELECT},organizations!events_organization_id_fkey(name,slug)`;
const DIRECTORY_SELECT = `${BASE_SELECT},organizations(name,slug)`;

// Supabase returns relation objects at runtime, while generated types can model
// them as arrays depending on the relationship metadata.
type PublicRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  updated_at: string;
  organizations: { name: string; slug: string | null } | { name: string; slug: string | null }[] | null;
  categories: { slug: string } | { slug: string }[] | null;
  municipalities: { name: string; kommunenummer: string } | { name: string; kommunenummer: string }[] | null;
  weekday?: number | null;
  start_time?: string | null;
  end_time?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  area?: string | null;
};

function relation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function responseItem(kind: Kind, row: PublicRow) {
  const organization = relation(row.organizations);
  const category = relation(row.categories);
  const municipality = relation(row.municipalities);
  const path = kind === "activity"
    ? `/aktivitet/${row.slug}`
    : kind === "event"
      ? `/arrangement/${row.slug}`
      : kind === "service"
        ? `/tjeneste/${row.slug}`
        : `/frivillig/${row.slug}`;

  return {
    id: row.id,
    kind,
    title: row.title,
    description: row.description,
    canonicalUrl: absoluteUrl(path),
    imageUrl: row.image_url,
    updatedAt: row.updated_at,
    organization: organization
      ? {
          name: organization.name,
          canonicalUrl: organization.slug ? absoluteUrl(`/organisasjon/${organization.slug}`) : null,
        }
      : null,
    municipality: municipality ? { name: municipality.name, number: municipality.kommunenummer } : null,
    category: category?.slug ?? null,
    schedule: kind === "activity"
      ? { weekday: row.weekday ?? null, startTime: row.start_time ?? null, endTime: row.end_time ?? null }
      : kind === "event"
        ? { startsAt: row.starts_at ?? null, endsAt: row.ends_at ?? null }
        : null,
    area: row.area ?? null,
  };
}

/** GET /api/public/v1/listings — public, published listings for syndication. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const kindParam = url.searchParams.get("kind") ?? "activity";
  if (!KINDS.includes(kindParam as Kind)) {
    return NextResponse.json({ error: "invalid_kind", allowed: KINDS }, { status: 400 });
  }
  const kind = kindParam as Kind;
  const limitValue = Number(url.searchParams.get("limit") ?? "50");
  const limit = Number.isFinite(limitValue) ? Math.min(Math.max(Math.trunc(limitValue), 1), 100) : 50;
  const offsetValue = Number(url.searchParams.get("offset") ?? "0");
  const offset = Number.isFinite(offsetValue) ? Math.max(Math.trunc(offsetValue), 0) : 0;
  const municipality = url.searchParams.get("municipality");
  if (municipality && !/^\d{4}$/.test(municipality)) {
    return NextResponse.json({ error: "invalid_municipality", message: "Use a four-digit kommunenummer." }, { status: 400 });
  }

  const supabase = await createClient();
  const end = offset + limit;
  let query;
  if (kind === "activity") {
    query = supabase.from("activities").select(`${ACTIVITY_SELECT},weekday,start_time,end_time`).eq("status", "published");
  } else if (kind === "event") {
    query = supabase
      .from("events")
      .select(`${EVENT_SELECT},starts_at,ends_at`)
      .eq("status", "published")
      .gte("starts_at", new Date().toISOString());
  } else {
    query = supabase
      .from("directory_listings")
      .select(`${DIRECTORY_SELECT},area`)
      .eq("status", "published")
      .eq("kind", kind === "service" ? "service" : "volunteer");
  }
  if (municipality) query = query.eq("municipalities.kommunenummer", municipality);

  const { data, error } = await query.order("updated_at", { ascending: false }).range(offset, end);
  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });

  const rows = ((data as unknown as PublicRow[]) ?? []);
  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).map((row) => responseItem(kind, row));
  return NextResponse.json({
    version: "1",
    generatedAt: new Date().toISOString(),
    kind,
    municipality: municipality ?? null,
    offset,
    limit,
    nextOffset: hasMore ? offset + limit : null,
    items,
  });
}