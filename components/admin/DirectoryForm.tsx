"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { makeSlug } from "@/lib/slug";
import { Button } from "@/components/ds/Button";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { LanguageFields } from "./LanguageFields";
import { inputStyle, labelStyle, textareaStyle } from "./formStyles";

type Option = { id: string; name: string };

export interface DirectoryInitial {
  id: string;
  title: string;
  title_en: string | null;
  description: string | null;
  description_en: string | null;
  category_id: string | null;
  municipality_id: string | null;
  area: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  url: string | null;
  image_url: string | null;
  price: string | null;
  time_commitment: string | null;
  status: string;
}

export function DirectoryForm({
  kind,
  orgId,
  categories,
  municipalities,
  initial,
  returnHref = "/admin",
}: {
  kind: "service" | "volunteer";
  orgId: string;
  categories: Option[];
  municipalities: Option[];
  initial?: DirectoryInitial | null;
  returnHref?: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [titleEn, setTitleEn] = useState(initial?.title_en ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [descriptionEn, setDescriptionEn] = useState(initial?.description_en ?? "");
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? "");
  const [municipalityId, setMunicipalityId] = useState(initial?.municipality_id ?? "");
  const [area, setArea] = useState(initial?.area ?? "");
  const [contactName, setContactName] = useState(initial?.contact_name ?? "");
  const [contactEmail, setContactEmail] = useState(initial?.contact_email ?? "");
  const [contactPhone, setContactPhone] = useState(initial?.contact_phone ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [timeCommitment, setTimeCommitment] = useState(initial?.time_commitment ?? "");
  const [status, setStatus] = useState(initial?.status ?? "published");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(t.form.required);
      return;
    }
    setError(null);
    setBusy(true);

    const payload: Record<string, unknown> = {
      title: title.trim(),
      title_en: titleEn.trim() || null,
      description: description || null,
      description_en: descriptionEn || null,
      category_id: categoryId || null,
      municipality_id: municipalityId || null,
      area: area.trim() || null,
      contact_name: contactName.trim() || null,
      contact_email: contactEmail.trim() || null,
      contact_phone: contactPhone.trim() || null,
      url: url.trim() || null,
      image_url: imageUrl.trim() || null,
      price: kind === "service" ? price.trim() || null : null,
      time_commitment: kind === "volunteer" ? timeCommitment.trim() || null : null,
      status,
    };

    let error;
    if (initial) {
      ({ error } = await supabase.from("directory_listings").update(payload).eq("id", initial.id));
    } else {
      ({ error } = await supabase
        .from("directory_listings")
        .insert({ ...payload, kind, organization_id: orgId, slug: makeSlug(title) }));
    }

    setBusy(false);
    if (error) {
      setError(t.form.saveError);
      return;
    }
    router.push(returnHref);
    router.refresh();
  };

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label htmlFor="title" style={labelStyle}>{t.form.title}</label>
        <input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
      </div>

      <div>
        <label htmlFor="desc" style={labelStyle}>{t.form.description}</label>
        <textarea id="desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} style={textareaStyle} />
      </div>

      <LanguageFields
        hasContent={!!titleEn.trim() || !!descriptionEn.trim()}
        onRemove={() => { setTitleEn(""); setDescriptionEn(""); }}
      >
        <div>
          <label htmlFor="title_en" style={labelStyle}>{t.form.titleEn}</label>
          <input id="title_en" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label htmlFor="desc_en" style={labelStyle}>{t.form.descriptionEn}</label>
          <textarea id="desc_en" rows={4} value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} style={textareaStyle} />
        </div>
      </LanguageFields>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cat" style={labelStyle}>{t.form.category}</label>
          <select id="cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={inputStyle}>
            <option value="">{t.form.chooseCategory}</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="muni" style={labelStyle}>{t.form.municipality}</label>
          <select id="muni" value={municipalityId} onChange={(e) => setMunicipalityId(e.target.value)} style={inputStyle}>
            <option value="">{t.form.chooseMunicipality}</option>
            {municipalities.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="area" style={labelStyle}>{t.directory.area}</label>
          <input id="area" value={area} onChange={(e) => setArea(e.target.value)} style={inputStyle} />
        </div>
        {kind === "service" ? (
          <div>
            <label htmlFor="price" style={labelStyle}>{t.directory.price}</label>
            <input id="price" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={t.form.pricePlaceholder} style={inputStyle} />
          </div>
        ) : (
          <div>
            <label htmlFor="time" style={labelStyle}>{t.directory.timeCommitment}</label>
            <input id="time" value={timeCommitment} onChange={(e) => setTimeCommitment(e.target.value)} placeholder="F.eks. 2 timer/uke" style={inputStyle} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="cname" style={labelStyle}>{t.orgadmin.name}</label>
          <input id="cname" value={contactName} onChange={(e) => setContactName(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label htmlFor="cemail" style={labelStyle}>{t.auth.email}</label>
          <input id="cemail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label htmlFor="cphone" style={labelStyle}>{t.orgadmin.phone}</label>
          <input id="cphone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} style={inputStyle} />
        </div>
      </div>

      <div>
        <label htmlFor="url" style={labelStyle}>{t.orgadmin.fWebsite}</label>
        <input id="url" value={url} onChange={(e) => setUrl(e.target.value)} style={inputStyle} />
      </div>

      <div>
        <label htmlFor="img" style={labelStyle}>{t.form.imageUrl}</label>
        <input id="img" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} style={inputStyle} />
      </div>

      <div>
        <label htmlFor="status" style={labelStyle}>{t.form.status}</label>
        <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
          <option value="draft">{t.form.statusDraftOption}</option>
          <option value="published">{t.form.statusPublishedOption}</option>
        </select>
      </div>

      {error && <p style={{ margin: 0, color: "var(--danger-text)", fontSize: "var(--fs-sm)" }}>{error}</p>}

      <div>
        <Button type="submit" loading={busy}>{busy ? t.form.saving : t.form.save}</Button>
      </div>
    </form>
  );
}
