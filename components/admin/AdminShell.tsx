"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/ds/Wordmark";
import { Button } from "@/components/ds/Button";
import { Icon, type IconName } from "@/components/ds/Icon";
import { ThemeToggle } from "@/components/ds/ThemeToggle";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { LogoutButton } from "@/components/LogoutButton";
import { OrgSwitcher } from "@/components/admin/OrgSwitcher";
import { useI18n } from "@/components/i18n/LocaleProvider";
import type { OrgRef } from "@/lib/org";

export function AdminShell({
  orgs,
  activeOrgId,
  previewHref,
  activitiesCount,
  eventsCount,
  children,
}: {
  orgs: OrgRef[];
  activeOrgId: string;
  previewHref: string;
  activitiesCount: number;
  eventsCount: number;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const pathname = usePathname();

  const nav: { href: string; label: string; icon: IconName; badge?: number; active?: boolean }[] = [
    { href: "/admin", label: t.orgadmin.overview, icon: "layout-dashboard", active: pathname === "/admin" },
    { href: "/admin#aktiviteter", label: t.admin.activities, icon: "repeat", badge: activitiesCount },
    { href: "/admin#arrangementer", label: t.admin.events, icon: "calendar-days", badge: eventsCount },
    { href: previewHref, label: t.orgadmin.preview, icon: "external-link" },
  ];

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-app)" }}>
      {/* Sidebar */}
      <aside
        className="hidden lg:flex lg:sticky lg:top-0 lg:h-screen"
        style={{
          width: 264,
          flex: "none",
          flexDirection: "column",
          background: "var(--surface-card)",
          borderRight: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid var(--border-subtle)" }}>
          <Wordmark size={16} />
          <OrgSwitcher orgs={orgs} activeId={activeOrgId} />
        </div>

        <nav aria-label={t.orgadmin.overview} style={{ flex: 1, padding: 12, display: "flex", flexDirection: "column", gap: 2 }}>
          {nav.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              aria-current={n.active ? "page" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "11px 12px",
                borderRadius: "var(--radius-md)",
                textDecoration: "none",
                background: n.active ? "var(--fjord-50)" : "transparent",
                color: n.active ? "var(--fjord-700)" : "var(--text-body)",
                fontSize: 14.5,
                fontWeight: n.active ? 700 : 500,
              }}
            >
              <Icon name={n.icon} size={20} color={n.active ? "var(--fjord-600)" : "var(--stone-500)"} />
              <span style={{ flex: 1 }}>{n.label}</span>
              {n.badge ? (
                <span style={{ minWidth: 20, padding: "1px 7px", textAlign: "center", borderRadius: "var(--radius-pill)", background: "var(--stone-100)", color: "var(--stone-700)", fontSize: 12, fontWeight: 700 }}>
                  {n.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>

        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12, borderTop: "1px solid var(--border-subtle)" }}>
          <Link href="/admin/aktivitet/ny">
            <Button fullWidth leadingIcon="plus">{t.admin.newActivity}</Button>
          </Link>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <LanguageToggle />
              <ThemeToggle />
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="flex items-center justify-between gap-3"
          style={{ padding: "16px 24px", background: "var(--surface-card)", borderBottom: "1px solid var(--border-subtle)" }}
        >
          <h1 style={{ margin: 0, fontSize: "var(--fs-h2)", fontWeight: 800, letterSpacing: "-0.01em" }}>
            {t.orgadmin.overview}
          </h1>
          <a href={previewHref} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="sm" leadingIcon="external-link">
              {t.orgadmin.previewPublic}
            </Button>
          </a>
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
