"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/ds/Wordmark";
import { ThemeToggle } from "@/components/ds/ThemeToggle";
import { Icon } from "@/components/ds/Icon";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { useI18n } from "@/components/i18n/LocaleProvider";

export function SiteHeader() {
  const { t } = useI18n();
  const pathname = usePathname();

  const links = [
    { href: "/", label: t.nav.home },
    { href: "/utforsk", label: t.nav.explore },
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
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
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

        <div className="ml-auto flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <Link
            href="/logg-inn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: "var(--radius-pill)",
              border: "1.5px solid var(--border-strong)",
              background: "var(--surface-card)",
              color: "var(--text-brand)",
              fontSize: "var(--fs-sm)",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <Icon name="door-open" size={16} />
            <span className="hidden sm:inline">{t.nav.login}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
