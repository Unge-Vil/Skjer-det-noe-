"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds/Button";
import { inputStyle, labelStyle, textareaStyle } from "./formStyles";

type ListingKind = "event" | "activity";
type ExceptionKind = "cancelled" | "closed" | "changed" | "notice";
type ExceptionRow = { id: string; occurrence_date: string; kind: ExceptionKind; message: string | null; reason: string | null; start_time: string | null; end_time: string | null };

const labels: Record<ExceptionKind, string> = {
  cancelled: "Avlyst",
  closed: "Stengt",
  changed: "Endrede tider",
  notice: "Viktig informasjon",
};

export function ExceptionManager({ listingKind, listingId, organizationId }: { listingKind: ListingKind; listingId: string; organizationId: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getSupabase = () => createClient() as any;
  const [rows, setRows] = useState<ExceptionRow[]>([]);
  const [date, setDate] = useState("");
  const [kind, setKind] = useState<ExceptionKind>(listingKind === "event" ? "cancelled" : "closed");
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const column = listingKind === "event" ? "event_id" : "activity_id";
    const { data } = await getSupabase().from("listing_exceptions").select("id,occurrence_date,kind,message,reason,start_time,end_time").eq(column, listingId).order("occurrence_date");
    setRows((data ?? []) as ExceptionRow[]);
  };

  useEffect(() => {
    let active = true;
    const column = listingKind === "event" ? "event_id" : "activity_id";
    void getSupabase()
      .from("listing_exceptions")
      .select("id,occurrence_date,kind,message,reason,start_time,end_time")
      .eq(column, listingId)
      .order("occurrence_date")
      .then(({ data }: { data: ExceptionRow[] | null }) => {
        if (active) setRows(data ?? []);
      });
    return () => {
      active = false;
    };
  }, [listingId, listingKind]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!date || ((startTime || endTime) && (!startTime || !endTime))) {
      setError("Velg dato og fyll ut begge klokkeslett hvis tidene skal endres.");
      return;
    }
    setBusy(true);
    const listingColumn = listingKind === "event" ? "event_id" : "activity_id";
    const payload = {
      [listingColumn]: listingId,
      organization_id: organizationId,
      occurrence_date: date,
      kind,
      message: message.trim() || null,
      reason: reason.trim() || null,
      start_time: startTime || null,
      end_time: endTime || null,
    };
    const { data: existing } = await getSupabase().from("listing_exceptions").select("id").eq(listingColumn, listingId).eq("occurrence_date", date).maybeSingle();
    const result = existing
      ? await getSupabase().from("listing_exceptions").update(payload).eq("id", existing.id)
      : await getSupabase().from("listing_exceptions").insert(payload);
    const saveError = result.error;
    setBusy(false);
    if (saveError) {
      setError("Kunne ikke lagre avviket.");
      return;
    }
    setDate("");
    setMessage("");
    setReason("");
    setStartTime("");
    setEndTime("");
    await load();
  };

  const remove = async (id: string) => {
    await getSupabase().from("listing_exceptions").delete().eq("id", id);
    await load();
  };

  return (
    <section style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid var(--border-subtle)" }}>
      <h2 style={{ margin: "0 0 6px", fontSize: "var(--fs-h3)", fontWeight: 800 }}>Avvik og beskjeder</h2>
      <p style={{ margin: "0 0 16px", color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>Marker en dato som avlyst, stengt eller endret uten å endre den faste oppføringen.</p>
      <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label htmlFor="exception-date" style={labelStyle}>Dato</label>
          <input id="exception-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} style={inputStyle} required />
        </div>
        <div>
          <label htmlFor="exception-kind" style={labelStyle}>Type</label>
          <select id="exception-kind" value={kind} onChange={(event) => setKind(event.target.value as ExceptionKind)} style={inputStyle}>
            {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        {kind === "changed" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label htmlFor="exception-start" style={labelStyle}>Ny start</label><input id="exception-start" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} style={inputStyle} /></div>
            <div><label htmlFor="exception-end" style={labelStyle}>Ny slutt</label><input id="exception-end" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} style={inputStyle} /></div>
          </div>
        )}
        <div><label htmlFor="exception-message" style={labelStyle}>Beskjed</label><textarea id="exception-message" rows={2} value={message} onChange={(event) => setMessage(event.target.value)} style={textareaStyle} placeholder="For eksempel: På grunn av vedlikehold ..." /></div>
        <div><label htmlFor="exception-reason" style={labelStyle}>Grunn (valgfritt)</label><input id="exception-reason" value={reason} onChange={(event) => setReason(event.target.value)} style={inputStyle} /></div>
        {error && <p role="alert" style={{ margin: 0, color: "var(--danger-text)", fontSize: "var(--fs-sm)" }}>{error}</p>}
        <div><Button type="submit" disabled={busy}>{busy ? "Lagrer ..." : "Lagre avvik"}</Button></div>
      </form>
      {rows.length > 0 && <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 20 }}>
        {rows.map((row) => <div key={row.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", padding: 12, background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
          <div><strong>{row.occurrence_date} · {labels[row.kind]}</strong>{row.message && <div style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{row.message}</div>}</div>
          <Button type="button" variant="secondary" onClick={() => void remove(row.id)}>Fjern</Button>
        </div>)}
      </div>}
    </section>
  );
}