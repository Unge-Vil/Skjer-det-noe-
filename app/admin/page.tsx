import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getMyOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { Button } from "@/components/ds/Button";
import { Icon } from "@/components/ds/Icon";
import { LogoutButton } from "@/components/LogoutButton";
import { DeleteButton } from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

type Row = { id: string; title: string; status: string };

export default async function AdminPage() {
  const user = await getUser();
  if (!user) redirect("/logg-inn");

  const locale = await getLocale();
  const t = getDictionary(locale);
  const org = await getMyOrg();

  if (!org) {
    return (
      <main id="main" className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 style={{ margin: 0, fontSize: "var(--fs-h1)", fontWeight: 800 }}>{t.admin.title}</h1>
          <LogoutButton />
        </div>
        <div style={cardStyle}>
          <p style={{ margin: "0 0 16px", color: "var(--text-body)" }}>{t.admin.noOrg}</p>
          <Link href="/registrer"><Button leadingIcon="sparkles">{t.admin.registerOrg}</Button></Link>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const [actRes, evtRes] = await Promise.all([
    supabase.from("activities").select("id,title,status").eq("organization_id", org.id).order("created_at", { ascending: false }),
    supabase.from("events").select("id,title,status").eq("organization_id", org.id).order("starts_at", { ascending: true }),
  ]);
  const activities = (actRes.data as Row[]) ?? [];
  const events = (evtRes.data as Row[]) ?? [];

  const statusText = (s: string) =>
    s === "published" ? t.admin.statusPublished : s === "archived" ? t.admin.statusArchived : t.admin.statusDraft;

  return (
    <main id="main" className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 style={{ margin: 0, fontSize: "var(--fs-h1)", fontWeight: 800 }}>{org.name}</h1>
          <p style={{ margin: "2px 0 0", color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
            {t.admin.status}: <strong>{statusText(org.status)}</strong>
          </p>
        </div>
        <LogoutButton />
      </div>

      {org.status === "draft" && (
        <div style={{ ...cardStyle, display: "flex", gap: 12, marginBottom: 24, background: "var(--surface-brand-soft)", border: "none" }}>
          <Icon name="info" size={20} color="var(--text-brand)" />
          <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-body)" }}>{t.admin.pendingBody}</p>
        </div>
      )}

      <Section
        title={t.admin.activities}
        newHref="/admin/aktivitet/ny"
        newLabel={t.admin.newActivity}
        empty={t.admin.noActivities}
        rows={activities}
        editBase="/admin/aktivitet"
        editLabel={t.admin.edit}
        table="activities"
        statusText={statusText}
      />

      <div className="h-8" />

      <Section
        title={t.admin.events}
        newHref="/admin/arrangement/ny"
        newLabel={t.admin.newEvent}
        empty={t.admin.noEvents}
        rows={events}
        editBase="/admin/arrangement"
        editLabel={t.admin.edit}
        table="events"
        statusText={statusText}
      />
    </main>
  );
}

const cardStyle = {
  background: "var(--surface-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-lg)",
  padding: 20,
} as const;

function Section({
  title,
  newHref,
  newLabel,
  empty,
  rows,
  editBase,
  editLabel,
  table,
  statusText,
}: {
  title: string;
  newHref: string;
  newLabel: string;
  empty: string;
  rows: Row[];
  editBase: string;
  editLabel: string;
  table: "activities" | "events";
  statusText: (s: string) => string;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 style={{ margin: 0, fontSize: "var(--fs-h3)", fontWeight: 700 }}>{title}</h2>
        <Link href={newHref}><Button size="sm" leadingIcon="sparkles">{newLabel}</Button></Link>
      </div>
      {rows.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{empty}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3"
              style={{ ...cardStyle, padding: "12px 16px" }}
            >
              <div className="min-w-0">
                <p style={{ margin: 0, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</p>
                <p style={{ margin: 0, fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{statusText(r.status)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Link href={`${editBase}/${r.id}`}><Button variant="ghost" size="sm">{editLabel}</Button></Link>
                <DeleteButton table={table} id={r.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
