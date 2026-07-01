import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { loc } from "@/lib/i18n/config";
import { Icon } from "@/components/ds/Icon";
import { SocialLinksBar } from "@/components/SocialLinksBar";
import { RichTextContent } from "@/components/RichTextContent";
import { isEmptyDoc } from "@/lib/tiptap";

export const dynamic = "force-dynamic";

async function fetchMuni(slug: string) {
  const supabase = await createClient();
  const { data: muni } = await supabase
    .from("municipalities")
    .select(
      "id,name,slug,county,description,description_en,description_doc,description_doc_en,website,email,phone,address,accessibility_url,social_links",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (!muni) return null;

  const { data: pages } = await supabase
    .from("municipality_pages")
    .select("title,title_en,slug")
    .eq("municipality_id", muni.id)
    .eq("status", "published")
    .order("title");

  return { muni, pages: pages ?? [] };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchMuni(slug);
  const name = data?.muni.name;
  return { title: name ? `${name} – Skjer det noe?` : "Skjer det noe?" };
}

export default async function MunicipalityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await fetchMuni(slug);
  if (!data) notFound();

  const locale = await getLocale();
  const t = getDictionary(locale);
  const { muni, pages } = data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = muni as any;
  const descPlain = loc(locale, m.description, m.description_en);
  const descDoc =
    locale === "en" && !isEmptyDoc(m.description_doc_en) ? m.description_doc_en : m.description_doc;

  const contact: { icon: Parameters<typeof Icon>[0]["name"]; label: string; value: string; href?: string }[] = [];
  if (m.website) contact.push({ icon: "arrow-right", label: t.detail.website, value: m.website, href: m.website });
  if (m.email) contact.push({ icon: "mail", label: t.auth.email, value: m.email, href: `mailto:${m.email}` });
  if (m.phone) contact.push({ icon: "phone", label: t.orgadmin.phone, value: m.phone, href: `tel:${m.phone}` });
  if (m.address) contact.push({ icon: "map-pin", label: t.orgadmin.fAddress, value: m.address });

  return (
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <p style={{ margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
        <Icon name="map-pin" size={15} />
        {muni.county ?? t.form.municipality}
      </p>
      <h1 style={{ margin: "0 0 20px", fontSize: "var(--fs-h1)", fontWeight: 800 }}>{muni.name}</h1>

      {!isEmptyDoc(descDoc) ? (
        <div style={{ maxWidth: "var(--content-measure)", marginBottom: 20 }}>
          <RichTextContent doc={descDoc} />
        </div>
      ) : (
        descPlain && (
          <p style={{ margin: "0 0 20px", maxWidth: "var(--content-measure)", lineHeight: 1.6, color: "var(--text-body)" }}>
            {descPlain}
          </p>
        )
      )}

      {contact.length > 0 && (
        <section style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          {contact.map((c) => (
            <p key={c.label} style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, fontSize: "var(--fs-sm)" }}>
              <Icon name={c.icon} size={15} />
              {c.href ? (
                <a
                  href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  style={{ color: "var(--text-link)", fontWeight: 600 }}
                >
                  {c.value}
                </a>
              ) : (
                <span style={{ color: "var(--text-body)" }}>{c.value}</span>
              )}
            </p>
          ))}
        </section>
      )}

      {pages.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ margin: "0 0 12px", fontSize: "var(--fs-h3)", fontWeight: 700 }}>{t.kommune.pages}</h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {pages.map((p) => (
              <li key={p.slug}>
                <a
                  href={`/kommune/${muni.slug}/${p.slug}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--text-link)", fontWeight: 600 }}
                >
                  <Icon name="arrow-right" size={15} />
                  {loc(locale, p.title, p.title_en) ?? p.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <SocialLinksBar links={muni.social_links} />

      {m.accessibility_url && (
        <p style={{ marginTop: 20, fontSize: "var(--fs-sm)" }}>
          <a href={m.accessibility_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-link)", fontWeight: 600 }}>
            <Icon name="accessibility" size={15} />
            {t.footer.accessibility}
          </a>
        </p>
      )}

      <p style={{ marginTop: 24, fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{t.footer.tagline}</p>
    </main>
  );
}
