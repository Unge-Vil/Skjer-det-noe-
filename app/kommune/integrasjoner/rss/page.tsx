import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getActiveMunicipality } from "@/lib/kommune";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContextSwitcher } from "@/components/admin/ContextSwitcher";
import { kommuneNav } from "@/components/admin/kommuneNav";
import { MunicipalityIntegrationNav } from "@/components/admin/MunicipalityIntegrationNav";
import { RssFeedsManager } from "@/components/admin/RssFeedsManager";
import type { EmbedRow } from "@/components/admin/EmbedsManager";

export const dynamic = "force-dynamic";

const COLUMNS = "id,public_id,label,kind,layout,theme,item_limit,category_slugs,allowed_origins,active,created_at";

export default async function MunicipalityRssPage() {
  const user = await getUser();
  if (!user) redirect("/logg-inn");
  const active = await getActiveMunicipality();
  if (!active) redirect("/kommune");
  const locale = await getLocale();
  const t = getDictionary(locale);
  const { data } = await (await createClient())
    .from("embeds")
    .select(COLUMNS)
    .eq("municipality_id", active.id)
    .order("created_at", { ascending: false });

  return (
    <AdminShell title="RSS-feed" identity={<ContextSwitcher />} nav={kommuneNav(t, "/kommune/integrasjoner")}>
      <main id="main" className="mx-auto w-full max-w-4xl" style={{ padding: 24 }}>
        <MunicipalityIntegrationNav />
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: "var(--fs-h2)", fontWeight: 800 }}>RSS-feed</h1>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
            Publiser kommunens aktiviteter og arrangementer automatisk på kommunens nettside. Feedene følger innstillingene under Innebygging.
          </p>
        </div>
        <RssFeedsManager embeds={(data as EmbedRow[]) ?? []} />
      </main>
    </AdminShell>
  );
}
