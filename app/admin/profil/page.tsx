import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getMyOrg, getMyOrgs } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { Button } from "@/components/ds/Button";
import { AdminShell, type NavItem } from "@/components/admin/AdminShell";
import { OrgSwitcher } from "@/components/admin/OrgSwitcher";
import { ProfileForm } from "@/components/admin/ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) redirect("/logg-inn");
  const org = await getMyOrg();
  if (!org) redirect("/registrer");

  const locale = await getLocale();
  const t = getDictionary(locale);
  const supabase = await createClient();

  const { data: ovRows } = await supabase
    .from("organization_municipalities")
    .select("municipality_id,description,description_en")
    .eq("organization_id", org.id);

  const initialOverrides: Record<string, { description: string; description_en: string }> = {};
  for (const r of ovRows ?? []) {
    initialOverrides[r.municipality_id as string] = {
      description: (r.description as string) ?? "",
      description_en: (r.description_en as string) ?? "",
    };
  }

  const orgs = await getMyOrgs();
  const previewHref = `/organisasjon/${org.slug}`;
  const nav: NavItem[] = [
    { href: "/admin", label: t.orgadmin.overview, icon: "layout-dashboard" },
    { href: "/admin/profil", label: t.orgadmin.profile, icon: "building-2" },
    { href: previewHref, label: t.orgadmin.preview, icon: "external-link" },
  ];

  return (
    <AdminShell
      title={t.orgadmin.profile}
      identity={<OrgSwitcher orgs={orgs} activeId={org.id} />}
      nav={nav}
      footerTop={
        <Link href="/admin/aktivitet/ny">
          <Button fullWidth leadingIcon="plus">{t.admin.newActivity}</Button>
        </Link>
      }
      headerAction={
        <a href={previewHref} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary" size="sm" leadingIcon="external-link">
            {t.orgadmin.previewPublic}
          </Button>
        </a>
      }
    >
      <ProfileForm
        org={{
          id: org.id,
          name: org.name,
          description: org.description ?? "",
          descriptionEn: org.descriptionEn ?? "",
          website: org.website ?? "",
          email: org.email ?? "",
          phone: org.phone ?? "",
          address: org.address ?? "",
        }}
        municipalities={org.municipalities}
        initialOverrides={initialOverrides}
      />
    </AdminShell>
  );
}
