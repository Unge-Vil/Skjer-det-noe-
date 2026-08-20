"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds/Button";
import { useI18n } from "@/components/i18n/LocaleProvider";

type Factor = { id: string; factor_type: string; status: string };
type TotpEnrollment = { id: string; totp?: { qr_code?: string; secret?: string } };

export function MfaSettings() {
  const { t } = useI18n();
  const [factor, setFactor] = useState<Factor | null>(null);
  const [passkey, setPasskey] = useState<Factor | null>(null);
  const [enrollment, setEnrollment] = useState<TotpEnrollment | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFactor = async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.mfa.listFactors();
    setFactor(data?.totp.find((item) => item.status === "verified") ?? null);
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    void createClient().auth.mfa.listFactors().then(({ data }) => {
      if (!active) return;
      setFactor(data?.totp.find((item) => item.status === "verified") ?? null);
      setPasskey(data?.webauthn.find((item) => item.status === "verified") ?? null);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const enroll = async () => {
    setError(null);
    setBusy(true);
    const { data, error: enrollError } = await createClient().auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Skjer det noe?",
    });
    setBusy(false);
    if (enrollError || !data) {
      setError(t.account.mfaSetupError);
      return;
    }
    setEnrollment(data as TotpEnrollment);
  };

  const enrollPasskey = async () => {
    setError(null);
    if (!window.PublicKeyCredential) {
      setError(t.account.passkeyUnsupported);
      return;
    }
    setBusy(true);
    const client = createClient();
    const { data: enrolled, error: enrollError } = await client.auth.mfa.enroll({
      factorType: "webauthn",
      friendlyName: "Skjer det noe? passkey",
    });
    if (enrollError || !enrolled) {
      setBusy(false);
      setError(t.account.passkeySetupError);
      return;
    }
    const rpId = window.location.hostname;
    const { data: challenge, error: challengeError } = await client.auth.mfa.challenge({
      factorId: enrolled.id,
      webauthn: { rpId, rpOrigins: [window.location.origin] },
    });
    if (challengeError || challenge.type !== "webauthn") {
      setBusy(false);
      setError(t.account.passkeySetupError);
      return;
    }
    try {
      const credential = await navigator.credentials.create({
        publicKey: challenge.webauthn.credential_options.publicKey as PublicKeyCredentialCreationOptions,
      }) as PublicKeyCredential | null;
      if (!credential || !(credential.response instanceof AuthenticatorAttestationResponse)) {
        setError(t.account.passkeySetupError);
        return;
      }
      const credentialResponse = credential as unknown as {
        id: string;
        rawId: ArrayBuffer;
        type: "public-key";
        response: AuthenticatorAttestationResponse;
      };
      const { error: verifyError } = await client.auth.mfa.verify({
        factorId: enrolled.id,
        challengeId: challenge.id,
        webauthn: {
          rpId,
          rpOrigins: [window.location.origin],
          type: "create",
          credential_response: credentialResponse as never,
        },
      });
      if (verifyError) {
        setError(t.account.passkeySetupError);
        return;
      }
      await loadFactor();
    } catch {
      setError(t.account.passkeySetupError);
    } finally {
      setBusy(false);
    }
  };

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!enrollment) return;
    setError(null);
    setBusy(true);
    const client = createClient();
    const { data: challenge, error: challengeError } = await client.auth.mfa.challenge({ factorId: enrollment.id });
    const { error: verifyError } = challengeError
      ? { error: challengeError }
      : await client.auth.mfa.verify({ factorId: enrollment.id, challengeId: challenge.id, code });
    setBusy(false);
    if (verifyError) {
      setError(t.account.mfaVerifyError);
      return;
    }
    setEnrollment(null);
    setCode("");
    await loadFactor();
  };

  const remove = async () => {
    if (!factor || !window.confirm(t.account.mfaRemoveConfirm)) return;
    setError(null);
    setBusy(true);
    const { error: removeError } = await createClient().auth.mfa.unenroll({ factorId: factor.id });
    setBusy(false);
    if (removeError) {
      setError(t.account.mfaRemoveError);
      return;
    }
    setFactor(null);
  };

  return (
    <section style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <h2 style={{ margin: "0 0 2px", fontSize: "var(--fs-h4)", fontWeight: 700 }}>{t.account.mfaTitle}</h2>
        <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>{t.account.mfaBody}</p>
      </div>
      {error && <p role="alert" style={{ margin: 0, color: "var(--danger-text)", fontSize: "var(--fs-sm)" }}>{error}</p>}
      {loading ? null : enrollment ? (
        <form onSubmit={verify} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {enrollment.totp?.qr_code && <img src={enrollment.totp.qr_code} alt={t.account.mfaQrAlt} width={180} height={180} style={{ alignSelf: "flex-start", imageRendering: "pixelated" }} />}
          <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>{t.account.mfaScanHint}</p>
          {enrollment.totp?.secret && <code style={{ wordBreak: "break-all", fontSize: "var(--fs-sm)" }}>{enrollment.totp.secret}</code>}
          <label htmlFor="mfa-code" style={{ fontSize: "var(--fs-sm)", fontWeight: 600 }}>{t.account.mfaCode}</label>
          <input id="mfa-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,8}" required value={code} onChange={(event) => setCode(event.target.value)} style={{ width: "min(220px, 100%)", minHeight: "var(--tap-comfy)", padding: "0 14px", background: "var(--surface-card)", border: "1.5px solid var(--border-strong)", borderRadius: "var(--radius-md)", fontSize: "var(--fs-body)" }} />
          <Button type="submit" loading={busy}>{t.account.mfaVerify}</Button>
        </form>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: "var(--fs-sm)", fontWeight: 600 }}>{factor ? t.account.mfaEnabled : t.account.mfaNotEnabled}</span>
            {factor ? <Button variant="secondary" loading={busy} onClick={remove}>{t.account.mfaRemove}</Button> : <Button variant="secondary" loading={busy} onClick={enroll}>{t.account.mfaSetup}</Button>}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "var(--fs-sm)", fontWeight: 600 }}>
              {passkey ? t.account.passkeyEnabled : t.account.passkeyNotEnabled}
              <span style={{ padding: "3px 6px", borderRadius: "var(--radius-sm)", background: "var(--amber-100)", color: "var(--amber-800)", fontSize: "var(--fs-xs)", fontWeight: 800, letterSpacing: "0.04em" }}>{t.account.betaLabel}</span>
            </span>
            {!passkey && <Button variant="secondary" loading={busy} onClick={enrollPasskey}>{t.account.passkeySetup}</Button>}
          </div>
        </>
      )}
    </section>
  );
}