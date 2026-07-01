import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { fetchDirectoryListings } from "@/lib/directory";
import { DirectoryList } from "@/components/DirectoryList";
import { SiteFooter } from "@/components/SiteFooter";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tjenester – Skjer det noe?" };

export default async function TjenesterPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const supabase = await createClient();
  const listings = await fetchDirectoryListings(supabase, "service", locale);
  return (
    <>
      <DirectoryList
        title={t.directory.servicesTitle}
        sub={t.directory.servicesSub}
        empty={t.directory.empty}
        detailBase="/tjeneste"
        metaLabel={(l) => l.price}
        listings={listings}
      />
      <SiteFooter />
    </>
  );
}
