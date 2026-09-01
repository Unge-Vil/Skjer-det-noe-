"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
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
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const openedViaKeyboardRef = useRef(false);

  const closeNav = (restoreFocus = true) => {
    const trigger = navRef.current?.querySelector<HTMLButtonElement>('button[aria-expanded="true"]');
    setOpenNav(null);
    if (restoreFocus) requestAnimationFrame(() => trigger?.focus());
  };

  // Anchor the fixed-positioned menu to its trigger, clamped to the viewport.
  const toggleNav = (label: string, trigger: HTMLElement, viaKeyboard: boolean) => {
    if (openNav === label) {
      setOpenNav(null);
      return;
    }
    openedViaKeyboardRef.current = viaKeyboard;
    const rect = trigger.getBoundingClientRect();
    const width = 220;
    setMenuPos({ top: rect.bottom + 6, left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)) });
    setOpenNav(label);
  };

  useEffect(() => {
    if (!openNav) return;
    // Only pull focus into the menu for keyboard users; a mouse click shouldn't paint a focus ring.
    if (openedViaKeyboardRef.current) menuRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    const closeOnOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node) && menuRef.current && !menuRef.current.contains(event.target as Node)) closeNav(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeNav();
        return;
      }
      if (event.key === "Tab" && menuRef.current) {
        const focusable = Array.from(menuRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])")).filter((element) => element.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const closeOnShift = () => closeNav(false);
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeOnShift);
    window.addEventListener("scroll", closeOnShift, true);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeOnShift);
      window.removeEventListener("scroll", closeOnShift, true);
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
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center sm:gap-3 sm:px-6">
          <div className="min-w-0 flex-1 overflow-visible">
          <nav ref={navRef} aria-label={title} className="sdn-admin-nav flex min-w-0 gap-1 overflow-x-auto overflow-y-hidden">
          {nav.map((n) => {
            const active = isActive(n);
            if (n.children) {
              return (
                <div key={n.label} style={{ position: "relative", flex: "none" }}>
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    aria-expanded={openNav === n.label}
                    onClick={(event) => toggleNav(n.label, event.currentTarget, event.detail === 0)}
                    style={{ ...navItemStyle, background: active ? "var(--surface-brand-soft)" : "transparent", color: active ? "var(--text-brand)" : "var(--text-body)" }}
                  >
                    <Icon name={n.icon} size={17} color="var(--icon-nav)" />
                    <span>{n.label}</span>
                    <Icon name="chevron-down" size={14} color="var(--text-muted)" />
                  </button>
                  {openNav === n.label && typeof document !== "undefined" && createPortal(
                    <div ref={menuRef} role="dialog" aria-modal="true" aria-label={n.label} style={{ position: "fixed", top: menuPos?.top ?? 0, left: menuPos?.left ?? 0, zIndex: 50, minWidth: 220, padding: 4, background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-md)" }}>
                      {n.children.map((child) => {
                        const childActive = !child.href.includes("#") && isHrefActive(child.href);
                        return <Link key={child.label} href={child.href} onClick={() => closeNav(false)} aria-current={childActive ? "page" : undefined} style={{ ...navItemStyle, width: "100%", background: childActive ? "var(--surface-brand-soft)" : "transparent", color: childActive ? "var(--text-brand)" : "var(--text-body)" }}><Icon name={child.icon} size={17} color="var(--icon-nav)" /><span>{child.label}</span>{child.badge ? <span style={badgeStyle}>{child.badge}</span> : null}</Link>;
                      })}
                    </div>,
                    document.body,
                  )}
                </div>
              );
            }
            return (
              <Link
                key={n.label}
                href={n.href}
                aria-current={active ? "page" : undefined}
                style={{ ...navItemStyle, background: active ? "var(--surface-brand-soft)" : "transparent", color: active ? "var(--text-brand)" : "var(--text-body)" }}
              >
                <Icon name={n.icon} size={17} color="var(--icon-nav)" />
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

const navItemStyle = { display: "inline-flex", alignItems: "center", gap: 4, flex: "none", padding: "8px 6px", border: "none", borderRadius: "var(--radius-md)", textDecoration: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" } as const;
const badgeStyle = { minWidth: 20, padding: "1px 6px", textAlign: "center" as const, borderRadius: "var(--radius-pill)", background: "var(--stone-100)", color: "var(--stone-700)", fontSize: 12, fontWeight: 700 };
