"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ds/Icon";
import { SettingsContent } from "@/components/SettingsContent";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { createClient } from "@/lib/supabase/client";
import { findMunicipality } from "@/lib/location";
import { useLocation } from "@/components/location/LocationProvider";
import { isAdminArea } from "@/lib/adminPaths";

export function MobileTabBar() {
  const { t } = useI18n();
  const pathname = usePathname();
  const location = useLocation();
  const defaultMunicipality = findMunicipality(location.municipalities, location.defaultMunicipality);
  const myMunicipalityHref = defaultMunicipality?.slug ? `/kommune/${defaultMunicipality.slug}` : "/kommuner";
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const settingsTriggerRef = useRef<HTMLButtonElement>(null);
  const settingsSheetRef = useRef<HTMLDivElement>(null);

  const closeSettings = () => {
    setSettingsOpen(false);
    requestAnimationFrame(() => settingsTriggerRef.current?.focus());
  };

  // Close the settings sheet on Escape (keyboard parity).
  useEffect(() => {
    if (!settingsOpen) return;
    settingsSheetRef.current?.querySelector<HTMLElement>("button, [href], input, select, textarea")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeSettings();
        return;
      }
      if (e.key !== "Tab" || !settingsSheetRef.current?.contains(document.activeElement)) return;
      const focusable = settingsSheetRef.current.querySelectorAll<HTMLElement>(
        "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [settingsOpen]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user));
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Hide the tab bar inside the admin areas (own chrome).
  if (isAdminArea(pathname)) return null;

  const tabs: { href: string; label: string; icon: IconName }[] = [
    { href: "/", label: t.nav.home, icon: "house" },
    { href: "/utforsk", label: t.nav.explore, icon: "sparkles" },
    { href: "/swipe", label: t.nav.swipe, icon: "repeat" },
    { href: "/kart", label: t.nav.map, icon: "map" },
  ];

  return (
    <>
      {settingsOpen && (
        <div className="sm:hidden" role="dialog" aria-modal="true" aria-label={t.nav.more}>
          <button
            type="button"
            aria-label={t.nav.close}
            onClick={closeSettings}
            className="sdn-backdrop"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 40,
              border: "none",
              background: "rgba(8,52,51,0.35)",
            }}
          />
          <div
            ref={settingsSheetRef}
            className="sdn-sheet"
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 41,
              background: "var(--surface-card)",
              borderTopLeftRadius: "var(--radius-lg)",
              borderTopRightRadius: "var(--radius-lg)",
              borderTop: "1px solid var(--border-subtle)",
              boxShadow: "0 -8px 30px rgba(8,52,51,0.18)",
              padding: 20,
              paddingBottom: "calc(20px + env(safe-area-inset-bottom))",
            }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: "var(--fs-h4)", fontWeight: 700 }}>{t.nav.more}</h2>
              <button
                type="button"
                aria-label={t.nav.close}
                onClick={closeSettings}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  borderRadius: "var(--radius-pill)",
                  border: "1px solid var(--border-subtle)",
                  background: "var(--surface-card)",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                <Icon name="x" size={18} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
              <button
                type="button"
                onClick={() => {
                  setSettingsOpen(false);
                  location.openMenu();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  minHeight: 44,
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  padding: "0 12px",
                  background: "var(--surface-card)",
                  color: "var(--text-body)",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Icon name={location.mode === "nearby" ? "locate-fixed" : "map-pin"} size={16} /> {t.location.title}
                </span>
                <Icon name="arrow-right" size={15} />
              </button>
              <Link
                href={myMunicipalityHref}
                onClick={closeSettings}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  minHeight: 44,
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  padding: "0 12px",
                  textDecoration: "none",
                  color: "var(--text-body)",
                  fontWeight: 600,
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Icon name="map-pin" size={16} /> {t.nav.myMunicipality}
                </span>
                <Icon name="arrow-right" size={15} />
              </Link>
              <Link
                href={signedIn ? "/konto" : "/logg-inn"}
                onClick={closeSettings}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  minHeight: 44,
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  padding: "0 12px",
                  textDecoration: "none",
                  color: "var(--text-body)",
                  fontWeight: 600,
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Icon name="user" size={16} /> {signedIn ? t.account.title : t.auth.login}
                </span>
                <Icon name="arrow-right" size={15} />
              </Link>
              <Link
                href="/personvern-og-vilkar"
                onClick={closeSettings}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  minHeight: 44,
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  padding: "0 12px",
                  textDecoration: "none",
                  color: "var(--text-body)",
                  fontWeight: 600,
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Icon name="file-text" size={16} /> {t.footer.privacyTerms}
                </span>
                <Icon name="arrow-right" size={15} />
              </Link>
              <Link
                href="/tilgjengelighet"
                onClick={closeSettings}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  minHeight: 44,
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  padding: "0 12px",
                  textDecoration: "none",
                  color: "var(--text-body)",
                  fontWeight: 600,
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Icon name="accessibility" size={16} /> {t.footer.accessibility}
                </span>
                <Icon name="arrow-right" size={15} />
              </Link>
            </div>

            {/* Discovery path for orgs — the B2B landing CTA is desktop-only. */}
            <Link
              href="/for-organisasjoner"
              onClick={closeSettings}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                minHeight: 48,
                marginBottom: 18,
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
                background: "var(--surface-brand-soft)",
                padding: "10px 14px",
                textDecoration: "none",
                color: "var(--text-brand)",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <Icon name="building-2" size={18} />
                <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <span style={{ fontWeight: 700 }}>{t.cta.moreTitle}</span>
                  <span style={{ fontSize: "var(--fs-xs)", fontWeight: 500, color: "var(--text-muted)" }}>{t.cta.moreBody}</span>
                </span>
              </span>
              <Icon name="arrow-right" size={15} />
            </Link>
            <SettingsContent />
          </div>
        </div>
      )}

      <nav
        aria-label={t.nav.home}
        className="grid sm:hidden"
        style={{
          position: "sticky",
          bottom: 0,
          zIndex: 30,
          gridTemplateColumns: `repeat(${tabs.length + 1}, 1fr)`,
          background: "var(--surface-card)",
          borderTop: "1px solid var(--border-subtle)",
          boxShadow: "0 -2px 10px rgba(8,52,51,0.05)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {tabs.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              onClick={() => setSettingsOpen(false)}
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                padding: "9px 0 11px",
                textDecoration: "none",
                color: active ? "var(--text-brand)" : "var(--text-muted)",
              }}
            >
              <span style={{ position: "relative" }}>
                <Icon name={tab.icon} size={23} />
              </span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: active ? 700 : 500 }}>
                {tab.label}
              </span>
            </Link>
          );
        })}

        <button
          ref={settingsTriggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={settingsOpen}
          onClick={() => setSettingsOpen((v) => !v)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            padding: "9px 0 11px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: settingsOpen ? "var(--text-brand)" : "var(--text-muted)",
          }}
        >
          <Icon name="settings" size={23} />
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: settingsOpen ? 700 : 500 }}>
            {t.nav.more}
          </span>
        </button>
      </nav>
    </>
  );
}
