import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { Button } from "@/components/ds/Button";
import { Icon } from "@/components/ds/Icon";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

type OrgRow = { id: string; name: string; status: string };

export default async function AdminPage() {
  const user = await getUser();
  if (!user) redirect("/logg-inn");

  const locale = await getLocale();
  const t = getDictionary(locale);
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organizations(id, name, status)")
    .eq("user_id", user.id);

  const org = (memberships?.[0]?.organizations ?? null) as OrgRow | null;

  const statusLabel =
    org?.status === "published"
      ? t.admin.statusPublished
      : org?.status === "archived"
        ? t.admin.statusArchived
        : t.admin.statusDraft;

  return (
    <main id="main" className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 style={{ margin: 0, fontSize: "var(--fs-h1)", fontWeight: 800 }}>{t.admin.title}</h1>
        <LogoutButton />
      </div>

      {!org ? (
        <div
          style={{
            background: "var(--surface-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: 28,
          }}
        >
          <p style={{ margin: "0 0 16px", color: "var(--text-body)" }}>{t.admin.noOrg}</p>
          <Link href="/registrer">
            <Button leadingIcon="sparkles">{t.admin.registerOrg}</Button>
          </Link>
        </div>
      ) : (
        <div
          style={{
            background: "var(--surface-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: 28,
          }}
        >
          <h2 style={{ margin: "0 0 6px", fontSize: "var(--fs-h3)", fontWeight: 700 }}>{org.name}</h2>
          <p style={{ margin: "0 0 16px", color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
            {t.admin.status}: <strong>{statusLabel}</strong>
          </p>
          {org.status === "draft" && (
            <div
              style={{
                display: "flex",
                gap: 12,
                padding: 16,
                background: "var(--surface-brand-soft)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <Icon name="info" size={20} color="var(--text-brand)" />
              <div>
                <p style={{ margin: "0 0 2px", fontWeight: 700, color: "var(--text-brand)" }}>
                  {t.admin.pendingTitle}
                </p>
                <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-body)" }}>
                  {t.admin.pendingBody}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
