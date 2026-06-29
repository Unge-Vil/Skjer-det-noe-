import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getMyMunicipalities, getActiveMunicipality } from "@/lib/kommune";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { Button } from "@/components/ds/Button";
import { AdminShell } from "@/components/admin/AdminShell";
import { MuniSwitcher } from "@/components/admin/MuniSwitcher";
import { kommuneNav } from "@/components/admin/kommuneNav";
import { MuniPageForm, type MuniPageInitial } from "@/components/admin/MuniPageForm";

export const dynamic = "force-dynamic";

export default async function KommunePageEditor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect("/logg-inn");

  const [munis, active] = await Promise.all([getMyMunicipalities(), getActiveMunicipality()]);
  if (!active) redirect("/kommune");

  const locale = await getLocale();
  const t = getDictionary(locale);
  const supabase = await createClient();

  let initial: MuniPageInitial = {
    id: null,
    title: "",
    titleEn: "",
    slug: "",
    content: null,
    contentEn: null,
    status: "draft",
  };

  if (id !== "ny") {
    const { data } = await supabase
      .from("municipality_pages")
      .select("id,title,title_en,slug,content,content_en,status,municipality_id")
      .eq("id", id)
      .maybeSingle();
    if (!data) notFound();
    initial = {
      id: data.id as string,
      title: (data.title as string) ?? "",
      titleEn: (data.title_en as string) ?? "",
      slug: (data.slug as string) ?? "",
      content: data.content ?? null,
      contentEn: data.content_en ?? null,
      status: (data.status as string) ?? "draft",
    };
  }

  const publicHref = initial.id && initial.status === "published" ? `/kommune/${active.slug}/${initial.slug}` : null;

  return (
    <AdminShell
      title={initial.id ? initial.title || t.kommune.pages : t.kommune.newPage}
      identity={<MuniSwitcher munis={munis} activeId={active.id} />}
      nav={kommuneNav(t, "/kommune/sider")}
      headerAction={
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/kommune/sider">
            <Button variant="secondary" size="sm" leadingIcon="arrow-left">{t.kommune.backToPages}</Button>
          </Link>
          {publicHref && (
            <a href={publicHref} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm" leadingIcon="external-link">{t.kommune.openPublic}</Button>
            </a>
          )}
        </div>
      }
    >
      <MuniPageForm municipalityId={active.id} municipalitySlug={active.slug} page={initial} />
    </AdminShell>
  );
}
