import { NextResponse } from "next/server";
import { fetchEmbedConfig, fetchEmbedListings, type EmbedListingRow } from "@/lib/embeds";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function itemUrl(row: EmbedListingRow): string {
  return absoluteUrl(row.kind === "event" ? `/arrangement/${row.slug}` : `/aktivitet/${row.slug}`);
}

function itemDescription(row: EmbedListingRow): string {
  const details = [row.description, row.address, row.organization_name]
    .filter((value): value is string => Boolean(value?.trim()));
  if (row.kind === "event" && row.starts_at) {
    details.unshift(new Date(row.starts_at).toLocaleString("nb-NO", { dateStyle: "long", timeStyle: "short" }));
  }
  return details.join("\n");
}

function itemXml(row: EmbedListingRow): string {
  const url = itemUrl(row);
  const description = itemDescription(row);
  const pubDate = row.starts_at ? new Date(row.starts_at).toUTCString() : undefined;

  return [
    "    <item>",
    `      <title>${escapeXml(row.title)}</title>`,
    `      <link>${escapeXml(url)}</link>`,
    `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
    description ? `      <description>${escapeXml(description)}</description>` : "",
    pubDate ? `      <pubDate>${pubDate}</pubDate>` : "",
    row.image_url ? `      <enclosure url="${escapeXml(row.image_url)}" type="image/*" />` : "",
    "    </item>",
  ].filter(Boolean).join("\n");
}

/** Public RSS feed for the published listings configured by an embed. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ publicId: string }> },
) {
  const { publicId } = await params;
  const config = await fetchEmbedConfig(publicId);
  if (!config) {
    return new NextResponse("Not found", { status: 404 });
  }

  const rows = await fetchEmbedListings(publicId);
  const feedUrl = absoluteUrl(`/api/public/v1/feeds/${encodeURIComponent(publicId)}/rss`);
  const siteUrl = absoluteUrl("/");
  const title = config.owner_name ? `${config.owner_name} – Skjer det noe?` : "Skjer det noe?";
  const description = config.owner_name
    ? `Publiserte aktiviteter og arrangementer fra ${config.owner_name}.`
    : "Publiserte aktiviteter og arrangementer fra Skjer det noe?";

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "  <channel>",
    `    <title>${escapeXml(title)}</title>`,
    `    <link>${escapeXml(siteUrl)}</link>`,
    `    <description>${escapeXml(description)}</description>`,
    `    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" xmlns:atom="http://www.w3.org/2005/Atom" />`,
    `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    rows.map(itemXml).join("\n"),
    "  </channel>",
    "</rss>",
  ].join("\n");

  return new NextResponse(xml, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
