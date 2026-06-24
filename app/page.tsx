import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_CENTER,
  DEFAULT_RADIUS_M,
  fetchNearbyListings,
} from "@/lib/listings";
import type { Category, Listing, Municipality } from "@/lib/types";
import { Explorer } from "@/components/Explorer";
import { Wordmark } from "@/components/ds/Wordmark";
import { ThemeToggle } from "@/components/ds/ThemeToggle";

// Listings are data-driven; render per request for now.
export const dynamic = "force-dynamic";

export default async function Home() {
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
      const [catRes, munRes, listings] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("municipalities_view").select("*").order("name"),
        fetchNearbyListings(supabase, {
          lat: DEFAULT_CENTER.lat,
          lng: DEFAULT_CENTER.lng,
          radiusM: DEFAULT_RADIUS_M,
        }),
      ]);
      categories = (catRes.data as Category[]) ?? [];
      municipalities = (munRes.data as Municipality[]) ?? [];
      initialListings = listings;
    } catch (err) {
      // Migrations may not be applied yet — render the shell regardless.
      console.error("Initial data load failed", err);
    }
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--bg-app)" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "var(--surface-overlay)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Wordmark size={20} withMark />
          <ThemeToggle />
        </div>
      </header>

      <Explorer
        initialListings={initialListings}
        categories={categories}
        municipalities={municipalities}
        configured={configured}
      />
    </div>
  );
}
