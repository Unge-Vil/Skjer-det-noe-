"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ds/Icon";
import { SettingsContent } from "@/components/SettingsContent";
import { useI18n } from "@/components/i18n/LocaleProvider";

const SAVED_KEY = "sdn-saved";

export function MobileTabBar() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [savedCount, setSavedCount] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsTriggerRef = useRef<HTMLButtonElement>(null);
  const settingsSheetRef = useRef<HTMLDivElement>(null);

  const closeSettings = () => {
    setSettingsOpen(false);
    requestAnimationFrame(() => settingsTriggerRef.current?.focus());
  };

  // Refresh the saved badge on navigation (favourites live in localStorage).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      const n = raw ? (JSON.parse(raw) as string[]).length : 0;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSavedCount(n);
    } catch {
      // ignore
    }
  }, [pathname]);

  // Close the settings sheet on Escape (keyboard parity).
  useEffect(() => {
    if (!settingsOpen) return;
    settingsSheetRef.current?.querySelector<HTMLElement>("button, [href], input, select, textarea")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeSettings();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [settingsOpen]);

  // Hide the tab bar inside the admin areas (own chrome).
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/kommune") ||
    pathname.startsWith("/plattform")
  )
    return null;

  const tabs: { href: string; label: string; icon: IconName; badge?: number }[] = [
    { href: "/", label: t.nav.home, icon: "house" },
    { href: "/utforsk", label: t.nav.explore, icon: "sparkles" },
    { href: "/kart", label: t.nav.map, icon: "map" },
    { href: "/lagret", label: t.nav.saved, icon: "heart", badge: savedCount },
  ];

  return (
    <>
      {settingsOpen && (
        <div className="sm:hidden" role="dialog" aria-modal="true" aria-label={t.nav.settings}>
          <button
            type="button"
            aria-label={t.nav.closeSettings}
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
            onKeyDown={(event) => {
              if (event.key !== "Tab") return;
              const focusable = settingsSheetRef.current?.querySelectorAll<HTMLElement>(
                "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
              );
              if (!focusable?.length) return;
              const first = focusable[0];
              const last = focusable[focusable.length - 1];
              if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
              } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
              }
            }}
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
              <h2 style={{ margin: 0, fontSize: "var(--fs-h4)", fontWeight: 700 }}>{t.nav.settings}</h2>
              <button
                type="button"
                aria-label={t.nav.closeSettings}
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
                <Icon name={tab.icon} size={23} fill={active && tab.icon === "heart" ? "currentColor" : "none"} />
                {tab.badge ? (
                  <span
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -10,
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
                    {tab.badge}
                  </span>
                ) : null}
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
            {t.nav.settings}
          </span>
        </button>
      </nav>
    </>
  );
}
