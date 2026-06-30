"use client";

import Link from "next/link";
import { Wordmark } from "@/components/ds/Wordmark";
import { useI18n } from "@/components/i18n/LocaleProvider";

/** Shared public footer: wordmark, tagline and legal links. */
export function SiteFooter() {
  const { t } = useI18n();
  const linkStyle = {
    color: "var(--text-muted)",
    fontSize: "var(--fs-sm)",
    fontWeight: 600,
    textDecoration: "none",
  } as const;

  return (
    <footer
      className="mx-auto mt-10 flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6"
      style={{ borderTop: "1px solid var(--border-subtle)" }}
    >
      <Wordmark size={18} />
      <span style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)", flex: "1 1 200px" }}>
        {t.footer.tagline}
      </span>
      <nav aria-label={t.footer.about} style={{ display: "flex", gap: 16 }}>
        <Link href="/om" style={linkStyle}>{t.footer.about}</Link>
        <Link href="/personvern" style={linkStyle}>{t.footer.privacy}</Link>
        <Link href="/vilkar" style={linkStyle}>{t.footer.terms}</Link>
      </nav>
    </footer>
  );
}
