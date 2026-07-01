import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getMyOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { Button } from "@/components/ds/Button";
import { AdminShell, type NavItem } from "@/components/admin/AdminShell";
import { ContextSwitcher } from "@/components/admin/ContextSwitcher";
import { OrgMemberManager } from "@/components/admin/OrgMemberManager";

export const dynamic = "force-dynamic";

type Member = { user_id: string; email: string; role: string };

export default async function SettingsPage() {
  const user = await getUser();
  if (!user) redirect("/logg-inn");
  const org = await getMyOrg();
  if (!org) redirect("/registrer");

  const locale = await getLocale();
  const t = getDictionary(locale);
  const supabase = await createClient();
  const { data: memberData } = await supabase.rpc("list_org_members", { p_org: org.id });
  const members = (memberData as Member[]) ?? [];

  const previewHref = `/organisasjon/${org.slug}`;
  const nav: NavItem[] = [
    { href: "/admin", label: t.orgadmin.overview, icon: "layout-dashboard" },
    { href: "/admin/profil", label: t.orgadmin.profile, icon: "building-2" },
    { href: "/admin/bilder", label: t.orgadmin.media, icon: "image" },
    { href: "/admin/innstillinger", label: t.orgadmin.settings, icon: "settings" },
    { href: previewHref, label: t.orgadmin.preview, icon: "external-link" },
  ];

  return (
    <AdminShell
      title={t.orgadmin.settings}
      identity={<ContextSwitcher />}
      nav={nav}
      footerTop={
        <Link href="/admin/aktivitet/ny">
          <Button fullWidth leadingIcon="plus">{t.admin.newActivity}</Button>
        </Link>
      }
      headerAction={
        <a href={previewHref} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary" size="sm" leadingIcon="external-link">{t.orgadmin.previewPublic}</Button>
        </a>
      }
    >
      <div className="mx-auto w-full max-w-3xl" style={{ padding: 24 }}>
        <section style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: 20 }}>
          <h2 style={{ margin: "0 0 2px", fontSize: "var(--fs-h4)", fontWeight: 700 }}>{t.orgadmin.members}</h2>
          <p style={{ margin: "0 0 16px", fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>{t.orgadmin.membersHint}</p>
          <OrgMemberManager orgId={org.id} members={members} currentUserId={user.id} />
        </section>
      </div>
    </AdminShell>
  );
}
