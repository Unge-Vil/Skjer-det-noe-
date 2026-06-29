"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds/Button";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { SocialLinksEditor } from "./SocialLinksEditor";
import { RichTextEditor } from "./RichTextEditor";
import type { SocialLinks } from "@/components/ds/socials";
import { docToPlainText, plainTextToDoc, isEmptyDoc } from "@/lib/tiptap";
import { inputStyle, labelStyle } from "./formStyles";

export interface ProfileInitial {
  id: string;
  name: string;
  description: string;
  descriptionEn: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  descriptionDoc: any | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  descriptionDocEn: any | null;
  website: string;
  email: string;
  phone: string;
  address: string;
  socialLinks: SocialLinks;
}

const card = {
  background: "var(--surface-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-lg)",
  padding: 20,
} as const;

export function ProfileForm({ org }: { org: ProfileInitial }) {
  const { t } = useI18n();
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(org.name);
  const [descDoc, setDescDoc] = useState(() => org.descriptionDoc ?? plainTextToDoc(org.description));
  const [descDocEn, setDescDocEn] = useState(() => org.descriptionDocEn ?? plainTextToDoc(org.descriptionEn));
  const [website, setWebsite] = useState(org.website);
  const [email, setEmail] = useState(org.email);
  const [phone, setPhone] = useState(org.phone);
  const [address, setAddress] = useState(org.address);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(org.socialLinks);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDone(false);
    setBusy(true);

    const descText = docToPlainText(descDoc);
    const descTextEn = docToPlainText(descDocEn);
    const { error: orgErr } = await supabase
      .from("organizations")
      .update({
        name: name.trim(),
        description: descText || null,
        description_en: descTextEn || null,
        description_doc: isEmptyDoc(descDoc) ? null : descDoc,
        description_doc_en: isEmptyDoc(descDocEn) ? null : descDocEn,
        website: website || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        social_links: socialLinks,
      })
      .eq("id", org.id);

    setBusy(false);
    if (orgErr) {
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
          <label style={labelStyle}>{t.form.description}</label>
          <RichTextEditor value={descDoc} onChange={setDescDoc} ariaLabel={t.form.description} />
        </div>
        <div>
          <label style={labelStyle}>{t.form.descriptionEn} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({t.form.optional})</span></label>
          <RichTextEditor value={descDocEn} onChange={setDescDocEn} ariaLabel={t.form.descriptionEn} />
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

      <section style={{ ...card, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <h2 style={{ margin: "0 0 2px", fontSize: "var(--fs-h4)", fontWeight: 700 }}>{t.orgadmin.social}</h2>
          <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>{t.orgadmin.socialHint}</p>
        </div>
        <SocialLinksEditor value={socialLinks} onChange={setSocialLinks} />
      </section>

      <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>{t.orgadmin.perMunicipalityMoved}</p>

      {error && <p style={{ margin: 0, color: "var(--danger-600)", fontSize: "var(--fs-sm)" }}>{error}</p>}

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Button type="submit" loading={busy}>{busy ? t.orgadmin.saving : t.orgadmin.save}</Button>
        {done && <span style={{ color: "var(--success-600)", fontSize: "var(--fs-sm)", fontWeight: 600 }}>{t.orgadmin.saved}</span>}
      </div>
    </form>
  );
}
