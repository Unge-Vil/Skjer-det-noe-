"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_CENTER,
  DEFAULT_RADIUS_M,
  fetchNearbyListings,
} from "@/lib/listings";
import type { Category, Listing, Municipality } from "@/lib/types";
import { categoryDef } from "@/components/ds/categories";
import { CategoryPill } from "@/components/ds/CategoryPill";
import { FilterChip } from "@/components/ds/FilterChip";
import { SearchBar } from "@/components/ds/SearchBar";
import { Button } from "@/components/ds/Button";
import { Icon } from "@/components/ds/Icon";
import { MapListToggle, type MapListView } from "@/components/ds/MapListToggle";
import { useI18n } from "@/components/i18n/LocaleProvider";
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

const RADIUS_OPTIONS = [5000, 10000, 15000, 30000, 50000];
const SAVED_KEY = "sdn-saved";

const selectStyle: CSSProperties = {
  appearance: "none",
  minHeight: 44,
  padding: "0 38px 0 16px",
  background:
    "var(--surface-card) url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%236B6456' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E\") no-repeat right 14px center",
  border: "1.5px solid var(--border-strong)",
  borderRadius: "var(--radius-pill)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--fs-sm)",
  fontWeight: 600,
  color: "var(--text-strong)",
  cursor: "pointer",
};

export function Explorer({
  initialListings,
  categories,
  municipalities,
  configured,
  initialQuery = "",
  initialCategory = null,
  initialMunicipality = null,
}: {
  initialListings: Listing[];
  categories: Category[];
  municipalities: Municipality[];
  configured: boolean;
  initialQuery?: string;
  initialCategory?: string | null;
  initialMunicipality?: string | null;
}) {
  const { t, locale } = useI18n();
  const supabase = useMemo(() => (configured ? createClient() : null), [configured]);

  const initialCenter = useMemo(() => {
    const m = municipalities.find((x) => x.kommunenummer === initialMunicipality);
    return m?.lat != null && m?.lng != null ? { lat: m.lat, lng: m.lng } : DEFAULT_CENTER;
  }, [municipalities, initialMunicipality]);

  const [center, setCenter] = useState(initialCenter);
  const [radiusM, setRadiusM] = useState(DEFAULT_RADIUS_M);
  const [category, setCategory] = useState<string | null>(initialCategory);
  const [municipality, setMunicipality] = useState<string | null>(initialMunicipality);
  const [query, setQuery] = useState(initialQuery);
  // Mobile opens map-first (the page is "Kart"); the toggle is mobile-only and
  // desktop always shows list + map side by side regardless of this value.
  const [view, setView] = useState<MapListView>("map");
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  const firstRun = useRef(true);

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

  useEffect(() => {
    if (!supabase) return;
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    let cancelled = false;
    setLoading(true);
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
  }, [supabase, center, radiusM, category, municipality, locale]);

  const useMyLocation = useCallback(() => {
    setGeoError(null);
    if (!("geolocation" in navigator)) {
      setGeoError(t.explorer.geoUnsupported);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMunicipality(null);
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => setGeoError(t.explorer.geoDenied),
    );
  }, [t]);

  const onMunicipalityChange = useCallback(
    (kommunenummer: string) => {
      const value = kommunenummer || null;
      setMunicipality(value);
      const m = municipalities.find((x) => x.kommunenummer === value);
      if (m?.lat != null && m?.lng != null) setCenter({ lat: m.lat, lng: m.lng });
    },
    [municipalities],
  );

  const municipalityName =
    municipalities.find((m) => m.kommunenummer === municipality)?.name ?? null;

  // Client-side text search over the fetched set.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter((l) =>
      [l.title, l.organizationName, l.description, categoryDef(l.categorySlug).label]
        .filter(Boolean)
        .some((t) => t!.toLowerCase().includes(q)),
    );
  }, [listings, query]);

  return (
    <main id="main" className="flex min-h-0 flex-1 flex-col">
      {/* Hero — the big title is marketing chrome; hide it on mobile so the map
          can take over, keep it on desktop. */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-3 pb-2 lg:pt-6">
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

      {/* Category chips */}
      <div
        className="mx-auto w-full max-w-6xl"
        style={{ display: "flex", gap: 8, overflowX: "auto", padding: "8px 16px", scrollbarWidth: "none" }}
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

      {/* Controls — a single clean filter row (scrolls horizontally on mobile,
          wraps on desktop). The list/map toggle floats over the map on mobile. */}
      <div className="mx-auto w-full max-w-6xl px-3 py-2 lg:px-4">
        <div
          className="flex items-center gap-2 overflow-x-auto lg:flex-wrap"
          style={{ scrollbarWidth: "none" }}
        >
          <Button className="shrink-0" variant="coral" size="sm" leadingIcon="locate-fixed" onClick={useMyLocation}>
            {t.explorer.nearMe}
          </Button>

          <select
            value={municipality ?? ""}
            onChange={(e) => onMunicipalityChange(e.target.value)}
            style={selectStyle}
            className="shrink-0"
            aria-label={t.explorer.allMunicipalities}
          >
            <option value="">{t.explorer.allMunicipalities}</option>
            {municipalities.map((m) => (
              <option key={m.id} value={m.kommunenummer}>
                {m.name}
              </option>
            ))}
          </select>

          <select
            value={radiusM}
            onChange={(e) => setRadiusM(Number(e.target.value))}
            style={selectStyle}
            className="shrink-0"
            aria-label={fmt(t.explorer.within, { km: "" }).trim()}
          >
            {RADIUS_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {fmt(t.explorer.within, { km: v / 1000 })}
              </option>
            ))}
          </select>

          <span className="ml-auto hidden lg:inline" style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)", fontWeight: 600 }}>
            {loading ? t.explorer.loading : plural(locale, visible.length, t.explorer.results)}
          </span>
        </div>
        {geoError && (
          <p style={{ marginTop: 8, fontSize: "var(--fs-sm)", color: "var(--danger-600)" }}>{geoError}</p>
        )}
      </div>

      {/* List + map */}
      <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-0 px-0 pb-0 lg:grid-cols-[minmax(0,440px)_1fr] lg:gap-4 lg:px-4 lg:pb-6">
        <div
          className={`sdn-stagger ${view === "map" ? "hidden" : "block"} space-y-3 px-3 py-2 lg:block lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto lg:p-2`}
        >
          {!configured && (
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
              <p style={{ margin: "8px 0 0" }}>{t.explorer.empty}</p>
            </div>
          )}
          {visible.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              active={l.id === activeId}
              saved={saved.includes(l.id)}
              onHover={setActiveId}
              onToggleSave={toggleSave}
            />
          ))}
        </div>

        <div
          className={`${view === "list" ? "hidden" : "block"} h-[calc(100dvh-208px)] min-h-[340px] overflow-hidden p-0 lg:block lg:h-auto lg:min-h-[70vh] lg:p-0`}
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
            />
          </div>
        </div>
      </div>

      {/* Floating list/map toggle over the map (mobile only). Portalled to body
          so it stays viewport-fixed despite the page-transition transform. */}
      {mounted &&
        createPortal(
          <div
            className="lg:hidden"
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: "calc(74px + env(safe-area-inset-bottom))",
              zIndex: 25,
              display: "flex",
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
