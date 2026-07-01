import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getMyOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { AdminShell, type NavItem } from "@/components/admin/AdminShell";
import { ContextSwitcher } from "@/components/admin/ContextSwitcher";
import { ApiKeysManager, type ApiKeyRow } from "@/components/admin/ApiKeysManager";
import { CalendarFeedsManager, type FeedRow } from "@/components/admin/CalendarFeedsManager";
import { categoryDef } from "@/components/ds/categories";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const user = await getUser();
  if (!user) redirect("/logg-inn");

  const org = await getMyOrg();
  if (!org) redirect("/admin");

  const locale = await getLocale();
  const t = getDictionary(locale);
  const supabase = await createClient();

  const [keysRes, feedsRes, profilesRes, catsRes] = await Promise.all([
    supabase.from("api_keys").select("id,label,key_prefix,auto_publish,created_at,last_used_at,revoked_at").eq("organization_id", org.id).order("created_at", { ascending: false }),
    supabase.from("calendar_feeds").select("id,url,label,profile_id,default_category_id,auto_publish,active,last_synced_at,last_status,last_error").eq("organization_id", org.id).order("created_at", { ascending: false }),
    supabase.from("org_profiles").select("id,name").eq("organization_id", org.id).order("name"),
    supabase.from("categories").select("id,slug").order("sort_order"),
  ]);

  const keys = (keysRes.data as ApiKeyRow[]) ?? [];
  const feeds = (feedsRes.data as FeedRow[]) ?? [];
  const profiles = ((profilesRes.data as { id: string; name: string }[]) ?? []).map((p) => ({ id: p.id, name: p.name }));
  const categories = ((catsRes.data as { id: string; slug: string }[]) ?? []).map((c) => ({ id: c.id, name: categoryDef(c.slug).label }));

  const nav: NavItem[] = [
    { href: "/admin", label: t.orgadmin.overview, icon: "layout-dashboard" },
    { href: "/admin/profil", label: t.orgadmin.profile, icon: "building-2" },
    { href: "/admin/profiler", label: t.orgadmin.departments, icon: "building-2" },
    { href: "/admin/bilder", label: t.orgadmin.media, icon: "image" },
    { href: "/admin/integrasjoner", label: t.orgadmin.integrations, icon: "plug" },
    { href: "/admin/innstillinger", label: t.orgadmin.settings, icon: "settings" },
  ];

  return (
    <AdminShell title={t.integrations.title} identity={<ContextSwitcher />} nav={nav}>
      <div className="mx-auto w-full max-w-3xl" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.integrations.subtitle}</p>
        <ApiKeysManager orgId={org.id} initial={keys} />
        <CalendarFeedsManager orgId={org.id} initial={feeds} profiles={profiles} categories={categories} />
      </div>
    </AdminShell>
  );
}
