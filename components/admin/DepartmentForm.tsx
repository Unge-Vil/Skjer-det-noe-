"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds/Button";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { SocialLinksEditor } from "./SocialLinksEditor";
import { RichTextEditor } from "./RichTextEditor";
import { LanguageFields } from "./LanguageFields";
import { parseSocialLinks, type SocialLinks } from "@/components/ds/socials";
import { docToPlainText, plainTextToDoc, isEmptyDoc } from "@/lib/tiptap";
import type { ProfileDetail, ProfileFields } from "@/lib/profiles";
import { inputStyle, labelStyle } from "./formStyles";

type TextKey = "website" | "email" | "phone" | "address";

const COLUMN: Record<TextKey, string> = {
  website: "website",
  email: "email",
  phone: "phone",
  address: "address",
};

const card = {
  background: "var(--surface-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-lg)",
  padding: 20,
} as const;

export function DepartmentForm({ dept }: { dept: ProfileDetail }) {
  const { t } = useI18n();
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState(dept.name);

  const textLabels: Record<TextKey, string> = {
    website: t.orgadmin.fWebsite,
    email: t.auth.email,
    phone: t.orgadmin.phone,
    address: t.orgadmin.fAddress,
  };

  // Master rich docs (fall back to wrapping legacy plain text).
  const masterDoc = dept.master.descriptionDoc ?? plainTextToDoc(dept.master.description ?? "");
  const masterDocEn = dept.master.descriptionDocEn ?? plainTextToDoc(dept.master.descriptionEn ?? "");
  // Initial override docs (legacy plain override -> doc); null = inherit.
  const initDoc = (doc: unknown, plain: string | null) => doc ?? (plain ? plainTextToDoc(plain) : null);

  // null = inherit from master; value = custom override.
  const [fields, setFields] = useState<Record<TextKey, string | null>>({
    website: dept.override.website,
    email: dept.override.email,
    phone: dept.override.phone,
    address: dept.override.address,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [descDoc, setDescDoc] = useState<any | null>(initDoc(dept.override.descriptionDoc, dept.override.description));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [descDocEn, setDescDocEn] = useState<any | null>(initDoc(dept.override.descriptionDocEn, dept.override.descriptionEn));
  const [social, setSocial] = useState<SocialLinks | null>(dept.override.socialLinks);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const setField = (k: TextKey, v: string | null) => setFields((p) => ({ ...p, [k]: v }));
  const masterText = (k: TextKey): string => (dept.master[k as keyof ProfileFields] as string) ?? "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDone(false);
    setBusy(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patch: Record<string, any> = { name: name.trim() || dept.name };
    for (const k of Object.keys(COLUMN) as TextKey[]) {
      const v = fields[k];
      patch[COLUMN[k]] = v == null || v.trim() === "" ? null : v.trim();
    }
    // Rich description overrides: write the doc + a flattened plain mirror.
    patch.description_doc = descDoc == null || isEmptyDoc(descDoc) ? null : descDoc;
    patch.description = descDoc == null ? null : docToPlainText(descDoc) || null;
    patch.description_doc_en = descDocEn == null || isEmptyDoc(descDocEn) ? null : descDocEn;
    patch.description_en = descDocEn == null ? null : docToPlainText(descDocEn) || null;

    const socialClean = social == null ? null : parseSocialLinks(social);
    patch.social_links = socialClean && Object.keys(socialClean).length > 0 ? socialClean : null;

    const { error } = await supabase
      .from("org_profiles")
      .update(patch)
      .eq("id", dept.id);

    setBusy(false);
    if (error) {
      setError(t.orgadmin.saveError);
      return;
    }
    setDone(true);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-3xl" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      <section style={{ ...card, display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <h2 style={{ margin: "0 0 2px", fontSize: "var(--fs-h4)", fontWeight: 700 }}>{t.orgadmin.deptProfile}</h2>
          <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>{t.orgadmin.departmentsSub}</p>
        </div>

        <div>
          <label htmlFor="p-name" style={labelStyle}>{t.orgadmin.profileName}</label>
          <input id="p-name" required value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        </div>

        <RichDescription
          label={t.form.description}
          doc={descDoc}
          masterDoc={masterDoc}
          masterPlain={dept.master.description}
          onInherit={() => setDescDoc(null)}
          onCustom={() => setDescDoc(masterDoc)}
          onChange={setDescDoc}
          inheritLabel={t.orgadmin.inheritField}
          customLabel={t.orgadmin.customField}
          inheritActive={t.orgadmin.inheritActive}
        />
        <LanguageFields
          hasContent={descDocEn != null || !!dept.master.descriptionEn?.trim()}
          onRemove={() => setDescDocEn(null)}
        >
          <RichDescription
            label={t.form.descriptionEn}
            doc={descDocEn}
            masterDoc={masterDocEn}
            masterPlain={dept.master.descriptionEn}
            onInherit={() => setDescDocEn(null)}
            onCustom={() => setDescDocEn(masterDocEn)}
            onChange={setDescDocEn}
            inheritLabel={t.orgadmin.inheritField}
            customLabel={t.orgadmin.customField}
            inheritActive={t.orgadmin.inheritActive}
          />
        </LanguageFields>

        {(Object.keys(COLUMN) as TextKey[]).map((k) => {
          const inherited = fields[k] == null;
          return (
            <div key={k} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <label style={{ ...labelStyle, margin: 0 }}>{textLabels[k]}</label>
                <InheritToggle
                  inherited={inherited}
                  inheritLabel={t.orgadmin.inheritField}
                  customLabel={t.orgadmin.customField}
                  onInherit={() => setField(k, null)}
                  onCustom={() => setField(k, masterText(k))}
                />
              </div>
              {inherited ? (
                <div
                  style={{
                    ...inputStyle,
                    color: "var(--text-muted)",
                    background: "var(--surface-sunk)",
                    display: "flex",
                    alignItems: "center",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {masterText(k) || `— ${t.orgadmin.inheritActive} —`}
                </div>
              ) : (
                <input value={fields[k] ?? ""} onChange={(e) => setField(k, e.target.value)} style={inputStyle} />
              )}
            </div>
          );
        })}
      </section>

      <section style={{ ...card, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: "var(--fs-h4)", fontWeight: 700 }}>{t.orgadmin.social}</h2>
          <InheritToggle
            inherited={social == null}
            inheritLabel={t.orgadmin.inheritField}
            customLabel={t.orgadmin.customField}
            onInherit={() => setSocial(null)}
            onCustom={() => setSocial(dept.master.socialLinks ?? {})}
          />
        </div>
        {social == null ? (
          <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>{t.orgadmin.inheritActive}</p>
        ) : (
          <SocialLinksEditor value={social} onChange={setSocial} />
        )}
      </section>

      {error && <p style={{ margin: 0, color: "var(--danger-text)", fontSize: "var(--fs-sm)" }}>{error}</p>}

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Button type="submit" loading={busy}>{busy ? t.orgadmin.saving : t.orgadmin.save}</Button>
        {done && <span style={{ color: "var(--success-text)", fontSize: "var(--fs-sm)", fontWeight: 600 }}>{t.orgadmin.saved}</span>}
      </div>
    </form>
  );
}

function RichDescription({
  label,
  doc,
  masterDoc,
  masterPlain,
  onInherit,
  onCustom,
  onChange,
  inheritLabel,
  customLabel,
  inheritActive,
}: {
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  masterDoc: any;
  masterPlain: string | null;
  onInherit: () => void;
  onCustom: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (doc: any) => void;
  inheritLabel: string;
  customLabel: string;
  inheritActive: string;
}) {
  const inherited = doc == null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <label style={{ ...labelStyle, margin: 0 }}>{label}</label>
        <InheritToggle
          inherited={inherited}
          inheritLabel={inheritLabel}
          customLabel={customLabel}
          onInherit={onInherit}
          onCustom={onCustom}
        />
      </div>
      {inherited ? (
        <div
          style={{
            ...inputStyle,
            minHeight: 60,
            color: "var(--text-muted)",
            background: "var(--surface-sunk)",
            whiteSpace: "pre-wrap",
            display: "flex",
            alignItems: "center",
          }}
        >
          {(masterPlain && masterPlain.trim()) || (masterDoc && docToPlainText(masterDoc)) || `— ${inheritActive} —`}
        </div>
      ) : (
        <RichTextEditor value={doc} onChange={onChange} ariaLabel={label} />
      )}
    </div>
  );
}

function InheritToggle({
  inherited,
  inheritLabel,
  customLabel,
  onInherit,
  onCustom,
}: {
  inherited: boolean;
  inheritLabel: string;
  customLabel: string;
  onInherit: () => void;
  onCustom: () => void;
}) {
  const base = {
    border: "1px solid var(--border-subtle)",
    padding: "3px 10px",
    fontSize: "var(--fs-xs)",
    fontWeight: 600,
    cursor: "pointer",
    background: "transparent",
    color: "var(--text-muted)",
  } as const;
  const active = { background: "var(--fjord-50)", color: "var(--fjord-700)", borderColor: "var(--fjord-200, var(--border-subtle))" } as const;
  return (
    <div style={{ display: "inline-flex", borderRadius: "var(--radius-pill)", overflow: "hidden" }}>
      <button type="button" onClick={onInherit} aria-pressed={inherited} style={{ ...base, ...(inherited ? active : {}), borderTopLeftRadius: 999, borderBottomLeftRadius: 999 }}>
        {inheritLabel}
      </button>
      <button type="button" onClick={onCustom} aria-pressed={!inherited} style={{ ...base, ...(!inherited ? active : {}), borderLeft: "none", borderTopRightRadius: 999, borderBottomRightRadius: 999 }}>
        {customLabel}
      </button>
    </div>
  );
}
