"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds/Button";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { RichTextEditor } from "./RichTextEditor";
import { EMPTY_DOC } from "@/lib/tiptap";
import { inputStyle, labelStyle } from "./formStyles";

/** Clean, suffix-free slug (uniqueness is enforced per municipality in the DB). */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[æå]/g, "a")
    .replace(/ø/g, "o")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export interface MuniPageInitial {
  id: string | null;
  title: string;
  titleEn: string;
  slug: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contentEn: any;
  status: string;
}

const card = {
  background: "var(--surface-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-lg)",
  padding: 20,
} as const;

export function MuniPageForm({
  municipalityId,
  municipalitySlug,
  page,
}: {
  municipalityId: string;
  municipalitySlug: string;
  page: MuniPageInitial;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState(page.title);
  const [titleEn, setTitleEn] = useState(page.titleEn);
  const [slug, setSlug] = useState(page.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(page.slug));
  const [content, setContent] = useState(page.content ?? EMPTY_DOC);
  const [contentEn, setContentEn] = useState(page.contentEn ?? EMPTY_DOC);
  const [status, setStatus] = useState(page.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onTitle = (v: string) => {
    setTitle(v);
    if (!slugTouched) setSlug(slugify(v));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDone(false);
    setBusy(true);

    const finalSlug = slugify(slug || title) || "side";
    const row = {
      municipality_id: municipalityId,
      title: title.trim(),
      title_en: titleEn.trim() || null,
      slug: finalSlug,
      content,
      content_en: contentEn,
      status,
    };

    let savedId = page.id;
    if (page.id) {
      const { error } = await supabase.from("municipality_pages").update(row).eq("id", page.id);
      if (error) {
        setBusy(false);
        setError(t.kommune.saveError);
        return;
      }
    } else {
      const { data, error } = await supabase.from("municipality_pages").insert(row).select("id").single();
      if (error || !data) {
        setBusy(false);
        setError(t.kommune.saveError);
        return;
      }
      savedId = data.id as string;
    }

    setBusy(false);
    setDone(true);
    router.refresh();
    if (!page.id && savedId) router.replace(`/kommune/sider/${savedId}`);
  };

  const remove = async () => {
    if (!page.id) return;
    if (!confirm(t.kommune.confirmDeletePage)) return;
    await supabase.from("municipality_pages").delete().eq("id", page.id);
    router.replace("/kommune/sider");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-3xl" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      <section style={{ ...card, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label htmlFor="p-title" style={labelStyle}>{t.kommune.pageTitle}</label>
          <input id="p-title" required value={title} onChange={(e) => onTitle(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label htmlFor="p-title-en" style={labelStyle}>
            {t.kommune.pageTitleEn} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({t.form.optional})</span>
          </label>
          <input id="p-title-en" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label htmlFor="p-slug" style={labelStyle}>{t.kommune.pageSlug}</label>
          <input
            id="p-slug"
            value={slug}
            onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }}
            style={inputStyle}
          />
          <p style={{ margin: "4px 0 0", fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
            {t.kommune.pageSlugHint} <code>/kommune/{municipalitySlug}/{slugify(slug || title) || "side"}</code>
          </p>
        </div>
      </section>

      <section style={{ ...card, display: "flex", flexDirection: "column", gap: 10 }}>
        <label style={labelStyle}>{t.kommune.pageContent}</label>
        <RichTextEditor value={content} onChange={setContent} ariaLabel={t.kommune.pageContent} />
      </section>

      <section style={{ ...card, display: "flex", flexDirection: "column", gap: 10 }}>
        <label style={labelStyle}>
          {t.kommune.pageContentEn} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({t.form.optional})</span>
        </label>
        <RichTextEditor value={contentEn} onChange={setContentEn} ariaLabel={t.kommune.pageContentEn} />
      </section>

      <section style={{ ...card, display: "flex", alignItems: "center", gap: 12 }}>
        <label htmlFor="p-status" style={{ ...labelStyle, margin: 0 }}>{t.kommune.statusLabel}</label>
        <select id="p-status" value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
          <option value="draft">{t.kommune.draft}</option>
          <option value="published">{t.kommune.published}</option>
        </select>
      </section>

      {error && <p style={{ margin: 0, color: "var(--danger-600)", fontSize: "var(--fs-sm)" }}>{error}</p>}

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Button type="submit" loading={busy}>{busy ? t.kommune.saving : t.kommune.savePage}</Button>
        {done && <span style={{ color: "var(--success-600)", fontSize: "var(--fs-sm)", fontWeight: 600 }}>{t.kommune.saved}</span>}
        {page.id && (
          <Button type="button" variant="ghost" onClick={remove} style={{ marginLeft: "auto" }}>
            {t.kommune.deletePage}
          </Button>
        )}
      </div>
    </form>
  );
}
