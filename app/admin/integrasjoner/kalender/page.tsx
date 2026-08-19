import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getMyOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContextSwitcher } from "@/components/admin/ContextSwitcher";
import { CalendarFeedsManager, type FeedRow } from "@/components/admin/CalendarFeedsManager";
import { IntegrationNav } from "@/components/admin/IntegrationNav";
import { orgAdminNav } from "@/components/admin/orgAdminNav";
import { categoryDef } from "@/components/ds/categories";

export const dynamic = "force-dynamic";

export default async function CalendarIntegrationPage() {
  const user = await getUser();
  if (!user) redirect("/logg-inn");
  const org = await getMyOrg();
  if (!org) redirect("/admin");
  const locale = await getLocale();
  const t = getDictionary(locale);
  const supabase = await createClient();
  const [feedsRes, profilesRes, catsRes] = await Promise.all([
    supabase.from("calendar_feeds").select("id,url,label,profile_id,default_category_id,auto_publish,active,last_synced_at,last_status,last_error").eq("organization_id", org.id).order("created_at", { ascending: false }),
    supabase.from("org_profiles").select("id,name").eq("organization_id", org.id).order("name"),
    supabase.from("categories").select("id,slug").order("sort_order"),
  ]);
  const profiles = ((profilesRes.data as { id: string; name: string }[]) ?? []).map((p) => ({ id: p.id, name: p.name }));
  const categories = ((catsRes.data as { id: string; slug: string }[]) ?? []).map((c) => ({ id: c.id, name: categoryDef(c.slug).label }));

  return <AdminShell title="Kalender-feeds" identity={<ContextSwitcher />} nav={orgAdminNav(t)}>
    <main id="main" className="mx-auto w-full max-w-4xl" style={{ padding: 24 }}>
      <IntegrationNav />
      <div style={{ marginBottom: 20 }}><h1 style={{ margin: "0 0 6px", fontSize: "var(--fs-h2)", fontWeight: 800 }}>Kalender-feeds</h1><p style={{ margin: 0, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.integrations.feedsHint}</p></div>
      <CalendarFeedsManager orgId={org.id} initial={(feedsRes.data as FeedRow[]) ?? []} profiles={profiles} categories={categories} />
    </main>
  </AdminShell>;
}
