import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { fetchDirectoryListing } from "@/lib/directory";
import { DirectoryDetail } from "@/components/DirectoryDetail";
import { SiteFooter } from "@/components/SiteFooter";
import { absoluteUrl, jsonLd, listingMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const l = await fetchDirectoryListing(supabase, "service", slug, await getLocale());
  return l
    ? listingMetadata({ title: l.title, description: l.description, imageUrl: l.imageUrl, pathname: `/tjeneste/${slug}` })
    : { title: "Skjer det noe?" };
}

export default async function TjenesteDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = getDictionary(locale);
  const supabase = await createClient();
  const listing = await fetchDirectoryListing(supabase, "service", slug, locale);
  if (!listing) notFound();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: listing.title,
            description: listing.description ?? undefined,
            url: absoluteUrl(`/tjeneste/${slug}`),
            image: listing.imageUrl ?? undefined,
            about: { "@type": "Thing", name: "Tjeneste" },
            provider: listing.organizationName
              ? { "@type": "Organization", name: listing.organizationName }
              : undefined,
          }),
        }}
      />
      <DirectoryDetail
        listing={listing}
        labels={{ offeredBy: t.directory.offeredBy, area: t.directory.area, price: t.directory.price, timeCommitment: t.directory.timeCommitment, contact: t.directory.contact, website: t.detail.website }}
        backHref="/tjenester"
        backLabel={t.directory.servicesTitle}
      />
      <SiteFooter />
    </>
  );
}
