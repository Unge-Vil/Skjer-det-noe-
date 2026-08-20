import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EmbedList } from "@/components/embed/EmbedList";
import { EmbedAutoHeight } from "@/components/embed/EmbedAutoHeight";
import { Wordmark } from "@/components/ds/Wordmark";
import { fetchEmbedConfig, fetchEmbedListings, rowToEmbedItem } from "@/lib/embeds";
import { getBaseUrl } from "@/lib/siteUrl";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function EmbedPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const config = await fetchEmbedConfig(publicId);
  if (!config) notFound();

  const [rows, baseUrl] = await Promise.all([fetchEmbedListings(publicId), getBaseUrl()]);
  const items = rows.map((row) => rowToEmbedItem(row, "nb"));
  const isActivities = config.kind === "activities";

  return (
    <div style={{ padding: 12, background: "var(--bg-app)", minHeight: "100%" }}>
      <EmbedAutoHeight publicId={publicId} />
      <EmbedList
        items={items}
        layout={config.layout}
        baseUrl={baseUrl}
        emptyText={isActivities ? "Ingen aktiviteter akkurat nå." : "Ingen kommende arrangementer."}
      />
      <a
        href={baseUrl}
        target="_top"
        rel="noopener"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 12,
          fontSize: "var(--fs-xs)",
          color: "var(--text-muted)",
          textDecoration: "none",
        }}
      >
        Levert av
        <Wordmark size={14} withMark />
      </a>
    </div>
  );
}
