"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds/Button";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { SocialLinksEditor } from "./SocialLinksEditor";
import { RichTextEditor } from "./RichTextEditor";
import { LanguageFields } from "./LanguageFields";
import { docToPlainText, plainTextToDoc, isEmptyDoc } from "@/lib/tiptap";
import type { SocialLinks } from "@/components/ds/socials";
import { inputStyle, labelStyle } from "./formStyles";

export interface MuniProfileInitial {
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

export function MuniProfileForm({
  municipalityId,
  initial,
}: {
  municipalityId: string;
  initial: MuniProfileInitial;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const supabase = createClient();

  const [descDoc, setDescDoc] = useState(() => initial.descriptionDoc ?? plainTextToDoc(initial.description));
  const [descDocEn, setDescDocEn] = useState(() => initial.descriptionDocEn ?? plainTextToDoc(initial.descriptionEn));
  const [website, setWebsite] = useState(initial.website);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);
  const [address, setAddress] = useState(initial.address);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(initial.socialLinks);

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
    const { error } = await supabase
      .from("municipalities")
      .update({
        description: descText || null,
        description_en: descTextEn || null,
        description_doc: isEmptyDoc(descDoc) ? null : descDoc,
        description_doc_en: isEmptyDoc(descDocEn) ? null : descDocEn,
        website: website.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        social_links: socialLinks,
      })
      .eq("id", municipalityId);
    setBusy(false);
    if (error) {
      setError(t.kommune.saveError);
      return;
    }
    setDone(true);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-3xl" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      <section style={{ ...card, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <h2 style={{ margin: "0 0 2px", fontSize: "var(--fs-h4)", fontWeight: 700 }}>{t.kommune.aboutTitle}</h2>
          <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>{t.kommune.aboutHint}</p>
        </div>
        <div>
          <label style={labelStyle}>{t.form.description}</label>
          <RichTextEditor value={descDoc} onChange={setDescDoc} ariaLabel={t.form.description} />
        </div>
        <LanguageFields
          hasContent={!isEmptyDoc(descDocEn)}
          onRemove={() => setDescDocEn(plainTextToDoc(""))}
        >
          <div>
            <label style={labelStyle}>{t.form.descriptionEn}</label>
            <RichTextEditor value={descDocEn} onChange={setDescDocEn} ariaLabel={t.form.descriptionEn} />
          </div>
        </LanguageFields>
      </section>

      <section style={{ ...card, display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ margin: 0, fontSize: "var(--fs-h4)", fontWeight: 700 }}>{t.kommune.contactTitle}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="m-web" style={labelStyle}>{t.orgadmin.fWebsite}</label>
            <input id="m-web" value={website} onChange={(e) => setWebsite(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label htmlFor="m-email" style={labelStyle}>{t.auth.email}</label>
            <input id="m-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label htmlFor="m-phone" style={labelStyle}>{t.orgadmin.phone}</label>
            <input id="m-phone" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label htmlFor="m-addr" style={labelStyle}>{t.orgadmin.fAddress}</label>
            <input id="m-addr" value={address} onChange={(e) => setAddress(e.target.value)} style={inputStyle} />
          </div>
        </div>
      </section>

      <section style={{ ...card, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <h2 style={{ margin: "0 0 2px", fontSize: "var(--fs-h4)", fontWeight: 700 }}>{t.orgadmin.social}</h2>
          <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>{t.kommune.profileHint}</p>
        </div>
        <SocialLinksEditor value={socialLinks} onChange={setSocialLinks} />
      </section>

      {error && <p style={{ margin: 0, color: "var(--danger-text)", fontSize: "var(--fs-sm)" }}>{error}</p>}

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Button type="submit" loading={busy}>{busy ? t.kommune.saving : t.orgadmin.save}</Button>
        {done && <span style={{ color: "var(--success-text)", fontSize: "var(--fs-sm)", fontWeight: 600 }}>{t.kommune.profileSaved}</span>}
      </div>
    </form>
  );
}
