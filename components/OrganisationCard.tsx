import Link from "next/link";
import { Icon } from "@/components/ds/Icon";

/** Compact organisation teaser card (server-safe, no hooks). */
export function OrganisationCard({
  name,
  href,
  place,
  countLabel,
}: {
  name: string;
  href: string;
  place: string | null;
  countLabel: string | null;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
      <article
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-sm)",
          overflow: "hidden",
          height: "100%",
        }}
      >
        <div style={{ height: 56, background: "var(--fjord-100)" }} />
        <div style={{ padding: "12px 16px 16px" }}>
          <h3 style={{ margin: "0 0 6px", fontSize: "var(--fs-h4)", fontWeight: "var(--fw-bold)", lineHeight: 1.25 }}>
            {name}
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 14px", fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
            {place && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Icon name="map-pin" size={14} /> {place}
              </span>
            )}
            {countLabel && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Icon name="calendar-days" size={14} /> {countLabel}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
