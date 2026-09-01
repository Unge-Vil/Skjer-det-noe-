import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CENTER, fetchNearbyListings } from "@/lib/listings";
import type { Listing } from "@/lib/types";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { SwipeDeck } from "@/components/SwipeDeck";

export const dynamic = "force-dynamic";

export default async function SwipePage() {
  const locale = await getLocale();
  const t = getDictionary(locale);

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
        locale,
      );
    } catch (err) {
      console.error("Swipe data load failed", err);
    }
  }

  return (
    <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-4 sm:py-6">
      <div className="sm:hidden">
        <SwipeDeck listings={listings} />
      </div>

      <section className="hidden sm:flex flex-1 flex-col items-center justify-center text-center">
        <h1 style={{ margin: "0 0 8px", fontSize: "var(--fs-h2)", fontWeight: 800 }}>
          {t.swipe.mobileOnlyTitle}
        </h1>
        <p style={{ margin: "0 0 20px", color: "var(--text-muted)", fontSize: "var(--fs-body)" }}>
          {t.swipe.mobileOnlyBody}
        </p>
        <Link
          href="/utforsk"
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "var(--tap-comfy)",
            padding: "0 20px",
            borderRadius: "var(--radius-md)",
            background: "var(--surface-brand-strong)",
            color: "#fff",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          {t.swipe.toExplore}
        </Link>
      </section>
    </main>
  );
}
