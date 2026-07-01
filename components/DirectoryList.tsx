import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/ds/Icon";
import { categoryDef } from "@/components/ds/categories";
import type { DirectoryListing } from "@/lib/directory";

/** Public list of directory listings (services / volunteer needs). Presentational
 *  — used by the server list pages, which supply already-localised strings. */
export function DirectoryList({
  title,
  sub,
  empty,
  detailBase,
  metaLabel,
  listings,
}: {
  title: string;
  sub: string;
  empty: string;
  detailBase: string; // "/tjeneste" | "/frivillig"
  /** value picker for the secondary meta line (price or time commitment). */
  metaLabel: (l: DirectoryListing) => string | null;
  listings: DirectoryListing[];
}) {
  return (
    <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <header className="mb-6">
        <h1 style={{ margin: "0 0 6px", fontSize: "var(--fs-h1)", fontWeight: 800 }}>{title}</h1>
        <p style={{ margin: 0, fontSize: "var(--fs-body)", color: "var(--text-muted)" }}>{sub}</p>
      </header>

      {listings.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{empty}</p>
      ) : (
        <div className="sdn-stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => {
            const cat = categoryDef(l.categorySlug);
            const meta = metaLabel(l);
            return (
              <Link
                key={l.id}
                href={`${detailBase}/${l.slug}`}
                style={{ display: "flex", flexDirection: "column", overflow: "hidden", textDecoration: "none", color: "var(--text-body)", background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)" }}
              >
                <div style={{ position: "relative", aspectRatio: "16 / 9", background: cat.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {l.imageUrl ? (
                    <Image src={l.imageUrl} alt="" fill style={{ objectFit: "cover" }} sizes="360px" />
                  ) : (
                    <Icon name={cat.icon} size={32} color={cat.fg} />
                  )}
                </div>
                <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                  <h2 style={{ margin: 0, fontSize: "var(--fs-h4)", fontWeight: 700 }}>{l.title}</h2>
                  {l.organizationName && (
                    <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>{l.organizationName}</p>
                  )}
                  <p style={{ margin: "2px 0 0", display: "flex", flexWrap: "wrap", gap: 10, fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
                    {l.area && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Icon name="map-pin" size={13} /> {l.area}
                      </span>
                    )}
                    {meta && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Icon name="clock" size={13} /> {meta}
                      </span>
                    )}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
