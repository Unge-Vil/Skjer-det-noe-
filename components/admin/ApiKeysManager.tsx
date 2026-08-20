"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds/Button";
import { Icon } from "@/components/ds/Icon";
import { StatusLabel } from "@/components/ds/StatusLabel";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { generateKey, hashKey, keyPrefix } from "@/lib/apiKeys";
import { inputStyle, labelStyle } from "./formStyles";

export interface ApiKeyRow {
  id: string;
  label: string | null;
  key_prefix: string;
  auto_publish: boolean;
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

export function ApiKeysManager({ orgId, initial }: { orgId: string; initial: ApiKeyRow[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const supabase = createClient();

  const [label, setLabel] = useState("");
  const [autoPublish, setAutoPublish] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const token = generateKey();
    const key_hash = await hashKey(token);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("api_keys").insert({
      organization_id: orgId,
      label: label.trim() || null,
      key_prefix: keyPrefix(token),
      key_hash,
      auto_publish: autoPublish,
      created_by: user?.id ?? null,
    });
    setBusy(false);
    if (error) {
      setError(t.integrations.saveError);
      return;
    }
    setLabel("");
    setNewToken(token);
    setCopied(false);
    router.refresh();
  };

  const revoke = async (id: string) => {
    await supabase.from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", id);
    router.refresh();
  };

  const toggleAuto = async (id: string, value: boolean) => {
    await supabase.from("api_keys").update({ auto_publish: value }).eq("id", id);
    router.refresh();
  };

  const copy = async () => {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken);
    setCopied(true);
  };

  const fmt = (s: string | null) => (s ? new Date(s).toLocaleDateString("nb-NO") : t.integrations.never);

  return (
    <section style={{ ...card, display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h2 style={{ margin: "0 0 2px", fontSize: "var(--fs-h4)", fontWeight: 700 }}>{t.integrations.apiTitle}</h2>
        <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>{t.integrations.apiHint}</p>
      </div>

      {newToken && (
        <div style={{ padding: 16, borderRadius: "var(--radius-md)", border: "1px solid var(--border-brand)", background: "var(--surface-brand-soft)", display: "flex", flexDirection: "column", gap: 8 }}>
          <strong style={{ fontSize: "var(--fs-sm)" }}>{t.integrations.keyCreatedTitle}</strong>
          <p style={{ margin: 0, fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{t.integrations.keyCreatedHint}</p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <code style={{ flex: 1, minWidth: 0, overflowX: "auto", whiteSpace: "nowrap", padding: "8px 10px", borderRadius: "var(--radius-sm)", background: "var(--surface-sunk)", fontSize: "var(--fs-sm)" }}>{newToken}</code>
            <Button type="button" variant="secondary" size="sm" leadingIcon={copied ? "check" : "copy"} onClick={copy}>
              {copied ? t.integrations.copied : t.integrations.copy}
            </Button>
          </div>
          <div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setNewToken(null)}>{t.integrations.done}</Button>
          </div>
        </div>
      )}

      <form onSubmit={create} className="flex flex-wrap items-end gap-3">
        <div style={{ flex: 1, minWidth: 180 }}>
          <label htmlFor="k-label" style={labelStyle}>{t.integrations.keyLabel}</label>
          <input id="k-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t.integrations.keyLabelPlaceholder} style={inputStyle} />
        </div>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "var(--fs-sm)", paddingBottom: 8 }}>
          <input type="checkbox" checked={autoPublish} onChange={(e) => setAutoPublish(e.target.checked)} />
          {t.integrations.autoPublish}
        </label>
        <Button type="submit" loading={busy} leadingIcon="plus">{t.integrations.createKey}</Button>
      </form>
      {error && <p role="alert" style={{ margin: 0, color: "var(--danger-text)", fontSize: "var(--fs-sm)" }}>{error}</p>}

      {initial.length === 0 ? (
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.integrations.noKeys}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {initial.map((k) => (
            <div key={k.id} className="flex flex-wrap items-center justify-between gap-3" style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
              <div className="min-w-0">
                <p style={{ margin: 0, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="key" size={14} />
                  {k.label || k.key_prefix}
                  <code style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{k.key_prefix}</code>
                </p>
                <p style={{ margin: 0, fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
                  {t.integrations.created}: {fmt(k.created_at)} · {t.integrations.lastUsed}: {fmt(k.last_used_at)}
                </p>
              </div>
              {k.revoked_at ? (
                <StatusLabel label={t.integrations.revoked} icon="ban" tone="danger" size="sm" />
              ) : (
                <div className="flex items-center gap-3">
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
                    <input type="checkbox" checked={k.auto_publish} onChange={(e) => toggleAuto(k.id, e.target.checked)} />
                    {t.integrations.autoPublish}
                  </label>
                  <Button variant="ghost" size="sm" onClick={() => revoke(k.id)}>{t.integrations.revoke}</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
