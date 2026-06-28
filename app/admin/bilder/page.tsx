import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getMyOrg, getMyOrgs } from "@/lib/org";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { Button } from "@/components/ds/Button";
import { AdminShell, type NavItem } from "@/components/admin/AdminShell";
import { OrgSwitcher } from "@/components/admin/OrgSwitcher";
import { ImageUploader } from "@/components/admin/ImageUploader";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const user = await getUser();
  if (!user) redirect("/logg-inn");
  const org = await getMyOrg();
  if (!org) redirect("/registrer");

  const locale = await getLocale();
  const t = getDictionary(locale);
  const orgs = await getMyOrgs();
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
      title={t.orgadmin.media}
      identity={<OrgSwitcher orgs={orgs} activeId={org.id} />}
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
      <div
        className="mx-auto w-full max-w-3xl"
        style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}
      >
        <section style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: 20 }}>
          <ImageUploader orgId={org.id} column="banner_url" label={t.orgadmin.banner} currentUrl={org.bannerUrl} aspect="3 / 1" />
        </section>
        <section style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: 20 }}>
          <ImageUploader orgId={org.id} column="logo_url" label={t.orgadmin.logo} currentUrl={org.logoUrl} aspect="1 / 1" />
        </section>
      </div>
    </AdminShell>
  );
}
