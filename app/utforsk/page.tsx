import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import {
  DEFAULT_CENTER,
  DEFAULT_RADIUS_M,
  fetchNearbyListings,
} from "@/lib/listings";
import type { Category, Listing, Municipality } from "@/lib/types";
import { getLocale } from "@/lib/i18n/server";
import { Explorer } from "@/components/Explorer";
import { LOCATION_COOKIE, parseLocationPreferences } from "@/lib/location";

export const dynamic = "force-dynamic";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kategori?: string; kommune?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const query = sp.q ?? "";
  const category = sp.kategori ?? null;
  const kind = sp.type === "event" ? "event" : "activity";
  const preferences = parseLocationPreferences((await cookies()).get(LOCATION_COOKIE)?.value);
  const municipality =
    sp.kommune ??
    (preferences.mode === "municipality"
      ? preferences.selectedMunicipality ?? preferences.defaultMunicipality
      : null);

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  let categories: Category[] = [];
  let municipalities: Municipality[] = [];
  let initialListings: Listing[] = [];

  if (configured) {
    try {
      const supabase = await createClient();
      const [catRes, munRes] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("municipalities_view").select("*").order("name"),
      ]);
      categories = (catRes.data as Category[]) ?? [];
      municipalities = (munRes.data as Municipality[]) ?? [];

      const m = municipalities.find((x) => x.kommunenummer === municipality);
      const center =
        m?.lat != null && m?.lng != null
          ? { lat: m.lat, lng: m.lng }
          : DEFAULT_CENTER;

      if (municipality) {
        initialListings = await fetchNearbyListings(
          supabase,
          { lat: center.lat, lng: center.lng, radiusM: DEFAULT_RADIUS_M, category, municipality },
          await getLocale(),
        );
      }
    } catch (err) {
      console.error("Explore data load failed", err);
    }
  }

  return (
    <Explorer
      initialListings={initialListings}
      categories={categories}
      municipalities={municipalities}
      configured={configured}
      initialQuery={query}
      initialCategory={category}
      initialMunicipality={municipality}
      initialKind={kind}
      initialView="list"
      showDirectoryShortcuts
      showMap={false}
      listVariant="row"
    />
  );
}
