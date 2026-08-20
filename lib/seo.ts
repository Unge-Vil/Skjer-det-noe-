import type { Metadata } from "next";

export const SITE_NAME = "Skjer det noe?";

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
export const SITE_URL = (configuredSiteUrl ?? "http://localhost:3000").replace(/\/$/, "");

export function absoluteUrl(pathname: string): string {
  return new URL(pathname, `${SITE_URL}/`).toString();
}

type ListingMetadataInput = {
  title: string;
  description: string | null;
  imageUrl: string | null;
  pathname: string;
};

export function listingMetadata({
  title,
  description,
  imageUrl,
  pathname,
}: ListingMetadataInput): Metadata {
  const pageTitle = `${title} - ${SITE_NAME}`;
  const summary = description?.trim() || `Se ${title} på ${SITE_NAME}.`;
  const canonical = absoluteUrl(pathname);

  return {
    title: pageTitle,
    description: summary,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "nb_NO",
      siteName: SITE_NAME,
      title: pageTitle,
      description: summary,
      url: canonical,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: pageTitle,
      description: summary,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export function jsonLd(value: Record<string, unknown>): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}