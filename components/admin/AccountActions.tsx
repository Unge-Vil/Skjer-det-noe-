"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds/Button";
import { useI18n } from "@/components/i18n/LocaleProvider";

const card = {
  background: "var(--surface-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-lg)",
  padding: 20,
} as const;

export function AccountActions({ userId, email }: { userId: string; email: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportData = async () => {
    setBusy(true);
    const [profile, orgs, munis, depts] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("organization_members").select("organization_id, role, organizations(name, slug)").eq("user_id", userId),
      supabase.from("municipality_admins").select("municipality_id, municipalities(name)").eq("user_id", userId),
      supabase.from("org_municipality_members").select("organization_id, municipality_id, role").eq("user_id", userId),
    ]);
    const payload = {
      exported_at: new Date().toISOString(),
      account: { id: userId, email },
      profile: profile.data ?? null,
      organization_memberships: orgs.data ?? [],
      municipality_admin_of: munis.data ?? [],
      department_memberships: depts.data ?? [],
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `skjer-det-noe-data-${userId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBusy(false);
  };

  const deleteAccount = async () => {
    if (!confirm(t.account.deleteConfirm)) return;
    setError(null);
    setBusy(true);
    const { error } = await supabase.rpc("delete_own_account");
    if (error) {
      setBusy(false);
      setError(t.account.deleteError);
      return;
    }
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <section style={{ ...card }}>
        <div style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {t.account.email}
        </div>
        <div style={{ marginTop: 4, fontWeight: 600 }}>{email}</div>
      </section>

      <section style={{ ...card, display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <h2 style={{ margin: "0 0 2px", fontSize: "var(--fs-h4)", fontWeight: 700 }}>{t.account.exportTitle}</h2>
          <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>{t.account.exportBody}</p>
        </div>
        <div>
          <Button variant="secondary" leadingIcon="external-link" loading={busy} onClick={exportData}>
            {t.account.exportBtn}
          </Button>
        </div>
      </section>

      <section style={{ ...card, display: "flex", flexDirection: "column", gap: 12, borderColor: "var(--danger-500)" }}>
        <div>
          <h2 style={{ margin: "0 0 2px", fontSize: "var(--fs-h4)", fontWeight: 700, color: "var(--danger-600)" }}>{t.account.deleteTitle}</h2>
          <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>{t.account.deleteBody}</p>
        </div>
        {error && <p style={{ margin: 0, color: "var(--danger-600)", fontSize: "var(--fs-sm)" }}>{error}</p>}
        <div>
          <Button variant="danger" loading={busy} onClick={deleteAccount}>{t.account.deleteBtn}</Button>
        </div>
      </section>
    </div>
  );
}
