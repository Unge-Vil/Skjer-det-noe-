import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CENTER, fetchNearbyListings } from "@/lib/listings";
import type { Listing } from "@/lib/types";
import { getLocale } from "@/lib/i18n/server";
import { SwipeDeck } from "@/components/SwipeDeck";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  let listings: Listing[] = [];
  if (configured) {
    try {
      const supabase = await createClient();
      listings = await fetchNearbyListings(
        supabase,
        { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng, radiusM: 100000 },
        await getLocale(),
      );
    } catch (err) {
      console.error("Discover data load failed", err);
    }
  }

  return (
    <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
      <SwipeDeck listings={listings} />
    </main>
  );
}
