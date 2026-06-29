import Link from "next/link";
import type { ReactNode } from "react";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { Icon } from "@/components/ds/Icon";
import { SiteFooter } from "@/components/SiteFooter";

/** Shared shell for static legal/info pages (privacy, terms). */
export async function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  const t = getDictionary(await getLocale());
  return (
    <>
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <Link
          href="/"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-link)", fontWeight: 600, fontSize: "var(--fs-sm)", textDecoration: "none" }}
        >
          <Icon name="arrow-left" size={15} />
          {t.footer.backHome}
        </Link>
        <h1 style={{ margin: "16px 0 4px", fontSize: "var(--fs-h1)", fontWeight: 800 }}>{title}</h1>
        <p style={{ margin: "0 0 24px", color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
          {t.footer.updated}: {updated}
        </p>
        <div className="sdn-richtext" style={{ minHeight: 0, padding: 0 }}>
          {children}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
