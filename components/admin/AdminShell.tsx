"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ds/Icon";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  badge?: number;
  active?: boolean;
}

export function AdminShell({
  title,
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
    <div className="flex min-h-screen flex-col" style={{ background: "var(--bg-app)" }}>
      <header style={{ background: "var(--surface-card)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="mx-auto flex max-w-6xl items-center gap-3 overflow-x-auto px-4 py-2 sm:px-6">
          <nav aria-label={title} className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {nav.map((n) => {
            const active = n.active ?? pathname === n.href;
            return (
              <Link
                key={n.label}
                href={n.href}
                aria-current={active ? "page" : undefined}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  flex: "none",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-md)",
                  textDecoration: "none",
                  background: active ? "var(--fjord-50)" : "transparent",
                  color: active ? "var(--fjord-700)" : "var(--text-body)",
                  fontSize: 14,
                  fontWeight: active ? 700 : 600,
                }}
              >
                <Icon name={n.icon} size={17} color={active ? "var(--fjord-600)" : "var(--stone-500)"} />
                <span>{n.label}</span>
                {n.badge ? <span style={{ minWidth: 20, padding: "1px 6px", textAlign: "center", borderRadius: "var(--radius-pill)", background: "var(--stone-100)", color: "var(--stone-700)", fontSize: 12, fontWeight: 700 }}>{n.badge}</span> : null}
              </Link>
            );
          })}
            {footerTop && <div style={{ marginLeft: "auto", flex: "none", minWidth: 170 }}>{footerTop}</div>}
          </nav>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
