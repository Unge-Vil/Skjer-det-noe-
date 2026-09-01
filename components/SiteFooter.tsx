"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/ds/Wordmark";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { createClient } from "@/lib/supabase/client";

/** Shared public footer: wordmark, tagline and legal links. */
export function SiteFooter() {
  const { t } = useI18n();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user));
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const linkStyle = {
    color: "var(--text-muted)",
    fontSize: "var(--fs-sm)",
    fontWeight: 600,
    lineHeight: "20px",
    textDecoration: "none",
  } as const;
  const accountLinkStyle = {
    ...linkStyle,
    color: "var(--text-brand)",
    background: "var(--surface-brand-soft)",
    borderRadius: "var(--radius-pill)",
    padding: "8px 14px",
    fontWeight: 700,
  } as const;

  return (
    <footer
      className="mx-auto mt-10 flex w-full max-w-6xl flex-wrap items-center justify-center gap-4 px-4 py-6 sm:justify-between"
      style={{ borderTop: "1px solid var(--border-subtle)" }}
    >
      <span className="hidden sm:block">
        <Wordmark size={18} />
      </span>
      <span className="hidden sm:block" style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)", flex: "1 1 200px" }}>
        {t.footer.conceptBy}{" "}
        <a href="https://ungevil.no" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-link)", fontWeight: 600 }}>
          Unge Vil
        </a>
      </span>
      <nav aria-label={t.footer.about} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <Link href="/hjelp" style={linkStyle}>Hjelp</Link>
        <Link href="/om" style={linkStyle}>{t.footer.about}</Link>
        <Link href="/personvern-og-vilkar" style={linkStyle}>{t.footer.privacyTerms}</Link>
        <Link href={signedIn ? "/konto" : "/logg-inn"} className="hidden sm:inline-flex" style={accountLinkStyle}>
          {signedIn ? t.account.title : t.nav.login}
        </Link>
      </nav>
    </footer>
  );
}
