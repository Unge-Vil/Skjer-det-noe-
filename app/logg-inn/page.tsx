"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(t.auth.loginError);
      return;
    }
    router.push("/admin");
    router.refresh();
  };

  return (
    <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <div
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-sm)",
          padding: 28,
        }}
      >
        <h1 style={{ margin: "0 0 4px", fontSize: "var(--fs-h2)", fontWeight: 800 }}>
          {t.auth.loginTitle}
        </h1>
        <p style={{ margin: "0 0 20px", color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
          {t.auth.loginSubtitle}
        </p>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label htmlFor="email" style={labelStyle}>{t.auth.email}</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label htmlFor="password" style={labelStyle}>{t.auth.password}</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          {error && (
            <p style={{ margin: 0, color: "var(--danger-600)", fontSize: "var(--fs-sm)" }}>{error}</p>
          )}

          <Button type="submit" fullWidth loading={loading}>
            {loading ? t.auth.loggingIn : t.auth.login}
          </Button>
        </form>

        <p style={{ margin: "20px 0 0", fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
          {t.auth.noAccount}{" "}
          <Link href="/registrer" style={{ color: "var(--text-link)", fontWeight: 600 }}>
            {t.auth.registerLink}
          </Link>
        </p>
      </div>
    </main>
  );
}
