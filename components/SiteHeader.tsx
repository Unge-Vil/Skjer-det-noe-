"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/ds/Wordmark";
import { SettingsMenu } from "@/components/SettingsMenu";
import { ContextSwitcher } from "@/components/admin/ContextSwitcher";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LocationMenu } from "@/components/location/LocationMenu";
import { findMunicipality } from "@/lib/location";
import { useLocation } from "@/components/location/LocationProvider";

export function SiteHeader({ initialSignedIn = false }: { initialSignedIn?: boolean }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const location = useLocation();
  const defaultMunicipality = findMunicipality(location.municipalities, location.defaultMunicipality);
  const myMunicipalityHref = defaultMunicipality?.slug ? `/kommune/${defaultMunicipality.slug}` : "/kommuner";
  const [signedIn, setSignedIn] = useState<boolean | null>(initialSignedIn);
  const inAdminArea = pathname.startsWith("/admin") || pathname.startsWith("/kommune") || pathname.startsWith("/plattform");
  const showContextMenu = inAdminArea || signedIn === true;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user));
    });
    return () => listener.subscription.unsubscribe();
  }, []);

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

        <div className="ml-auto">
          <LocationMenu />
        </div>

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
    </header>
  );
}
