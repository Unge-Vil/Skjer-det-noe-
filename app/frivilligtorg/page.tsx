import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { fetchDirectoryListings } from "@/lib/directory";
import { DirectoryList } from "@/components/DirectoryList";
import { SiteFooter } from "@/components/SiteFooter";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Frivilligtorg – Skjer det noe?" };

export default async function FrivilligtorgPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const supabase = await createClient();
  const listings = await fetchDirectoryListings(supabase, "volunteer", locale);
  return (
    <>
      <DirectoryList
        title={t.directory.volunteerTitle}
        sub={t.directory.volunteerSub}
        empty={t.directory.empty}
        detailBase="/frivillig"
        metaLabel={(l) => l.timeCommitment}
        listings={listings}
      />
      <SiteFooter />
    </>
  );
}
