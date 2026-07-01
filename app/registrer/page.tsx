"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { BrregOrg } from "@/lib/brreg";
import { Button } from "@/components/ds/Button";
import { Icon } from "@/components/ds/Icon";
import { useI18n } from "@/components/i18n/LocaleProvider";

interface MuniOption {
  id: string;
  kommunenummer: string;
  name: string;
}

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

type Step = "account" | "volunteer" | "details" | "municipalities" | "done" | "confirm";

export default function RegisterPage() {
  const { t } = useI18n();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("account");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // account
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // org
  const [isVolunteer, setIsVolunteer] = useState(false);
  const [orgNumber, setOrgNumber] = useState("");
  const [orgName, setOrgName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [lookupMsg, setLookupMsg] = useState<string | null>(null);

  // municipalities
  const [municipalities, setMunicipalities] = useState<MuniOption[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase
      .from("municipalities_view")
      .select("id,kommunenummer,name")
      .order("name")
      .then(({ data }) => {
        if (data) setMunicipalities(data as MuniOption[]);
      });
  }, [supabase]);

  // Already logged in (e.g. confirmed email and signed back in)? Skip the
  // account step and go straight to the organisation wizard.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setStep((s) => (s === "account" ? "volunteer" : s));
    });
  }, [supabase]);

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      setStep("volunteer");
    } else {
      setStep("confirm"); // email confirmation required
    }
  };

  const runLookup = async () => {
    setLookupMsg(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/brreg/${orgNumber.replace(/\D/g, "")}`);
      if (res.status === 404) {
        setLookupMsg(t.register.lookupNotFound);
        return;
      }
      if (!res.ok) {
        setLookupMsg(t.register.lookupError);
        return;
      }
      const org = (await res.json()) as BrregOrg;
      setOrgName(org.name);
      if (org.website) setWebsite(org.website);
      if (org.email) setOrgEmail(org.email);
      if (org.phone) setPhone(org.phone);
      setIsVolunteer(org.isVolunteer || isVolunteer);
      // Auto-select the registered municipality if we cover it.
      const m = municipalities.find((x) => x.kommunenummer === org.municipalityNumber);
      if (m) setSelected((prev) => new Set(prev).add(m.id));
      setLookupMsg(org.isVolunteer ? t.register.foundVolunteer : org.name);
    } catch {
      setLookupMsg(t.register.lookupError);
    } finally {
      setBusy(false);
    }
  };

  const toggleMuni = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = async () => {
    setError(null);
    setBusy(true);
    const { error } = await supabase.rpc("create_organization", {
      p_name: orgName,
      p_municipality_ids: [...selected],
      p_is_volunteer: isVolunteer,
      p_org_number: orgNumber ? orgNumber.replace(/\D/g, "") : null,
      p_description: description || null,
      p_website: website || null,
      p_email: orgEmail || null,
      p_phone: phone || null,
    });
    setBusy(false);
    if (error) {
      setError(t.register.error);
      return;
    }
    setStep("done");
  };

  const card: CSSProperties = {
    background: "var(--surface-card)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-sm)",
    padding: 28,
  };

  return (
    <main id="main" className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-12">
      <div style={card}>
        <h1 style={{ margin: "0 0 20px", fontSize: "var(--fs-h2)", fontWeight: 800 }}>
          {t.register.title}
        </h1>

        {step === "account" && (
          <form onSubmit={createAccount} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 style={{ margin: 0, fontSize: "var(--fs-h4)", fontWeight: 700 }}>{t.register.accountTitle}</h2>
            <div>
              <label htmlFor="name" style={labelStyle}>{t.register.name}</label>
              <input id="name" required value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label htmlFor="email" style={labelStyle}>{t.auth.email}</label>
              <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label htmlFor="password" style={labelStyle}>{t.auth.password}</label>
              <input id="password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
            </div>
            {error && <p style={{ margin: 0, color: "var(--danger-text)", fontSize: "var(--fs-sm)" }}>{error}</p>}
            <Button type="submit" fullWidth loading={busy}>{t.register.createAccount}</Button>
            <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
              {t.auth.haveAccount}{" "}
              <Link href="/logg-inn" style={{ color: "var(--text-link)", fontWeight: 600 }}>{t.auth.login}</Link>
            </p>
          </form>
        )}

        {step === "confirm" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Icon name="info" size={28} color="var(--text-brand)" />
            <p style={{ margin: 0, fontSize: "var(--fs-body)", lineHeight: 1.5 }}>{t.register.confirmEmail}</p>
            <Link href="/logg-inn"><Button>{t.auth.login}</Button></Link>
          </div>
        )}

        {step === "volunteer" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h2 style={{ margin: 0, fontSize: "var(--fs-h4)", fontWeight: 700 }}>{t.register.volunteerTitle}</h2>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.register.volunteerHint}</p>
            <Button fullWidth onClick={() => { setIsVolunteer(true); setStep("details"); }}>{t.register.volunteerYes}</Button>
            <Button fullWidth variant="secondary" onClick={() => { setIsVolunteer(false); setStep("details"); }}>{t.register.volunteerNo}</Button>
          </div>
        )}

        {step === "details" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {isVolunteer && (
              <div>
                <label htmlFor="orgnr" style={labelStyle}>{t.register.orgNumber}</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input id="orgnr" inputMode="numeric" value={orgNumber} onChange={(e) => setOrgNumber(e.target.value)} style={inputStyle} placeholder="9 siffer" />
                  <Button variant="secondary" onClick={runLookup} loading={busy}>{t.register.lookup}</Button>
                </div>
                {lookupMsg && <p style={{ margin: "8px 0 0", fontSize: "var(--fs-sm)", color: "var(--text-brand)" }}>{lookupMsg}</p>}
              </div>
            )}
            <div>
              <label htmlFor="orgname" style={labelStyle}>{t.register.orgName}</label>
              <input id="orgname" required value={orgName} onChange={(e) => setOrgName(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label htmlFor="desc" style={labelStyle}>{t.register.description}</label>
              <textarea id="desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: 80, padding: 14 }} />
            </div>
            <div>
              <label htmlFor="web" style={labelStyle}>{t.register.website}</label>
              <input id="web" value={website} onChange={(e) => setWebsite(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <Button variant="ghost" onClick={() => setStep("volunteer")}>{t.register.back}</Button>
              <Button onClick={() => setStep("municipalities")} disabled={!orgName.trim()}>{t.register.next}</Button>
            </div>
          </div>
        )}

        {step === "municipalities" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h2 style={{ margin: 0, fontSize: "var(--fs-h4)", fontWeight: 700 }}>{t.register.municipalitiesTitle}</h2>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.register.municipalitiesHint}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto" }}>
              {municipalities.map((m) => (
                <label key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", cursor: "pointer", background: selected.has(m.id) ? "var(--surface-brand-soft)" : "var(--surface-card)" }}>
                  <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggleMuni(m.id)} />
                  {m.name}
                </label>
              ))}
            </div>
            {error && <p style={{ margin: 0, color: "var(--danger-text)", fontSize: "var(--fs-sm)" }}>{error}</p>}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <Button variant="ghost" onClick={() => setStep("details")}>{t.register.back}</Button>
              <Button onClick={submit} loading={busy} disabled={selected.size === 0}>{t.register.submit}</Button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Icon name="sparkles" size={28} color="var(--success-text)" />
            <h2 style={{ margin: 0, fontSize: "var(--fs-h3)", fontWeight: 700 }}>{t.register.successTitle}</h2>
            <p style={{ margin: 0, fontSize: "var(--fs-body)", lineHeight: 1.5 }}>{t.register.successBody}</p>
            <Link href="/admin"><Button>{t.register.toDashboard}</Button></Link>
          </div>
        )}
      </div>
    </main>
  );
}
