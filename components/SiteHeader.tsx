"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Wordmark } from "@/components/ds/Wordmark";
import { SettingsMenu } from "@/components/SettingsMenu";
import { ContextSwitcher } from "@/components/admin/ContextSwitcher";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { useEffect, useRef, useState } from "react";
import { SearchBar } from "@/components/ds/SearchBar";
import { createClient } from "@/lib/supabase/client";
import { LocationMenu } from "@/components/location/LocationMenu";
import { findMunicipality } from "@/lib/location";
import { useLocation } from "@/components/location/LocationProvider";
import { Icon } from "@/components/ds/Icon";
import { isAdminArea } from "@/lib/adminPaths";

const SAVED_KEY = "sdn-saved";

export function SiteHeader({ initialSignedIn = false }: { initialSignedIn?: boolean }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const location = useLocation();
  const defaultMunicipality = findMunicipality(location.municipalities, location.defaultMunicipality);
  const myMunicipalityHref = defaultMunicipality?.slug ? `/kommune/${defaultMunicipality.slug}` : "/kommuner";
  const router = useRouter();
  const [signedIn, setSignedIn] = useState<boolean | null>(initialSignedIn);
  const [savedCount, setSavedCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const inAdminArea = isAdminArea(pathname);
  const showContextMenu = inAdminArea || signedIn === true;

  const submitSearch = (value?: string) => {
    const q = (value ?? searchQuery).trim();
    setSearchOpen(false);
    router.push(q ? `/utforsk?q=${encodeURIComponent(q)}` : "/utforsk");
  };

  // Keep the mobile Saved badge in sync (favourites live in localStorage).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSavedCount(raw ? (JSON.parse(raw) as string[]).length : 0);
    } catch {
      // ignore
    }
  }, [pathname]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user));
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Focus the search field when the mobile toggle opens; Escape closes it.
  useEffect(() => {
    if (!searchOpen) return;
    searchWrapRef.current?.querySelector("input")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  const links = [
    { href: "/", label: t.nav.home },
    { href: "/utforsk", label: t.nav.explore },
    { href: "/kart", label: t.nav.map },
    { href: myMunicipalityHref, label: t.nav.myMunicipality },
  ];

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        background: "var(--surface-overlay)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div className="flex w-full items-center gap-3 px-4 py-3">
        <Link href="/" aria-label="Skjer det noe?" style={{ textDecoration: "none" }}>
          <Wordmark size={20} withMark />
        </Link>
        {inAdminArea && (
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              minHeight: 36,
              padding: "0 10px",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-brand)",
              fontSize: "var(--fs-sm)",
              fontWeight: 650,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            <Icon name="arrow-left" size={15} />
            {t.nav.backToSite}
          </Link>
        )}

        <nav aria-label={t.nav.home} className="ml-3 hidden items-center gap-1 sm:flex">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  padding: "8px 14px",
                  borderRadius: "var(--radius-pill)",
                  fontSize: "var(--fs-sm)",
                  fontWeight: 600,
                  textDecoration: "none",
                  color: active ? "var(--text-brand)" : "var(--text-body)",
                  background: active ? "var(--surface-brand-soft)" : "transparent",
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto hidden sm:block">
          <LocationMenu />
        </div>

        {/* Mobile: search toggle + saved favourites live in the header (the
          bottom bar carries the map instead). Desktop keeps these elsewhere. */}
        {!inAdminArea && (
          <div className="ml-auto flex items-center gap-2 sm:hidden">
            <button
              type="button"
              aria-label={t.nav.search}
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((v) => !v)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 40,
                borderRadius: "var(--radius-pill)",
                border: "1px solid var(--border-subtle)",
                background: searchOpen ? "var(--surface-brand-soft)" : "var(--surface-card)",
                color: searchOpen ? "var(--text-brand)" : "var(--text-body)",
                cursor: "pointer",
              }}
            >
              <Icon name="search" size={20} />
            </button>
            <Link
              href="/lagret"
              aria-label={t.nav.saved}
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 40,
                borderRadius: "var(--radius-pill)",
                border: "1px solid var(--border-subtle)",
                background: "var(--surface-card)",
                color: "var(--text-brand)",
              }}
            >
              <Icon name="heart" size={20} fill={savedCount ? "currentColor" : "none"} />
              {savedCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    minWidth: 16,
                    height: 16,
                    padding: "0 4px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--accent)",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    borderRadius: 999,
                  }}
                >
                  {savedCount}
                </span>
              )}
            </Link>
          </div>
        )}

        {/* Settings and account access are desktop-only; on mobile settings
          lives in the bottom tab bar. */}
        <div className="hidden items-center gap-2 sm:flex">
          {showContextMenu && (
            <div style={{ maxWidth: 260, minWidth: 190 }}>
              <ContextSwitcher />
            </div>
          )}
          {!showContextMenu && <SettingsMenu />}
        </div>
      </div>

      {searchOpen && !inAdminArea && (
        <div ref={searchWrapRef} className="px-4 pb-3 sm:hidden">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={submitSearch}
            placeholder={t.hero.searchPlaceholder}
          />
        </div>
      )}
    </header>
  );
}
