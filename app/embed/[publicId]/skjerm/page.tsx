import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { KioskView } from "@/components/embed/KioskView";
import { fetchEmbedConfig, fetchEmbedListings, rowToEmbedItem } from "@/lib/embeds";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function EmbedKioskPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const config = await fetchEmbedConfig(publicId);
  if (!config) notFound();

  const rows = await fetchEmbedListings(publicId);
  return <KioskView items={rows.map((row) => rowToEmbedItem(row, "nb"))} ownerName={config.owner_name} />;
}
