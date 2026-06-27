"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/ds/Wordmark";
import { Icon, type IconName } from "@/components/ds/Icon";
import { ThemeToggle } from "@/components/ds/ThemeToggle";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { LogoutButton } from "@/components/LogoutButton";

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
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-app)" }}>
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
        <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid var(--border-subtle)" }}>
          <Wordmark size={16} />
          {identity}
        </div>

        <nav aria-label={title} style={{ flex: 1, padding: 12, display: "flex", flexDirection: "column", gap: 2 }}>
          {nav.map((n) => {
            const active = n.active ?? pathname === n.href;
            return (
              <Link
                key={n.label}
                href={n.href}
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

        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12, borderTop: "1px solid var(--border-subtle)" }}>
          {footerTop}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <LanguageToggle />
              <ThemeToggle />
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="flex items-center justify-between gap-3"
          style={{ padding: "16px 24px", background: "var(--surface-card)", borderBottom: "1px solid var(--border-subtle)" }}
        >
          <h1 style={{ margin: 0, fontSize: "var(--fs-h2)", fontWeight: 800, letterSpacing: "-0.01em" }}>{title}</h1>
          {headerAction}
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
