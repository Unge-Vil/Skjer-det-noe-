"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds/Button";
import { Icon } from "@/components/ds/Icon";
import { StatusLabel } from "@/components/ds/StatusLabel";
import { generateKey, hashKey, keyPrefix } from "@/lib/apiKeys";
import { inputStyle, labelStyle } from "./formStyles";

export interface MunicipalityApiKeyRow {
  id: string;
  label: string | null;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

const card = {
  background: "var(--surface-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-lg)",
  padding: 20,
} as const;

export function MunicipalityApiKeysManager({ municipalityId, initial }: { municipalityId: string; initial: MunicipalityApiKeyRow[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const token = generateKey("municipality");
    const keyHash = await hashKey(token);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error: insertError } = await supabase.from("municipality_api_keys").insert({
      municipality_id: municipalityId,
      label: label.trim() || null,
      key_prefix: keyPrefix(token),
      key_hash: keyHash,
      created_by: user?.id ?? null,
    });
    setBusy(false);
    if (insertError) {
      setError("Kunne ikke opprette API-nøkkel. Prøv igjen.");
      return;
    }
    setLabel("");
    setNewToken(token);
    setCopied(false);
    router.refresh();
  };

  const revoke = async (id: string) => {
    await supabase.from("municipality_api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", id);
    router.refresh();
  };

  const copy = async () => {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken);
    setCopied(true);
  };

  const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString("nb-NO") : "Aldri");

  return (
    <section style={{ ...card, display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h2 style={{ margin: "0 0 2px", fontSize: "var(--fs-h4)", fontWeight: 700 }}>Kommune-API-nøkler</h2>
        <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>Nøklene gir lesetilgang til publiserte aktiviteter og arrangementer i denne kommunen.</p>
      </div>

      {newToken && (
        <div style={{ padding: 16, borderRadius: "var(--radius-md)", border: "1px solid var(--border-brand)", background: "var(--surface-brand-soft)", display: "flex", flexDirection: "column", gap: 8 }}>
          <strong style={{ fontSize: "var(--fs-sm)" }}>Nøkkel opprettet</strong>
          <p style={{ margin: 0, fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>Kopier nøkkelen nå. Den vises ikke igjen.</p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <code style={{ flex: 1, minWidth: 0, overflowX: "auto", whiteSpace: "nowrap", padding: "8px 10px", borderRadius: "var(--radius-sm)", background: "var(--surface-sunk)", fontSize: "var(--fs-sm)" }}>{newToken}</code>
            <Button type="button" variant="secondary" size="sm" leadingIcon={copied ? "check" : "copy"} onClick={copy}>{copied ? "Kopiert" : "Kopier"}</Button>
          </div>
          <div><Button type="button" variant="ghost" size="sm" onClick={() => setNewToken(null)}>Ferdig</Button></div>
        </div>
      )}

      <form onSubmit={create} className="flex flex-wrap items-end gap-3">
        <div style={{ flex: 1, minWidth: 180 }}>
          <label htmlFor="municipality-key-label" style={labelStyle}>Navn på nøkkel</label>
          <input id="municipality-key-label" value={label} onChange={(event) => setLabel(event.target.value)} placeholder="F.eks. kommunens nettside" style={inputStyle} />
        </div>
        <Button type="submit" loading={busy} leadingIcon="plus">Lag nøkkel</Button>
      </form>
      {error && <p role="alert" style={{ margin: 0, color: "var(--danger-text)", fontSize: "var(--fs-sm)" }}>{error}</p>}

      {initial.length === 0 ? (
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>Ingen nøkler ennå.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {initial.map((key) => (
            <div key={key.id} className="flex flex-wrap items-center justify-between gap-3" style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
              <div className="min-w-0">
                <p style={{ margin: 0, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><Icon name="key" size={14} />{key.label || key.key_prefix}<code style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{key.key_prefix}</code></p>
                <p style={{ margin: 0, fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>Opprettet: {formatDate(key.created_at)} · Sist brukt: {formatDate(key.last_used_at)}</p>
              </div>
              {key.revoked_at ? <StatusLabel label="Tilbaketrukket" icon="ban" tone="danger" size="sm" /> : <Button variant="ghost" size="sm" onClick={() => revoke(key.id)}>Trekk tilbake</Button>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}