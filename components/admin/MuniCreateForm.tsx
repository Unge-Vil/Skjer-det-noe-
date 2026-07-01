"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds/Button";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { inputStyle, labelStyle } from "./formStyles";

type Catalog = { kommunenummer: string; name: string; fylke: string | null };

export function MuniCreateForm() {
  const { t } = useI18n();
  const router = useRouter();
  const supabase = createClient();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Catalog[]>([]);
  const [selected, setSelected] = useState<Catalog | null>(null);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Refresh state (import from Kartverket).
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

  // Debounced search against the reference catalog. Results are only rendered
  // when the query is long enough (see below), so no synchronous clear needed.
  const seq = useRef(0);
  useEffect(() => {
    const q = query.trim();
    if (selected || q.length < 2) return;
    const mine = ++seq.current;
    const id = setTimeout(async () => {
      const { data } = await supabase
        .from("no_municipalities")
        .select("kommunenummer,name,fylke")
        .ilike("name", `%${q}%`)
        .order("name")
        .limit(8);
      if (mine === seq.current) setResults((data as Catalog[]) ?? []);
    }, 150);
    return () => clearTimeout(id);
  }, [query, selected, supabase]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setError(null);
    setDone(false);
    setBusy(true);
    const latNum = lat.trim() === "" ? null : Number(lat.replace(",", "."));
    const lngNum = lng.trim() === "" ? null : Number(lng.replace(",", "."));
    const { error } = await supabase.rpc("create_municipality", {
      p_kommunenummer: selected.kommunenummer,
      p_name: selected.name,
      p_county: selected.fylke,
      p_lat: latNum != null && Number.isFinite(latNum) ? latNum : null,
      p_lng: lngNum != null && Number.isFinite(lngNum) ? lngNum : null,
    });
    setBusy(false);
    if (error) {
      setError(t.platform.muniCreateError);
      return;
    }
    setSelected(null);
    setQuery("");
    setLat("");
    setLng("");
    setDone(true);
    router.refresh();
  };

  const refresh = async () => {
    setRefreshMsg(null);
    setRefreshing(true);
    try {
      const res = await fetch("/api/kommuner/refresh", { method: "POST" });
      const body = (await res.json()) as { count?: number; error?: string };
      if (!res.ok) throw new Error(body.error || "error");
      setRefreshMsg(`${t.platform.refreshDone} (${body.count})`);
      router.refresh();
    } catch {
      setRefreshMsg(t.platform.refreshError);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {!selected ? (
        <div style={{ position: "relative" }}>
          <label htmlFor="m-search" style={labelStyle}>{t.platform.muniSearch}</label>
          <input
            id="m-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={inputStyle}
            autoComplete="off"
            placeholder={t.platform.muniSearch}
          />
          <p style={{ margin: "6px 0 0", fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{t.platform.muniSearchHint}</p>
          {query.trim().length >= 2 && (
            <ul
              style={{
                listStyle: "none",
                margin: "8px 0 0",
                padding: 0,
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                background: "var(--surface-card)",
              }}
            >
              {results.length === 0 ? (
                <li style={{ padding: "10px 14px", color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.platform.muniNoMatch}</li>
              ) : (
                results.map((r) => (
                  <li key={r.kommunenummer}>
                    <button
                      type="button"
                      onClick={() => { setSelected(r); setResults([]); }}
                      style={{
                        display: "flex",
                        width: "100%",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "10px 14px",
                        border: "none",
                        borderTop: "1px solid var(--border-subtle)",
                        background: "transparent",
                        color: "var(--text-body)",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{r.name}</span>
                      <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
                        {r.fylke} · {r.kommunenummer}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      ) : (
        <div
          className="flex items-center justify-between gap-3"
          style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-brand)", background: "var(--surface-brand-soft)" }}
        >
          <div className="min-w-0">
            <p style={{ margin: 0, fontWeight: 700 }}>{selected.name}</p>
            <p style={{ margin: 0, fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
              {selected.fylke} · {t.platform.muniNumber} {selected.kommunenummer}
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(null)}>
            {t.platform.muniSearchAgain}
          </Button>
        </div>
      )}

      {selected && (
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
          <p className="col-span-2" style={{ margin: 0, fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{t.platform.muniCenterHint}</p>
        </div>
      )}

      {error && <p style={{ margin: 0, color: "var(--danger-text)", fontSize: "var(--fs-sm)" }}>{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={busy} disabled={!selected}>{t.platform.muniCreate}</Button>
        {done && <span style={{ color: "var(--success-text)", fontSize: "var(--fs-sm)", fontWeight: 600 }}>{t.platform.muniCreated}</span>}
        <span style={{ flex: 1 }} />
        <Button type="button" variant="secondary" size="sm" leadingIcon="repeat" onClick={refresh} loading={refreshing}>
          {refreshing ? t.platform.refreshing : t.platform.refreshCatalog}
        </Button>
      </div>
      {refreshMsg && <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>{refreshMsg}</p>}
    </form>
  );
}
