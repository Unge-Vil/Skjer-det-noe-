import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getMyOrg } from "@/lib/org";
import { getActiveProfile } from "@/lib/profiles";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { Button } from "@/components/ds/Button";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContextSwitcher } from "@/components/admin/ContextSwitcher";
import { ProfileForm } from "@/components/admin/ProfileForm";
import { orgAdminNav } from "@/components/admin/orgAdminNav";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) redirect("/logg-inn");
  const org = await getMyOrg();
  if (!org) redirect("/registrer");
  const activeProfile = await getActiveProfile();
  if (activeProfile?.organizationId === org.id) redirect(`/admin/profiler/${activeProfile.id}`);

  const locale = await getLocale();
  const t = getDictionary(locale);

  const previewHref = `/organisasjon/${org.slug}`;
  return (
    <AdminShell
      title={t.orgadmin.profile}
      identity={<ContextSwitcher />}
      nav={orgAdminNav(t)}
      headerAction={
        <div className="flex items-center gap-2">
          <Link href="/admin/aktivitet/ny"><Button size="sm" leadingIcon="plus">{t.admin.newActivity}</Button></Link>
          <a href={previewHref} target="_blank" rel="noopener noreferrer"><Button variant="secondary" size="sm" leadingIcon="external-link">{t.orgadmin.previewPublic}</Button></a>
        </div>
      }
    >
      <ProfileForm
        org={{
          id: org.id,
          name: org.name,
          description: org.description ?? "",
          descriptionEn: org.descriptionEn ?? "",
          descriptionDoc: org.descriptionDoc,
          descriptionDocEn: org.descriptionDocEn,
          website: org.website ?? "",
          email: org.email ?? "",
          phone: org.phone ?? "",
          address: org.address ?? "",
          socialLinks: org.socialLinks,
        }}
      />
    </AdminShell>
  );
}
