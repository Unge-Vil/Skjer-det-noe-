import Link from "next/link";
import Image from "next/image";
import { Icon, type IconName } from "@/components/ds/Icon";
import type { DirectoryListing } from "@/lib/directory";

/** Public detail view for a directory listing. Presentational — the page
 *  supplies already-localised labels. */
export function DirectoryDetail({
  listing,
  labels,
  backHref,
  backLabel,
}: {
  listing: DirectoryListing;
  labels: { offeredBy: string; area: string; price: string; timeCommitment: string; contact: string; website: string };
  backHref: string;
  backLabel: string;
}) {
  const l = listing;
  const meta: { icon: IconName; label: string; value: string }[] = [];
  if (l.area) meta.push({ icon: "map-pin", label: labels.area, value: l.area });
  if (l.price) meta.push({ icon: "wallet", label: labels.price, value: l.price });
  if (l.timeCommitment) meta.push({ icon: "clock", label: labels.timeCommitment, value: l.timeCommitment });

  const contact: { icon: IconName; value: string; href?: string }[] = [];
  if (l.contactName) contact.push({ icon: "user", value: l.contactName });
  if (l.contactEmail) contact.push({ icon: "mail", value: l.contactEmail, href: `mailto:${l.contactEmail}` });
  if (l.contactPhone) contact.push({ icon: "phone", value: l.contactPhone, href: `tel:${l.contactPhone}` });
  if (l.url) contact.push({ icon: "arrow-right", value: labels.website, href: l.url });

  return (
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Link href={backHref} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-link)", fontWeight: 600, fontSize: "var(--fs-sm)", textDecoration: "none" }}>
        <Icon name="arrow-left" size={15} />
        {backLabel}
      </Link>

      {l.imageUrl && (
        <div style={{ position: "relative", aspectRatio: "16 / 9", borderRadius: "var(--radius-lg)", overflow: "hidden", margin: "16px 0", background: "var(--fjord-100)" }}>
          <Image src={l.imageUrl} alt="" fill style={{ objectFit: "cover" }} sizes="768px" />
        </div>
      )}

      <h1 style={{ margin: "16px 0 6px", fontSize: "var(--fs-h1)", fontWeight: 800 }}>{l.title}</h1>
      {l.organizationName && (
        <p style={{ margin: "0 0 16px", fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
          {labels.offeredBy}{" "}
          {l.organizationSlug ? (
            <Link href={`/organisasjon/${l.organizationSlug}`} style={{ color: "var(--text-link)", fontWeight: 600 }}>{l.organizationName}</Link>
          ) : (
            <strong>{l.organizationName}</strong>
          )}
        </p>
      )}

      {l.description && (
        <p style={{ margin: "0 0 20px", maxWidth: "var(--content-measure)", lineHeight: 1.6, color: "var(--text-body)", whiteSpace: "pre-wrap" }}>{l.description}</p>
      )}

      {meta.length > 0 && (
        <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 12px", margin: "0 0 20px", fontSize: "var(--fs-sm)" }}>
          {meta.map((m) => (
            <div key={m.label} style={{ display: "contents" }}>
              <dt style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-muted)" }}>
                <Icon name={m.icon} size={15} /> {m.label}
              </dt>
              <dd style={{ margin: 0, fontWeight: 600 }}>{m.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {contact.length > 0 && (
        <section style={{ display: "flex", flexDirection: "column", gap: 8, padding: 16, borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", background: "var(--surface-card)" }}>
          <h2 style={{ margin: 0, fontSize: "var(--fs-h4)", fontWeight: 700 }}>{labels.contact}</h2>
          {contact.map((c, i) => (
            <p key={i} style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, fontSize: "var(--fs-sm)" }}>
              <Icon name={c.icon} size={15} />
              {c.href ? (
                <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined} style={{ color: "var(--text-link)", fontWeight: 600 }}>
                  {c.value}
                </a>
              ) : (
                <span>{c.value}</span>
              )}
            </p>
          ))}
        </section>
      )}
    </main>
  );
}
