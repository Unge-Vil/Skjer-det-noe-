"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds/Button";
import { useI18n } from "@/components/i18n/LocaleProvider";

const inputStyle: CSSProperties = { width: "100%", minHeight: "var(--tap-comfy)", padding: "0 14px", background: "var(--surface-card)", border: "1.5px solid var(--border-strong)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: "var(--fs-body)", color: "var(--text-strong)" };
const labelStyle: CSSProperties = { display: "block", marginBottom: 6, fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text-body)" };

export default function UpdatePasswordPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password !== confirmation) {
      setError(t.auth.passwordMismatch);
      return;
    }
    setLoading(true);
    const { error: updateError } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(t.auth.updatePasswordError);
      return;
    }
    router.push("/admin");
    router.refresh();
  };

  return (
    <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", padding: 28 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: "var(--fs-h2)", fontWeight: 800 }}>{t.auth.updatePasswordTitle}</h1>
        <p style={{ margin: "0 0 20px", color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.auth.updatePasswordSubtitle}</p>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div><label htmlFor="password" style={labelStyle}>{t.auth.newPassword}</label><input id="password" type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} style={inputStyle} /></div>
          <div><label htmlFor="confirmation" style={labelStyle}>{t.auth.confirmPassword}</label><input id="confirmation" type="password" autoComplete="new-password" minLength={6} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} style={inputStyle} /></div>
          {error && <p role="alert" style={{ margin: 0, color: "var(--danger-text)", fontSize: "var(--fs-sm)" }}>{error}</p>}
          <Button type="submit" fullWidth loading={loading}>{loading ? t.auth.updatingPassword : t.auth.updatePassword}</Button>
        </form>
      </div>
    </main>
  );
}