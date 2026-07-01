import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getActiveMunicipality } from "@/lib/kommune";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContextSwitcher } from "@/components/admin/ContextSwitcher";
import { kommuneNav } from "@/components/admin/kommuneNav";
import { MuniProfileForm } from "@/components/admin/MuniProfileForm";

export const dynamic = "force-dynamic";

export default async function KommuneProfilePage() {
  const user = await getUser();
  if (!user) redirect("/logg-inn");

  const active = await getActiveMunicipality();
  if (!active) redirect("/kommune");

  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <AdminShell
      title={t.kommune.profileTitle}
      identity={<ContextSwitcher />}
      nav={kommuneNav(t, "/kommune/profil")}
    >
      <MuniProfileForm
        municipalityId={active.id}
        initial={{
          description: active.description ?? "",
          descriptionEn: active.descriptionEn ?? "",
          descriptionDoc: active.descriptionDoc,
          descriptionDocEn: active.descriptionDocEn,
          website: active.website ?? "",
          email: active.email ?? "",
          phone: active.phone ?? "",
          address: active.address ?? "",
          accessibilityUrl: active.accessibilityUrl ?? "",
          socialLinks: active.socialLinks,
        }}
      />
    </AdminShell>
  );
}
