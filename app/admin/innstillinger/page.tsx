import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getMyOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { LinkButton } from "@/components/ds/LinkButton";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContextSwitcher } from "@/components/admin/ContextSwitcher";
import { OrgMemberManager } from "@/components/admin/OrgMemberManager";
import { orgAdminNav } from "@/components/admin/orgAdminNav";

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
  return (
    <AdminShell
      title={t.orgadmin.settings}
      identity={<ContextSwitcher />}
      nav={orgAdminNav(t)}
      headerAction={
        <div className="flex items-center gap-2">
          <LinkButton href="/admin/aktivitet/ny" size="sm" leadingIcon="plus">{t.admin.newActivity}</LinkButton>
          <LinkButton href={previewHref} target="_blank" rel="noopener noreferrer" variant="secondary" size="sm" leadingIcon="external-link">{t.orgadmin.previewPublic}</LinkButton>
        </div>
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
