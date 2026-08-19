import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getMyOrg } from "@/lib/org";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { Button } from "@/components/ds/Button";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContextSwitcher } from "@/components/admin/ContextSwitcher";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { orgAdminNav } from "@/components/admin/orgAdminNav";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const user = await getUser();
  if (!user) redirect("/logg-inn");
  const org = await getMyOrg();
  if (!org) redirect("/registrer");

  const locale = await getLocale();
  const t = getDictionary(locale);
  const previewHref = `/organisasjon/${org.slug}`;
  return (
    <AdminShell
      title={t.orgadmin.media}
      identity={<ContextSwitcher />}
      nav={orgAdminNav(t)}
      headerAction={
        <div className="flex items-center gap-2">
          <Link href="/admin/aktivitet/ny"><Button size="sm" leadingIcon="plus">{t.admin.newActivity}</Button></Link>
          <a href={previewHref} target="_blank" rel="noopener noreferrer"><Button variant="secondary" size="sm" leadingIcon="external-link">{t.orgadmin.previewPublic}</Button></a>
        </div>
      }
    >
      <div
        className="mx-auto w-full max-w-3xl"
        style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}
      >
        <section style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: 20 }}>
          <ImageUploader rowId={org.id} column="banner_url" label={t.orgadmin.banner} currentUrl={org.bannerUrl} aspect="3 / 1" recommended="1200 × 400 px · 3:1" expectedRatio={3} />
        </section>
        <section style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: 20 }}>
          <ImageUploader rowId={org.id} column="logo_url" label={t.orgadmin.logo} currentUrl={org.logoUrl} aspect="1 / 1" recommended="400 × 400 px · 1:1" expectedRatio={1} />
        </section>
      </div>
    </AdminShell>
  );
}
