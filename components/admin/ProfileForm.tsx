"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds/Button";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { inputStyle, labelStyle, textareaStyle } from "./formStyles";

interface Muni {
  id: string;
  name: string;
}
interface Override {
  description: string;
  description_en: string;
}

export interface ProfileInitial {
  id: string;
  name: string;
  description: string;
  descriptionEn: string;
  website: string;
  email: string;
  phone: string;
  address: string;
}

const card = {
  background: "var(--surface-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-lg)",
  padding: 20,
} as const;

export function ProfileForm({
  org,
  municipalities,
  initialOverrides,
}: {
  org: ProfileInitial;
  municipalities: Muni[];
  initialOverrides: Record<string, Override>;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(org.name);
  const [description, setDescription] = useState(org.description);
  const [descriptionEn, setDescriptionEn] = useState(org.descriptionEn);
  const [website, setWebsite] = useState(org.website);
  const [email, setEmail] = useState(org.email);
  const [phone, setPhone] = useState(org.phone);
  const [address, setAddress] = useState(org.address);
  const [overrides, setOverrides] = useState<Record<string, Override>>(() => {
    const o: Record<string, Override> = {};
    for (const m of municipalities) {
      o[m.id] = initialOverrides[m.id] ?? { description: "", description_en: "" };
    }
    return o;
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const setOverride = (id: string, patch: Partial<Override>) =>
    setOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDone(false);
    setBusy(true);

    const { error: orgErr } = await supabase
      .from("organizations")
      .update({
        name: name.trim(),
        description: description || null,
        description_en: descriptionEn || null,
        website: website || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
      })
      .eq("id", org.id);

    let muniErr = null;
    if (!orgErr && municipalities.length) {
      const rows = municipalities.map((m) => ({
        organization_id: org.id,
        municipality_id: m.id,
        description: overrides[m.id]?.description?.trim() || null,
        description_en: overrides[m.id]?.description_en?.trim() || null,
      }));
      const res = await supabase
        .from("organization_municipalities")
        .upsert(rows, { onConflict: "organization_id,municipality_id" });
      muniErr = res.error;
    }

    setBusy(false);
    if (orgErr || muniErr) {
      setError(t.orgadmin.saveError);
      return;
    }
    setDone(true);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-3xl" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      <section style={{ ...card, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <h2 style={{ margin: "0 0 2px", fontSize: "var(--fs-h4)", fontWeight: 700 }}>{t.orgadmin.globalProfile}</h2>
          <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>{t.orgadmin.globalHint}</p>
        </div>
        <div>
          <label htmlFor="name" style={labelStyle}>{t.orgadmin.name}</label>
          <input id="name" required value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label htmlFor="desc" style={labelStyle}>{t.form.description}</label>
          <textarea id="desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} style={textareaStyle} />
        </div>
        <div>
          <label htmlFor="desc_en" style={labelStyle}>{t.form.descriptionEn} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({t.form.optional})</span></label>
          <textarea id="desc_en" rows={3} value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} style={textareaStyle} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="web" style={labelStyle}>{t.orgadmin.fWebsite}</label>
            <input id="web" value={website} onChange={(e) => setWebsite(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label htmlFor="email" style={labelStyle}>{t.auth.email}</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label htmlFor="phone" style={labelStyle}>{t.orgadmin.phone}</label>
            <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label htmlFor="addr" style={labelStyle}>{t.orgadmin.fAddress}</label>
            <input id="addr" value={address} onChange={(e) => setAddress(e.target.value)} style={inputStyle} />
          </div>
        </div>
      </section>

      {municipalities.length > 0 && (
        <section style={{ ...card, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <h2 style={{ margin: "0 0 2px", fontSize: "var(--fs-h4)", fontWeight: 700 }}>{t.orgadmin.perMunicipality}</h2>
            <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>{t.orgadmin.perMunicipalityHint}</p>
          </div>
          {municipalities.map((m) => (
            <div key={m.id} style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
              <div style={{ fontWeight: 700, fontSize: "var(--fs-sm)" }}>{m.name}</div>
              <textarea
                rows={2}
                placeholder={t.form.description}
                value={overrides[m.id]?.description ?? ""}
                onChange={(e) => setOverride(m.id, { description: e.target.value })}
                style={textareaStyle}
              />
              <textarea
                rows={2}
                placeholder={`${t.form.descriptionEn} (${t.form.optional})`}
                value={overrides[m.id]?.description_en ?? ""}
                onChange={(e) => setOverride(m.id, { description_en: e.target.value })}
                style={textareaStyle}
              />
            </div>
          ))}
        </section>
      )}

      {error && <p style={{ margin: 0, color: "var(--danger-600)", fontSize: "var(--fs-sm)" }}>{error}</p>}

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Button type="submit" loading={busy}>{busy ? t.orgadmin.saving : t.orgadmin.save}</Button>
        {done && <span style={{ color: "var(--success-600)", fontSize: "var(--fs-sm)", fontWeight: 600 }}>{t.orgadmin.saved}</span>}
      </div>
    </form>
  );
}
