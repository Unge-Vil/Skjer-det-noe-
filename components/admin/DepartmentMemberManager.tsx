"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds/Button";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { inputStyle } from "./formStyles";

interface Member {
  user_id: string;
  email: string;
  role: string;
}

export function DepartmentMemberManager({
  profileId,
  members,
  currentUserId,
}: {
  profileId: string;
  members: Member[];
  currentUserId: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabase.rpc("add_profile_member", {
      p_profile: profileId,
      p_email: email,
    });
    setBusy(false);
    if (error) {
      setError(t.orgadmin.addMemberError);
      return;
    }
    setEmail("");
    router.refresh();
  };

  const remove = async (userId: string) => {
    await supabase.rpc("remove_profile_member", { p_profile: profileId, p_user: userId });
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={add} className="flex flex-wrap items-end gap-2">
        <input
          type="email"
          required
          placeholder={t.auth.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ ...inputStyle, width: "auto", flex: 1, minWidth: 220 }}
        />
        <Button type="submit" loading={busy}>{t.orgadmin.addMember}</Button>
      </form>
      {error && <p style={{ margin: 0, color: "var(--danger-600)", fontSize: "var(--fs-sm)" }}>{error}</p>}

      {members.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.orgadmin.noMembers}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {members.map((m) => (
            <div
              key={m.user_id}
              className="flex items-center justify-between gap-3"
              style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "10px 14px" }}
            >
              <span style={{ fontSize: "var(--fs-sm)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {m.email}
                {m.user_id === currentUserId && <span style={{ color: "var(--text-muted)" }}> ({t.orgadmin.you})</span>}
                <span style={{ marginLeft: 8, color: "var(--text-muted)" }}>
                  · {m.role === "owner" ? t.orgadmin.roleOwner : t.orgadmin.roleEditor}
                </span>
              </span>
              <Button variant="ghost" size="sm" onClick={() => remove(m.user_id)}>
                {t.orgadmin.removeMember}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
