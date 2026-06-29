import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getMyMunicipalities, getActiveMunicipality } from "@/lib/kommune";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { Button } from "@/components/ds/Button";
import { Icon } from "@/components/ds/Icon";
import { AdminShell } from "@/components/admin/AdminShell";
import { MuniSwitcher } from "@/components/admin/MuniSwitcher";
import { kommuneNav } from "@/components/admin/kommuneNav";

export const dynamic = "force-dynamic";

type PageRow = { id: string; title: string; slug: string; status: string };

const cardStyle = {
  background: "var(--surface-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-lg)",
  padding: "12px 16px",
} as const;

export default async function KommunePagesPage() {
  const user = await getUser();
  if (!user) redirect("/logg-inn");

  const [munis, active] = await Promise.all([getMyMunicipalities(), getActiveMunicipality()]);
  if (!active) redirect("/kommune");

  const locale = await getLocale();
  const t = getDictionary(locale);
  const supabase = await createClient();

  const { data } = await supabase
    .from("municipality_pages")
    .select("id,title,slug,status")
    .eq("municipality_id", active.id)
    .order("sort_order")
    .order("title");
  const pages = (data as PageRow[]) ?? [];

  const statusText = (s: string) => (s === "published" ? t.kommune.published : t.kommune.draft);

  return (
    <AdminShell
      title={t.kommune.pages}
      identity={<MuniSwitcher munis={munis} activeId={active.id} />}
      nav={kommuneNav(t, "/kommune/sider")}
      headerAction={
        <Link href="/kommune/sider/ny">
          <Button size="sm" leadingIcon="plus">{t.kommune.newPage}</Button>
        </Link>
      }
    >
      <div className="mx-auto w-full max-w-3xl" style={{ padding: 24 }}>
        <p style={{ margin: "0 0 20px", color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
          {t.kommune.pagesSubtitle}
        </p>
        {pages.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.kommune.noPages}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {pages.map((p) => (
              <Link key={p.id} href={`/kommune/sider/${p.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div className="flex items-center justify-between gap-3" style={cardStyle}>
                  <div className="min-w-0">
                    <p style={{ margin: 0, fontWeight: 600 }}>{p.title}</p>
                    <p style={{ margin: 0, fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
                      /{active.slug}/{p.slug} · {statusText(p.status)}
                    </p>
                  </div>
                  <Icon name="pencil" size={16} color="var(--text-muted)" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
