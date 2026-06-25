"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds/Button";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { inputStyle } from "./formStyles";

interface Muni {
  id: string;
  name: string;
}
interface AdminRow {
  municipality_id: string;
  municipality_name: string;
  user_id: string;
  email: string;
}

export function MuniAdminManager({
  municipalities,
  admins,
}: {
  municipalities: Muni[];
  admins: AdminRow[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const supabase = createClient();

  const [municipalityId, setMunicipalityId] = useState(municipalities[0]?.id ?? "");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabase.rpc("add_municipality_admin", {
      p_municipality_id: municipalityId,
      p_email: email,
    });
    setBusy(false);
    if (error) {
      setError(t.platform.addError);
      return;
    }
    setEmail("");
    router.refresh();
  };

  const remove = async (municipality_id: string, user_id: string) => {
    await supabase.rpc("remove_municipality_admin", {
      p_municipality_id: municipality_id,
      p_user_id: user_id,
    });
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={add} className="flex flex-wrap items-end gap-2">
        <select
          value={municipalityId}
          onChange={(e) => setMunicipalityId(e.target.value)}
          style={{ ...inputStyle, width: "auto", minWidth: 160 }}
          aria-label={t.form.municipality}
        >
          {municipalities.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <input
          type="email"
          required
          placeholder={t.auth.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ ...inputStyle, width: "auto", flex: 1, minWidth: 200 }}
        />
        <Button type="submit" loading={busy}>{t.platform.add}</Button>
      </form>
      {error && <p style={{ margin: 0, color: "var(--danger-600)", fontSize: "var(--fs-sm)" }}>{error}</p>}

      {admins.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.platform.noAdmins}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {admins.map((a) => (
            <div
              key={`${a.municipality_id}-${a.user_id}`}
              className="flex items-center justify-between gap-3"
              style={{
                background: "var(--surface-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "10px 14px",
              }}
            >
              <span style={{ fontSize: "var(--fs-sm)" }}>
                <strong>{a.municipality_name}</strong> — {a.email}
              </span>
              <Button variant="ghost" size="sm" onClick={() => remove(a.municipality_id, a.user_id)}>
                {t.platform.remove}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
