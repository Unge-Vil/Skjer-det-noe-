"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
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
    const next = searchParams.get("next");
    router.push(next?.startsWith("/oauth/authorize?") ? next : "/admin");
    router.refresh();
  };

  const sendMagicLink = async () => {
    setError(null);
    setMagicLinkLoading(true);
    const next = searchParams.get("next");
    const callback = new URL("/auth/callback", window.location.origin);
    if (next?.startsWith("/")) callback.searchParams.set("next", next);
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callback.toString(), shouldCreateUser: false },
    });
    setMagicLinkLoading(false);
    if (error) {
      setError(t.auth.magicLinkError);
      return;
    }
    setMagicLinkSent(true);
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
            <p role="alert" style={{ margin: 0, color: "var(--danger-text)", fontSize: "var(--fs-sm)" }}>{error}</p>
          )}

          <Button type="submit" fullWidth loading={loading}>
            {loading ? t.auth.loggingIn : t.auth.login}
          </Button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
          <span style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
          <span style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.auth.or}</span>
          <span style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
        </div>

        {magicLinkSent ? (
          <p role="status" style={{ margin: 0, color: "var(--text-body)", fontSize: "var(--fs-sm)" }}>
            {t.auth.magicLinkSent}
          </p>
        ) : (
          <Button type="button" variant="secondary" fullWidth loading={magicLinkLoading} onClick={sendMagicLink}>
            {magicLinkLoading ? t.auth.sending : t.auth.sendMagicLink}
          </Button>
        )}

        <p style={{ margin: "16px 0 0", fontSize: "var(--fs-sm)" }}>
          <Link href="/glemt-passord" style={{ color: "var(--text-link)", fontWeight: 600 }}>
            {t.auth.forgotPassword}
          </Link>
        </p>

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
