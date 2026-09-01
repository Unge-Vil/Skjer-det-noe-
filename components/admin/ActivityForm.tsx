"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { makeSlug, pointEwkt } from "@/lib/slug";
import { geocodeAddress } from "@/lib/geocode";
import { weekdayName } from "@/lib/format";
import { Button } from "@/components/ds/Button";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { CoOrganizerEditor, type CoOrg } from "./CoOrganizerEditor";
import { LanguageFields } from "./LanguageFields";
import { syncCoOrganizers } from "@/lib/coOrganizers";
import { inputStyle, labelStyle, textareaStyle } from "./formStyles";

const LocationPicker = dynamic(() => import("./LocationPicker"), { ssr: false });

interface Option {
  id: string;
  slug?: string;
  name: string;
}

export interface ActivityInitial {
  id: string;
  title: string;
  title_en: string | null;
  description: string | null;
  description_en: string | null;
  category_id: string | null;
  category_ids: string[] | null;
  municipality_id: string | null;
  address: string | null;
  accessibility: string | null;
  area: string | null;
  ends_on: string | null;
  weekday: number | null;
  start_time: string | null;
  end_time: string | null;
  recurrence_note: string | null;
  age_min: number | null;
  age_max: number | null;
  price: string | null;
  image_url: string | null;
  status: string;
}

export function ActivityForm({
  orgId,
  categories,
  municipalities,
  defaultCenter,
  initial,
  initialCoOrganizers = [],
  lockedMunicipality,
  profileId,
  returnHref = "/admin",
}: {
  orgId: string;
  categories: Option[];
  municipalities: Option[];
  defaultCenter: { lat: number; lng: number };
  initial?: ActivityInitial | null;
  initialCoOrganizers?: CoOrg[];
  /** When set, the municipality is fixed (profile-scoped creation). */
  lockedMunicipality?: { id: string; name: string };
  /** When set, new listings are owned by this profile. */
  profileId?: string;
  returnHref?: string;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [titleEn, setTitleEn] = useState(initial?.title_en ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [descriptionEn, setDescriptionEn] = useState(initial?.description_en ?? "");
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? "");
  const [categoryIds, setCategoryIds] = useState<string[]>(initial?.category_ids ?? []);
  const [municipalityId, setMunicipalityId] = useState(initial?.municipality_id ?? lockedMunicipality?.id ?? "");
  const [coOrgs, setCoOrgs] = useState<CoOrg[]>(initialCoOrganizers);
  const [address, setAddress] = useState(initial?.address ?? "");
  const [accessibility, setAccessibility] = useState(initial?.accessibility ?? "");
  const [area, setArea] = useState(initial?.area ?? "");
  const [endsOn, setEndsOn] = useState(initial?.ends_on ?? "");
  const [weekday, setWeekday] = useState<string>(initial?.weekday?.toString() ?? "");
  const [startTime, setStartTime] = useState(initial?.start_time?.slice(0, 5) ?? "");
  const [endTime, setEndTime] = useState(initial?.end_time?.slice(0, 5) ?? "");
  const [recurrenceNote, setRecurrenceNote] = useState(initial?.recurrence_note ?? "");
  const [ageMin, setAgeMin] = useState(initial?.age_min?.toString() ?? "");
  const [ageMax, setAgeMax] = useState(initial?.age_max?.toString() ?? "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [status, setStatus] = useState(initial?.status ?? "draft");
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null);
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoMsg, setGeoMsg] = useState<string | null>(null);

  const findOnMap = async () => {
    setGeoMsg(null);
    const q = address.trim();
    if (!q) {
      setGeoMsg(t.form.geocodeNoAddress);
      return;
    }
    setGeoBusy(true);
    const coords = await geocodeAddress(q);
    setGeoBusy(false);
    if (!coords) {
      setGeoMsg(t.form.geocodeNotFound);
      return;
    }
    setLoc(coords);
    setFlyTo(coords);
  };

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || (!initial && !loc)) {
      setError(t.form.required);
      return;
    }
    setBusy(true);

    const payload: Record<string, unknown> = {
      title: title.trim(),
      title_en: titleEn.trim() || null,
      description: description || null,
      description_en: descriptionEn || null,
      category_id: categoryId || null,
      category_ids: categoryIds,
      municipality_id: municipalityId || null,
      address: address || null,
      accessibility: accessibility.trim() || null,
      area: area.trim() || null,
      ends_on: endsOn || null,
      weekday: weekday === "" ? null : Number(weekday),
      start_time: startTime || null,
      end_time: endTime || null,
      recurrence_note: recurrenceNote || null,
      age_min: ageMin ? Number(ageMin) : null,
      age_max: ageMax ? Number(ageMax) : null,
      price: price || null,
      image_url: imageUrl || null,
      status,
    };
    if (loc) payload.location = pointEwkt(loc.lat, loc.lng);

    let listingId = initial?.id ?? null;
    let error;
    if (initial) {
      ({ error } = await supabase.from("activities").update(payload).eq("id", initial.id));
    } else {
      const res = await supabase
        .from("activities")
        .insert({ ...payload, slug: makeSlug(title), organization_id: orgId, profile_id: profileId ?? null })
        .select("id")
        .single();
      error = res.error;
      listingId = (res.data?.id as string) ?? null;
    }

    let coOrganizerError: unknown = null;
    if (!error && listingId) {
      ({ error: coOrganizerError } = await syncCoOrganizers(
        supabase,
        "activity_co_organizers",
        "activity_id",
        listingId,
        initialCoOrganizers.map((o) => o.id),
        coOrgs.map((o) => o.id),
      ));
    }

    setBusy(false);
    if (error || coOrganizerError) {
      console.error(error ?? coOrganizerError);
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
        <textarea id="desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} style={textareaStyle} />
      </div>

      <LanguageFields
        hasContent={!!titleEn.trim() || !!descriptionEn.trim()}
        onRemove={() => {
          setTitleEn("");
          setDescriptionEn("");
        }}
      >
        <div>
          <label htmlFor="title_en" style={labelStyle}>{t.form.titleEn}</label>
          <input id="title_en" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label htmlFor="desc_en" style={labelStyle}>{t.form.descriptionEn}</label>
          <textarea id="desc_en" rows={3} value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} style={textareaStyle} />
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
          {lockedMunicipality ? (
            <input id="muni" value={lockedMunicipality.name} disabled style={{ ...inputStyle, color: "var(--text-muted)", background: "var(--surface-sunk)" }} />
          ) : (
            <select id="muni" value={municipalityId} onChange={(e) => setMunicipalityId(e.target.value)} style={inputStyle}>
              <option value="">{t.form.chooseMunicipality}</option>
              {municipalities.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="weekday" style={labelStyle}>{t.form.weekday}</label>
          <select id="weekday" value={weekday} onChange={(e) => setWeekday(e.target.value)} style={inputStyle}>
            <option value="">{t.form.chooseWeekday}</option>
            {[1, 2, 3, 4, 5, 6, 0].map((d) => <option key={d} value={d}>{weekdayName(d, locale)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="st" style={labelStyle}>{t.form.startTime}</label>
          <input id="st" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label htmlFor="et" style={labelStyle}>{t.form.endTime}</label>
          <input id="et" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={inputStyle} />
        </div>
      </div>

      <div>
        <label htmlFor="rec" style={labelStyle}>{t.form.recurrenceNote}</label>
        <input id="rec" value={recurrenceNote} onChange={(e) => setRecurrenceNote(e.target.value)} style={inputStyle} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="area" style={labelStyle}>{t.form.area}</label>
          <input id="area" value={area} onChange={(e) => setArea(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label htmlFor="ends_on" style={labelStyle}>{t.form.endsOn}</label>
          <input id="ends_on" type="date" value={endsOn} onChange={(e) => setEndsOn(e.target.value)} style={inputStyle} />
          <p style={{ margin: "6px 0 0", fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{t.form.endsOnHint}</p>
        </div>
      </div>

      <div>
        <label htmlFor="a11y" style={labelStyle}>{t.form.accessibility}</label>
        <textarea id="a11y" rows={2} value={accessibility} onChange={(e) => setAccessibility(e.target.value)} style={textareaStyle} />
        <p style={{ margin: "6px 0 0", fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{t.form.accessibilityHint}</p>
      </div>

      {categories.length > 0 && (
        <div>
          <label style={labelStyle}>{t.form.extraCategories}</label>
          <p style={{ margin: "0 0 8px", fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{t.form.extraCategoriesHint}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {categories.filter((c) => c.id !== categoryId).map((c) => {
              const on = categoryIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setCategoryIds((prev) => on ? prev.filter((x) => x !== c.id) : [...prev, c.id])}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "var(--radius-pill)",
                    border: "1px solid " + (on ? "var(--border-brand)" : "var(--border-subtle)"),
                    background: on ? "var(--surface-brand-soft)" : "transparent",
                    color: on ? "var(--text-brand)" : "var(--text-muted)",
                    fontSize: "var(--fs-sm)",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="amin" style={labelStyle}>{t.form.ageMin}</label>
          <input id="amin" type="number" min={0} value={ageMin} onChange={(e) => setAgeMin(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label htmlFor="amax" style={labelStyle}>{t.form.ageMax}</label>
          <input id="amax" type="number" min={0} value={ageMax} onChange={(e) => setAgeMax(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label htmlFor="price" style={labelStyle}>{t.form.price}</label>
          <input id="price" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={t.form.pricePlaceholder} style={inputStyle} />
        </div>
      </div>

      <div>
        <label htmlFor="addr" style={labelStyle}>{t.form.address}</label>
        <input id="addr" value={address} onChange={(e) => setAddress(e.target.value)} style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>
          {t.form.location}
          <span style={{ marginLeft: 8, fontSize: "var(--fs-xs)", fontWeight: 600, color: "var(--coral-600)" }}>· {t.form.requiredMark}</span>
        </label>
        <p style={{ margin: "0 0 8px", fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>{t.form.locationHint}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          <Button type="button" variant="secondary" size="sm" leadingIcon="search" onClick={findOnMap} loading={geoBusy} disabled={!address.trim()}>
            {t.form.geocode}
          </Button>
          {geoMsg && (
            <span role="status" style={{ alignSelf: "center", fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>{geoMsg}</span>
          )}
        </div>
        <LocationPicker value={loc} center={defaultCenter} flyTo={flyTo} onChange={(lat, lng) => setLoc({ lat, lng })} />
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

      <div>
        <label style={labelStyle}>{t.form.coOrganizers}</label>
        <p style={{ margin: "0 0 8px", fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>{t.form.coOrganizersHint}</p>
        <CoOrganizerEditor value={coOrgs} onChange={setCoOrgs} excludeOrgId={orgId} />
      </div>

      {error && <p role="alert" style={{ margin: 0, color: "var(--danger-text)", fontSize: "var(--fs-sm)" }}>{error}</p>}

      <div
        className="sdn-admin-form-actions sticky bottom-0 z-10 sm:static"
        style={{
          display: "flex",
          gap: 10,
          padding: "12px 0 calc(12px + env(safe-area-inset-bottom))",
          background: "var(--bg-app)",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <Button type="submit" loading={busy}>{busy ? t.form.saving : t.form.save}</Button>
        <Button type="button" variant="ghost" onClick={() => router.push(returnHref)}>{t.form.cancel}</Button>
      </div>
    </form>
  );
}
