"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/ds/Wordmark";
import { Icon, type IconName } from "@/components/ds/Icon";
import { SettingsMenu } from "@/components/SettingsMenu";
import { LogoutButton } from "@/components/LogoutButton";
import { useI18n } from "@/components/i18n/LocaleProvider";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  badge?: number;
  active?: boolean;
}

export function AdminShell({
  title,
  identity,
  nav,
  footerTop,
  headerAction,
  children,
}: {
  title: string;
  identity: ReactNode;
  nav: NavItem[];
  footerTop?: ReactNode;
  headerAction?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const closeDrawer = () => setDrawerOpen(false);

  // Shared sidebar body (used by the desktop rail and the mobile drawer).
  const sidebarBody = (
    <>
      <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid var(--border-subtle)" }}>
        <Wordmark size={16} />
        {identity}
      </div>

      <nav aria-label={title} style={{ flex: 1, padding: 12, display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
        {nav.map((n) => {
          const active = n.active ?? pathname === n.href;
          return (
            <Link
              key={n.label}
              href={n.href}
              onClick={closeDrawer}
              aria-current={active ? "page" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "11px 12px",
                borderRadius: "var(--radius-md)",
                textDecoration: "none",
                background: active ? "var(--fjord-50)" : "transparent",
                color: active ? "var(--fjord-700)" : "var(--text-body)",
                fontSize: 14.5,
                fontWeight: active ? 700 : 500,
              }}
            >
              <Icon name={n.icon} size={20} color={active ? "var(--fjord-600)" : "var(--stone-500)"} />
              <span style={{ flex: 1 }}>{n.label}</span>
              {n.badge ? (
                <span style={{ minWidth: 20, padding: "1px 7px", textAlign: "center", borderRadius: "var(--radius-pill)", background: "var(--stone-100)", color: "var(--stone-700)", fontSize: 12, fontWeight: 700 }}>
                  {n.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {footerTop && (
        <div style={{ padding: 14, borderTop: "1px solid var(--border-subtle)" }} onClick={closeDrawer}>
          {footerTop}
        </div>
      )}
    </>
  );

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-app)" }}>
      {/* Desktop rail */}
      <aside
        className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen"
        style={{
          width: 264,
          flex: "none",
          flexDirection: "column",
          background: "var(--surface-card)",
          borderRight: "1px solid var(--border-subtle)",
        }}
      >
        {sidebarBody}
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="lg:hidden" role="dialog" aria-modal="true" aria-label={title}>
          <button
            type="button"
            aria-label={t.nav.close}
            onClick={closeDrawer}
            style={{ position: "fixed", inset: 0, zIndex: 50, border: "none", background: "rgba(8,52,51,0.35)" }}
          />
          <aside
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              bottom: 0,
              zIndex: 51,
              width: 280,
              maxWidth: "85vw",
              display: "flex",
              flexDirection: "column",
              background: "var(--surface-card)",
              borderRight: "1px solid var(--border-subtle)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <div style={{ position: "absolute", top: 14, right: 12 }}>
              <button
                type="button"
                aria-label={t.nav.close}
                onClick={closeDrawer}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: "var(--radius-pill)", border: "1px solid var(--border-subtle)", background: "var(--surface-card)", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <Icon name="x" size={18} />
              </button>
            </div>
            {sidebarBody}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="flex items-center justify-between gap-3"
          style={{ position: "sticky", top: 0, zIndex: 20, padding: "12px 16px", background: "var(--surface-card)", borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="lg:hidden"
              aria-label={t.nav.menu}
              onClick={() => setDrawerOpen(true)}
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, flex: "none", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "var(--surface-card)", color: "var(--text-body)", cursor: "pointer" }}
            >
              <Icon name="menu" size={20} />
            </button>
            <h1 style={{ margin: 0, fontSize: "var(--fs-h3)", fontWeight: 800, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {headerAction && <div className="hidden sm:block">{headerAction}</div>}
            <SettingsMenu />
            <LogoutButton />
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
