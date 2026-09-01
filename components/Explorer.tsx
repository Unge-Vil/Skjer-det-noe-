"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_CENTER,
  fetchNearbyListings,
} from "@/lib/listings";
import type { Category, Listing, ListingKind, Municipality } from "@/lib/types";
import { categoryDef } from "@/components/ds/categories";
import { CategoryPill } from "@/components/ds/CategoryPill";
import { FilterChip } from "@/components/ds/FilterChip";
import { SearchBar } from "@/components/ds/SearchBar";
import { Icon } from "@/components/ds/Icon";
import { MapListToggle, type MapListView } from "@/components/ds/MapListToggle";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { useLocation } from "@/components/location/LocationProvider";
import { fmt, plural } from "@/lib/i18n/config";
import { ListingCard } from "./ListingCard";

const ListingMap = dynamic(() => import("./ListingMap"), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-full items-center justify-center"
      style={{ background: "var(--surface-sunk)", color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}
    >
      Laster kart…
    </div>
  ),
});

const SAVED_KEY = "sdn-saved";

export function Explorer({
  initialListings,
  categories,
  municipalities,
  configured,
  loadError = false,
  initialQuery = "",
  initialCategory = null,
  initialMunicipality = null,
  initialKind = null,
  initialView = "map",
  showDirectoryShortcuts = false,
  showMap = true,
  listVariant = "card",
  mobileMapOnly = false,
}: {
  initialListings: Listing[];
  categories: Category[];
  municipalities: Municipality[];
  configured: boolean;
  loadError?: boolean;
  initialQuery?: string;
  initialCategory?: string | null;
  initialMunicipality?: string | null;
  initialKind?: ListingKind | null;
  initialView?: MapListView;
  showDirectoryShortcuts?: boolean;
  showMap?: boolean;
  listVariant?: "card" | "row";
  mobileMapOnly?: boolean;
}) {
  const { t, locale } = useI18n();
  const location = useLocation();
  const { selectMunicipality } = location;
  const supabase = useMemo(() => (configured ? createClient() : null), [configured]);

  const initialCenter = useMemo(() => {
    const m = municipalities.find((x) => x.kommunenummer === initialMunicipality);
    return m?.lat != null && m?.lng != null ? { lat: m.lat, lng: m.lng } : DEFAULT_CENTER;
  }, [municipalities, initialMunicipality]);

  const radiusM = location.radiusM;
  const [category, setCategory] = useState<string | null>(initialCategory);
  const [kind, setKind] = useState<ListingKind | null>(initialKind);
  const [query, setQuery] = useState(initialQuery);
  // The toggle is mobile-only and desktop always shows list + map side by side
  // regardless of this value.
  const [view, setView] = useState<MapListView>(initialView);
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  const municipality =
    location.mode === "municipality"
      ? location.selectedMunicipality ?? location.defaultMunicipality
      : null;
  const center = useMemo(() => {
    if (location.mode === "nearby" && location.coordinates) return location.coordinates;
    if (location.mode === "municipality") {
      const selected = municipalities.find((item) => item.kommunenummer === municipality);
      if (selected?.lat != null && selected.lng != null) return { lat: selected.lat, lng: selected.lng };
    }
    return initialCenter;
  }, [location.mode, location.coordinates, municipalities, municipality, initialCenter]);

  // Portal target for the floating toggle (page transform would otherwise
  // capture position:fixed).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Load on-device favourites (no login).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setSaved(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const toggleSave = useCallback((id: string) => {
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Seed the client location from the server/URL municipality once per distinct
  // value (mount or ?kommune deep link). Must NOT depend on the live selection,
  // or it would snap the user's manual kommune change back to the initial one.
  const seededMunicipality = useRef<string | null>(null);
  useEffect(() => {
    if (initialMunicipality && seededMunicipality.current !== initialMunicipality) {
      seededMunicipality.current = initialMunicipality;
      selectMunicipality(initialMunicipality);
    }
  }, [initialMunicipality, selectMunicipality]);

  useEffect(() => {
    if (!supabase) return;
    if (location.mode === "nearby" && !location.coordinates) return;
    if (location.mode === "municipality" && !municipality) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });
    fetchNearbyListings(supabase, { lat: center.lat, lng: center.lng, radiusM, category, municipality }, locale)
      .then((rows) => {
        if (!cancelled) setListings(rows);
      })
      .catch((err) => {
        console.error("Kunne ikke hente aktiviteter", err);
        if (!cancelled) setListings([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [supabase, center, radiusM, category, municipality, locale, location.mode, location.coordinates]);

  const municipalityName =
    municipalities.find((m) => m.kommunenummer === municipality)?.name ?? null;
  const scopeReady = location.mode === "nearby" ? Boolean(location.coordinates) : Boolean(municipality);

  // Client-side text search over the fetched set.
  const visible = useMemo(() => {
    if (!scopeReady) return [];
    const q = query.trim().toLowerCase();
    return listings.filter((l) => {
      if (kind && l.kind !== kind) return false;
      if (!q) return true;
      return [l.title, l.organizationName, l.description, categoryDef(l.categorySlug).label]
        .filter(Boolean)
        .some((t) => t!.toLowerCase().includes(q));
    });
  }, [listings, query, scopeReady, kind]);

  return (
    <main id="main" className="flex min-h-0 flex-1 flex-col">
      {/* Hero — the big title is marketing chrome; hide it on mobile so the map
          can take over, keep it on desktop. The search moves to the header
          toggle on mobile, so the whole block is desktop-only. */}
      <section className="mx-auto hidden w-full max-w-6xl px-4 lg:block lg:pt-6 lg:pb-2">
        <div className="hidden lg:block">
          <p
            style={{
              margin: "0 0 4px",
              fontSize: "var(--fs-xs)",
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "var(--accent)",
            }}
          >
            {municipalityName
              ? fmt(t.hero.eyebrowIn, { place: municipalityName })
              : t.hero.eyebrowNear}
          </p>
          <h1
            style={{
              margin: "0 0 16px",
              fontSize: "var(--fs-display-md)",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            Skjer det noe<span style={{ color: "var(--accent)" }}>?</span>
          </h1>
        </div>
        <SearchBar
          value={query}
          onChange={setQuery}
          scope={municipalityName ?? undefined}
          placeholder={t.hero.searchPlaceholder}
          style={{ maxWidth: 620 }}
        />
      </section>

      <div
        className="mx-auto w-full max-w-6xl"
        style={{ display: "flex", gap: 8, overflowX: "auto", padding: "3px 16px", scrollbarWidth: "none" }}
      >
        <FilterChip selected={kind === "activity"} onClick={() => setKind("activity")}>
          {t.explorer.activities}
        </FilterChip>
        <FilterChip selected={kind === "event"} onClick={() => setKind("event")}>
          {t.explorer.events}
        </FilterChip>
        {showDirectoryShortcuts && (
          <Link
            href="/tjenester"
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: 40,
              padding: "0 16px",
              borderRadius: "var(--radius-pill)",
              border: "1.5px solid var(--border-strong)",
              background: "var(--surface-card)",
              color: "var(--text-strong)",
              fontSize: "var(--fs-sm)",
              fontWeight: 600,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {t.explorer.services}
          </Link>
        )}
        {showDirectoryShortcuts && (
          <Link
            href="/frivilligtorg"
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: 40,
              padding: "0 16px",
              borderRadius: "var(--radius-pill)",
              border: "1.5px solid var(--border-strong)",
              background: "var(--surface-card)",
              color: "var(--text-strong)",
              fontSize: "var(--fs-sm)",
              fontWeight: 600,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {t.explorer.volunteer}
          </Link>
        )}
      </div>

      {/* Category chips */}
      <div
        className="sdn-horizontal-scroll mx-auto w-full max-w-6xl"
        style={{ display: "flex", gap: 8, overflowX: "auto", padding: "4px 16px", scrollbarWidth: "thin" }}
      >
        <FilterChip selected={category === null} onClick={() => setCategory(null)}>
          {t.explorer.all}
        </FilterChip>
        {categories.map((c) => {
          const selected = category === c.slug;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setCategory(selected ? null : c.slug)}
              style={{ flex: "none", border: "none", background: "transparent", padding: 0, cursor: "pointer" }}
            >
              <CategoryPill category={c.slug} solid={selected} />
            </button>
          );
        })}
      </div>

        {/* Controls — location + radius. Desktop-only; on mobile the area lives
          under "More", so both map and explore stay uncluttered. */}
      <div className="mx-auto hidden w-full max-w-6xl lg:block lg:px-4 lg:py-2">
        <div
          className="sdn-horizontal-scroll flex items-center gap-2 overflow-x-auto lg:flex-wrap"
          style={{ scrollbarWidth: "thin" }}
        >
          <span className="inline-flex shrink-0 items-center gap-2" style={{ minHeight: 38, padding: "0 12px", borderRadius: "var(--radius-pill)", background: "var(--surface-brand-soft)", color: "var(--text-brand)", fontSize: "var(--fs-sm)", fontWeight: 650 }}>
            <Icon name={location.mode === "nearby" ? "locate-fixed" : "map-pin"} size={16} />
            {location.mode === "nearby" ? location.currentMunicipality?.name ?? t.location.nearMe : municipalityName ?? t.location.chooseMunicipality}
          </span>

          <span className="ml-auto hidden lg:inline" style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", fontWeight: 600 }}>
            {loading ? t.explorer.loading : plural(locale, visible.length, t.explorer.results)}
          </span>
        </div>
        {location.mode === "nearby" && !location.coordinates && !location.locating && (
          <p style={{ marginTop: 8, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>{t.location.useMenuHint}</p>
        )}
      </div>

      {/* List + map */}
      <div
        className={`mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-0 px-0 pb-0 ${showMap ? "lg:grid-cols-[minmax(0,440px)_1fr] lg:gap-4" : ""} lg:px-4 lg:pb-6`}
      >
        <div
          className={`sdn-stagger ${mobileMapOnly || (showMap && view === "map") ? "hidden" : "block"} space-y-3 px-3 py-2 lg:block ${showMap ? "lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto" : ""} lg:p-2`}
        >
          {loadError ? (
            <p role="alert" style={{ color: "var(--danger-text)", fontSize: "var(--fs-sm)" }}>
              {t.explorer.loadError}
            </p>
          ) : !configured && (
            <div
              style={{
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--warning-500)",
                background: "var(--warning-50)",
                color: "var(--warning-600)",
                padding: 16,
                fontSize: "var(--fs-sm)",
              }}
            >
              {t.explorer.notConfigured}
            </div>
          )}
          {configured && visible.length === 0 && !loading && (
            <div
              style={{
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border-subtle)",
                background: "var(--surface-card)",
                padding: 24,
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "var(--fs-sm)",
              }}
            >
              <Icon name="search" size={28} color="var(--stone-300)" />
              <p style={{ margin: "8px 0 0" }}>{location.mode === "municipality" ? t.explorer.emptyMunicipality : t.explorer.empty}</p>
            </div>
          )}
          {visible.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              variant={listVariant}
              active={l.id === activeId}
              saved={saved.includes(l.id)}
              showDistance={location.mode === "nearby"}
              onHover={setActiveId}
              onToggleSave={toggleSave}
            />
          ))}
        </div>

        {showMap && (
          <div
            className={`${
              mobileMapOnly
                ? "block h-[calc(100dvh-233px)] min-h-[360px]"
                : `${view === "list" ? "hidden" : "block"} h-[calc(100dvh-208px)] min-h-[340px]`
            } overflow-hidden p-0 lg:block lg:h-auto lg:min-h-[70vh] lg:p-0`}
          >
            <div
              className="h-full w-full overflow-hidden lg:[border:1px_solid_var(--border-subtle)] lg:[border-radius:var(--radius-lg)]"
            >
              <ListingMap
                center={center}
                listings={visible}
                activeId={activeId}
                onHover={setActiveId}
                onSelect={setActiveId}
                showCurrentLocation={location.mode === "nearby"}
              />
            </div>
          </div>
        )}
      </div>

      {/* Floating list/map toggle over the map (mobile only). Portalled to body
          so it stays viewport-fixed despite the page-transition transform. */}
      {showMap &&
        !mobileMapOnly &&
        mounted &&
        createPortal(
          <div
            className="flex lg:hidden"
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: "calc(74px + env(safe-area-inset-bottom))",
              zIndex: 25,
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <div style={{ pointerEvents: "auto" }}>
              <MapListToggle value={view} onChange={setView} style={{ boxShadow: "var(--shadow-lg)" }} />
            </div>
          </div>,
          document.body,
        )}
    </main>
  );
}
