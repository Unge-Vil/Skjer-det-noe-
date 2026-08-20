"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds/Button";
import { useI18n } from "@/components/i18n/LocaleProvider";

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "var(--tap-comfy)",
  padding: "0 14px",
  background: "var(--surface-card)",
  border: "1.5px solid var(--border-strong)",
  borderRadius: "var(--radius-md)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--fs-body)",
  color: "var(--text-strong)",
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: 6,
  fontSize: "var(--fs-sm)",
  fontWeight: 600,
  color: "var(--text-body)",
};

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const redirectTo = `${window.location.origin}/auth/callback?type=recovery`;
    const { error: resetError } = await createClient().auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);
    if (resetError) {
      setError(t.auth.forgotPasswordError);
      return;
    }
    setSent(true);
  };

  return (
    <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", padding: 28 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: "var(--fs-h2)", fontWeight: 800 }}>{t.auth.forgotPasswordTitle}</h1>
        <p style={{ margin: "0 0 20px", color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.auth.forgotPasswordSubtitle}</p>
        {sent ? (
          <p role="status" style={{ margin: 0, color: "var(--text-body)", fontSize: "var(--fs-sm)" }}>{t.auth.forgotPasswordSent}</p>
        ) : (
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label htmlFor="email" style={labelStyle}>{t.auth.email}</label>
              <input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} style={inputStyle} />
            </div>
            {error && <p role="alert" style={{ margin: 0, color: "var(--danger-text)", fontSize: "var(--fs-sm)" }}>{error}</p>}
            <Button type="submit" fullWidth loading={loading}>{loading ? t.auth.sending : t.auth.sendResetLink}</Button>
          </form>
        )}
        <p style={{ margin: "20px 0 0", fontSize: "var(--fs-sm)" }}>
          <Link href="/logg-inn" style={{ color: "var(--text-link)", fontWeight: 600 }}>{t.auth.backToLogin}</Link>
        </p>
      </div>
    </main>
  );
}