"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds/Button";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { inputStyle, labelStyle } from "./formStyles";

interface Ref {
  id: string;
  name: string;
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[æå]/g, "a")
      .replace(/ø/g, "o")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "profil"
  );
}

/** Create a new profile under one of the user's organisations. */
export function CreateProfileForm({ orgs, municipalities }: { orgs: Ref[]; municipalities: Ref[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const supabase = createClient();

  const [orgId, setOrgId] = useState(orgs[0]?.id ?? "");
  const [municipalityId, setMunicipalityId] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    // Unique slug within the org.
    const base = slugify(name);
    let slug = base;
    for (let n = 1; n <= 50; n += 1) {
      const { data } = await supabase
        .from("org_profiles")
        .select("id")
        .eq("organization_id", orgId)
        .eq("slug", slug)
        .maybeSingle();
      if (!data) break;
      slug = `${base}-${n}`;
    }

    const { data, error } = await supabase
      .from("org_profiles")
      .insert({
        organization_id: orgId,
        municipality_id: municipalityId || null,
        name: name.trim(),
        slug,
      })
      .select("id")
      .single();

    setBusy(false);
    if (error || !data) {
      setError(t.orgadmin.saveError);
      return;
    }
    router.push(`/admin/profiler/${data.id}`);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {orgs.length > 1 && (
        <div>
          <label htmlFor="cp-org" style={labelStyle}>{t.orgadmin.organisation}</label>
          <select id="cp-org" value={orgId} onChange={(e) => setOrgId(e.target.value)} style={inputStyle}>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label htmlFor="cp-name" style={labelStyle}>{t.orgadmin.profileName}</label>
        <input id="cp-name" required value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder={t.orgadmin.profileNamePlaceholder} />
      </div>
      <div>
        <label htmlFor="cp-muni" style={labelStyle}>{t.form.municipality}</label>
        <select id="cp-muni" value={municipalityId} onChange={(e) => setMunicipalityId(e.target.value)} style={inputStyle}>
          <option value="">{t.form.chooseMunicipality}</option>
          {municipalities.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>
      {error && <p role="alert" style={{ margin: 0, color: "var(--danger-text)", fontSize: "var(--fs-sm)" }}>{error}</p>}
      <div>
        <Button type="submit" loading={busy} leadingIcon="plus">{t.orgadmin.createProfile}</Button>
      </div>
    </form>
  );
}
