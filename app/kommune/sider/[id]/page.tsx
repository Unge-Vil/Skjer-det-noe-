import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getActiveMunicipality } from "@/lib/kommune";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { Button } from "@/components/ds/Button";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContextSwitcher } from "@/components/admin/ContextSwitcher";
import { kommuneNav } from "@/components/admin/kommuneNav";
import { MuniPageBuilder } from "@/components/admin/MuniPageBuilder";
import { toPuckData, type PuckRoot } from "@/lib/puck/config";

export const dynamic = "force-dynamic";

export default async function KommunePageEditor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect("/logg-inn");

  const active = await getActiveMunicipality();
  if (!active) redirect("/kommune");

  const locale = await getLocale();
  const t = getDictionary(locale);
  const supabase = await createClient();

  let root: PuckRoot = { title: "", titleEn: "", slug: "", status: "draft" };
  let content: unknown = null;
  let publicSlug: string | null = null;
  let published = false;

  if (id !== "ny") {
    const { data } = await supabase
      .from("municipality_pages")
      .select("title,title_en,slug,content,status")
      .eq("id", id)
      .maybeSingle();
    if (!data) notFound();
    root = {
      title: (data.title as string) ?? "",
      titleEn: (data.title_en as string) ?? "",
      slug: (data.slug as string) ?? "",
      status: (data.status as "draft" | "published") ?? "draft",
    };
    content = data.content;
    publicSlug = (data.slug as string) ?? null;
    published = data.status === "published";
  }

  const publicHref = published && publicSlug ? `/kommune/${active.slug}/${publicSlug}` : null;

  return (
    <AdminShell
      title={id === "ny" ? t.kommune.newPage : root.title || t.kommune.pages}
      identity={<ContextSwitcher />}
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
      <MuniPageBuilder
        municipalityId={active.id}
        pageId={id === "ny" ? null : id}
        initialData={toPuckData(content, root)}
      />
    </AdminShell>
  );
}
