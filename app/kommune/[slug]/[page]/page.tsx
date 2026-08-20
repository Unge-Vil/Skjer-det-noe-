import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { loc } from "@/lib/i18n/config";
import { Render } from "@puckeditor/core/rsc";
import { Icon } from "@/components/ds/Icon";
import { SocialLinksBar } from "@/components/SocialLinksBar";
import { puckConfig, type PuckProps, type PuckRoot } from "@/lib/puck/config";
import type { Data } from "@puckeditor/core";
import { absoluteUrl, jsonLd, listingMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

async function fetchPage(muniSlug: string, pageSlug: string) {
  const supabase = await createClient();
  const { data: muni } = await supabase
    .from("municipalities")
    .select("id,name,slug,social_links")
    .eq("slug", muniSlug)
    .maybeSingle();
  if (!muni) return null;

  const { data: page } = await supabase
    .from("municipality_pages")
    .select("title,title_en,content,content_en,status")
    .eq("municipality_id", muni.id)
    .eq("slug", pageSlug)
    .eq("status", "published")
    .maybeSingle();
  if (!page) return null;

  return { muni, page };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}): Promise<Metadata> {
  const { slug, page } = await params;
  const data = await fetchPage(slug, page);
  if (!data) return { title: "Skjer det noe?" };
  return listingMetadata({
    title: data.page.title,
    description: null,
    imageUrl: null,
    pathname: `/kommune/${slug}/${page}`,
  });
}

export default async function MunicipalityInfoPage({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}) {
  const { slug, page } = await params;
  const data = await fetchPage(slug, page);
  if (!data) notFound();

  const locale = await getLocale();
  const t = getDictionary(locale);
  const { muni, page: p } = data;

  const title = loc(locale, p.title, p.title_en) ?? p.title;
  const pageData = (p.content ?? { content: [], root: { props: {} } }) as unknown as Data<PuckProps, PuckRoot>;
  const canonical = absoluteUrl(`/kommune/${slug}/${page}`);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: title,
            url: canonical,
            isPartOf: absoluteUrl(`/kommune/${muni.slug}`),
          }),
        }}
      />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <p style={{ margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
        <Icon name="map-pin" size={15} />
        {muni.name}
      </p>
      <h1 style={{ margin: "0 0 20px", fontSize: "var(--fs-h1)", fontWeight: 800 }}>{title}</h1>

      <article className="sdn-puck">
        <Render config={puckConfig} data={pageData} />
      </article>

      <div style={{ marginTop: 28 }}>
        <SocialLinksBar links={muni.social_links} />
      </div>

      <p style={{ marginTop: 24, fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{t.footer.tagline}</p>
      </main>
    </>
  );
}
