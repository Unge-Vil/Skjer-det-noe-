"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds/Button";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { inputStyle, labelStyle } from "./formStyles";

export interface FeedRow {
  id: string;
  url: string;
  label: string | null;
  profile_id: string | null;
  default_category_id: string | null;
  auto_publish: boolean;
  active: boolean;
  last_synced_at: string | null;
  last_status: string | null;
  last_error: string | null;
}

interface Opt {
  id: string;
  name: string;
}

const card = {
  background: "var(--surface-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-lg)",
  padding: 20,
} as const;

export function CalendarFeedsManager({
  orgId,
  initial,
  profiles,
  categories,
}: {
  orgId: string;
  initial: FeedRow[];
  profiles: Opt[];
  categories: Opt[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const supabase = createClient();

  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [profileId, setProfileId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [autoPublish, setAutoPublish] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabase.from("calendar_feeds").insert({
      organization_id: orgId,
      url: url.trim(),
      label: label.trim() || null,
      profile_id: profileId || null,
      default_category_id: categoryId || null,
      auto_publish: autoPublish,
    });
    setBusy(false);
    if (error) {
      setError(t.integrations.saveError);
      return;
    }
    setUrl("");
    setLabel("");
    setProfileId("");
    setCategoryId("");
    router.refresh();
  };

  const remove = async (id: string) => {
    if (!confirm(t.integrations.confirmRemoveFeed)) return;
    await supabase.from("calendar_feeds").delete().eq("id", id);
    router.refresh();
  };

  const sync = async (id: string) => {
    setSyncing(id);
    setError(null);
    try {
      const res = await fetch(`/api/integrations/feeds/${id}/sync`, { method: "POST" });
      if (!res.ok) throw new Error("sync");
    } catch {
      setError(t.integrations.syncError);
    } finally {
      setSyncing(null);
      router.refresh();
    }
  };

  const fmt = (s: string | null) => (s ? new Date(s).toLocaleString("nb-NO") : "—");

  return (
    <section style={{ ...card, display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h2 style={{ margin: "0 0 2px", fontSize: "var(--fs-h4)", fontWeight: 700 }}>{t.integrations.feedsTitle}</h2>
        <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>{t.integrations.feedsHint}</p>
      </div>

      <form onSubmit={add} className="flex flex-col gap-3">
        <div>
          <label htmlFor="f-url" style={labelStyle}>{t.integrations.feedUrl}</label>
          <input id="f-url" type="url" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t.integrations.feedUrlPlaceholder} style={inputStyle} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="f-label" style={labelStyle}>{t.integrations.feedLabel}</label>
            <input id="f-label" value={label} onChange={(e) => setLabel(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label htmlFor="f-profile" style={labelStyle}>{t.integrations.feedProfile}</label>
            <select id="f-profile" value={profileId} onChange={(e) => setProfileId(e.target.value)} style={inputStyle}>
              <option value="">{t.integrations.none}</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="f-cat" style={labelStyle}>{t.integrations.feedCategory}</label>
            <select id="f-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={inputStyle}>
              <option value="">{t.integrations.none}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "var(--fs-sm)" }}>
            <input type="checkbox" checked={autoPublish} onChange={(e) => setAutoPublish(e.target.checked)} />
            {t.integrations.autoPublish}
          </label>
          <Button type="submit" loading={busy} leadingIcon="plus">{t.integrations.addFeed}</Button>
        </div>
      </form>
      {error && <p style={{ margin: 0, color: "var(--danger-text)", fontSize: "var(--fs-sm)" }}>{error}</p>}

      {initial.length === 0 ? (
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.integrations.noFeeds}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {initial.map((f) => (
            <div key={f.id} className="flex flex-wrap items-center justify-between gap-3" style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
              <div className="min-w-0">
                <p style={{ margin: 0, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 360 }}>{f.label || f.url}</p>
                <p style={{ margin: 0, fontSize: "var(--fs-xs)", color: f.last_status?.startsWith("error") ? "var(--danger-text)" : "var(--text-muted)" }}>
                  {t.integrations.lastSync}: {fmt(f.last_synced_at)}{f.last_status ? ` · ${f.last_status}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" leadingIcon="repeat" loading={syncing === f.id} onClick={() => sync(f.id)}>
                  {syncing === f.id ? t.integrations.syncing : t.integrations.syncNow}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => remove(f.id)}>{t.integrations.remove}</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
