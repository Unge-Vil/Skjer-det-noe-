"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_CENTER, fetchNearbyListings } from "@/lib/listings";
import type { Listing } from "@/lib/types";
import { Icon } from "@/components/ds/Icon";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { ListingCard } from "@/components/ListingCard";

const SAVED_KEY = "sdn-saved";

export default function SavedPage() {
  const { t, locale } = useI18n();
  const supabase = useMemo(
    () =>
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
        ? createClient()
        : null,
    [],
  );

  const [saved, setSaved] = useState<string[]>([]);
  const [all, setAll] = useState<Listing[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setSaved(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;
    // Wide radius around the default region; saved items are filtered by id.
    fetchNearbyListings(supabase, { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng, radiusM: 300000 }, locale)
      .then((rows) => setAll(rows))
      .catch((err) => console.error(err));
  }, [supabase, locale]);

  const toggleSave = useCallback((id: string) => {
    setSaved((prev) => {
      const next = prev.filter((x) => x !== id);
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const items = all.filter((l) => saved.includes(l.id));

  return (
    <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 style={{ margin: "0 0 4px", fontSize: "var(--fs-h1)", fontWeight: 800 }}>{t.saved.title}</h1>
      <p style={{ margin: "0 0 20px", display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
        <Icon name="info" size={15} color="var(--text-brand)" />
        {t.saved.onDevice}
      </p>

      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-muted)" }}>
          <Icon name="heart" size={36} color="var(--stone-300)" />
          <p style={{ margin: "12px 0 0", fontSize: "var(--fs-body)" }}>{t.saved.empty}</p>
        </div>
      ) : (
        <div className="sdn-stagger flex flex-col gap-3">
          {items.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              saved
              showDistance={false}
              onToggleSave={toggleSave}
            />
          ))}
        </div>
      )}
    </main>
  );
}
