"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Icon, type IconName } from "@/components/ds/Icon";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  badge?: number;
  active?: boolean;
  children?: NavItem[];
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
  const searchParams = useSearchParams();
  const [openNav, setOpenNav] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!openNav) return;
    const closeOnOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) setOpenNav(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenNav(null);
    };
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [openNav]);

  const isActive = (item: NavItem) => item.active ?? (pathname === item.href || item.children?.some((child) => isHrefActive(child.href)));
  const isHrefActive = (href: string) => {
    const [path, query] = href.split("?");
    const expectedKind = new URLSearchParams(query ?? "").get("kind")
      ?? (path.endsWith("/tjenester") ? "service" : path.endsWith("/frivilligtorg") ? "volunteer" : null);
    const expectedPath = expectedKind && (path.endsWith("/tjenester") || path.endsWith("/frivilligtorg"))
      ? path.replace(/\/(tjenester|frivilligtorg)$/, "/innhold")
      : path;
    if (pathname !== expectedPath) return false;
    return expectedKind ? expectedKind === searchParams.get("kind") : !searchParams.get("kind");
  };

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--bg-app)" }}>
      <header style={{ background: "var(--surface-card)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 sm:px-6">
          <div className="min-w-0 flex-1 overflow-visible">
          <nav ref={navRef} aria-label={title} className="flex min-w-0 flex-wrap gap-1 overflow-visible">
          {nav.map((n) => {
            const active = isActive(n);
            if (n.children) {
              return (
                <div key={n.label} style={{ position: "relative", flex: "none" }}>
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={openNav === n.label}
                    onClick={() => setOpenNav((value) => value === n.label ? null : n.label)}
                    style={{ ...navItemStyle, background: active ? "var(--fjord-50)" : "transparent", color: active ? "var(--fjord-700)" : "var(--text-body)" }}
                  >
                    <Icon name={n.icon} size={17} color={active ? "var(--fjord-600)" : "var(--stone-500)"} />
                    <span>{n.label}</span>
                    <Icon name="chevron-down" size={14} color="var(--text-muted)" />
                  </button>
                  {openNav === n.label && (
                    <div role="menu" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 40, minWidth: 220, padding: 4, background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-md)" }}>
                      {n.children.map((child) => {
                        const childActive = !child.href.includes("#") && isHrefActive(child.href);
                        return <Link key={child.label} href={child.href} role="menuitem" onClick={() => setOpenNav(null)} aria-current={childActive ? "page" : undefined} style={{ ...navItemStyle, width: "100%", background: childActive ? "var(--fjord-50)" : "transparent", color: childActive ? "var(--fjord-700)" : "var(--text-body)" }}><Icon name={child.icon} size={17} color={childActive ? "var(--fjord-600)" : "var(--stone-500)"} /><span>{child.label}</span>{child.badge ? <span style={badgeStyle}>{child.badge}</span> : null}</Link>;
                      })}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <Link
                key={n.label}
                href={n.href}
                aria-current={active ? "page" : undefined}
                style={{ ...navItemStyle, background: active ? "var(--fjord-50)" : "transparent", color: active ? "var(--fjord-700)" : "var(--text-body)" }}
              >
                <Icon name={n.icon} size={17} color={active ? "var(--fjord-600)" : "var(--stone-500)"} />
                <span>{n.label}</span>
                {n.badge ? <span style={badgeStyle}>{n.badge}</span> : null}
              </Link>
            );
          })}
          </nav>
          </div>
          {(footerTop || headerAction) && (
            <div className="flex shrink-0 items-center gap-2">
              {footerTop}
              {headerAction}
            </div>
          )}
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}

const navItemStyle = { display: "inline-flex", alignItems: "center", gap: 8, flex: "none", padding: "8px 12px", border: "none", borderRadius: "var(--radius-md)", textDecoration: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" } as const;
const badgeStyle = { minWidth: 20, padding: "1px 6px", textAlign: "center" as const, borderRadius: "var(--radius-pill)", background: "var(--stone-100)", color: "var(--stone-700)", fontSize: 12, fontWeight: 700 };
