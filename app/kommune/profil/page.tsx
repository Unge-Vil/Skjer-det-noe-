import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getMyMunicipalities, getActiveMunicipality } from "@/lib/kommune";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { MuniSwitcher } from "@/components/admin/MuniSwitcher";
import { kommuneNav } from "@/components/admin/kommuneNav";
import { MuniProfileForm } from "@/components/admin/MuniProfileForm";

export const dynamic = "force-dynamic";

export default async function KommuneProfilePage() {
  const user = await getUser();
  if (!user) redirect("/logg-inn");

  const [munis, active] = await Promise.all([getMyMunicipalities(), getActiveMunicipality()]);
  if (!active) redirect("/kommune");

  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <AdminShell
      title={t.kommune.profileTitle}
      identity={<MuniSwitcher munis={munis} activeId={active.id} />}
      nav={kommuneNav(t, "/kommune/profil")}
    >
      <MuniProfileForm municipalityId={active.id} initialSocialLinks={active.socialLinks} />
    </AdminShell>
  );
}
