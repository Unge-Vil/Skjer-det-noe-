"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds/Button";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { inputStyle, labelStyle } from "./formStyles";

export function MuniCreateForm() {
  const { t } = useI18n();
  const router = useRouter();
  const supabase = createClient();

  const [kommunenummer, setKommunenummer] = useState("");
  const [name, setName] = useState("");
  const [county, setCounty] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDone(false);
    setBusy(true);
    const latNum = lat.trim() === "" ? null : Number(lat.replace(",", "."));
    const lngNum = lng.trim() === "" ? null : Number(lng.replace(",", "."));
    const { error } = await supabase.rpc("create_municipality", {
      p_kommunenummer: kommunenummer.trim(),
      p_name: name.trim(),
      p_county: county.trim() || null,
      p_lat: latNum != null && Number.isFinite(latNum) ? latNum : null,
      p_lng: lngNum != null && Number.isFinite(lngNum) ? lngNum : null,
    });
    setBusy(false);
    if (error) {
      setError(t.platform.muniCreateError);
      return;
    }
    setKommunenummer("");
    setName("");
    setCounty("");
    setLat("");
    setLng("");
    setDone(true);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="m-num" style={labelStyle}>{t.platform.muniNumber}</label>
          <input id="m-num" required value={kommunenummer} onChange={(e) => setKommunenummer(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label htmlFor="m-name" style={labelStyle}>{t.platform.muniName}</label>
          <input id="m-name" required value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label htmlFor="m-county" style={labelStyle}>
            {t.platform.muniCounty} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({t.form.optional})</span>
          </label>
          <input id="m-county" value={county} onChange={(e) => setCounty(e.target.value)} style={inputStyle} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="m-lat" style={labelStyle}>
              {t.platform.muniLat} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({t.form.optional})</span>
            </label>
            <input id="m-lat" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label htmlFor="m-lng" style={labelStyle}>
              {t.platform.muniLng} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({t.form.optional})</span>
            </label>
            <input id="m-lng" inputMode="decimal" value={lng} onChange={(e) => setLng(e.target.value)} style={inputStyle} />
          </div>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{t.platform.muniCenterHint}</p>
      {error && <p style={{ margin: 0, color: "var(--danger-text)", fontSize: "var(--fs-sm)" }}>{error}</p>}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Button type="submit" loading={busy}>{t.platform.muniCreate}</Button>
        {done && <span style={{ color: "var(--success-text)", fontSize: "var(--fs-sm)", fontWeight: 600 }}>{t.platform.muniCreated}</span>}
      </div>
    </form>
  );
}
