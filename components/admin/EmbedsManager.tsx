"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds/Button";
import { Icon } from "@/components/ds/Icon";
import { CATEGORIES } from "@/components/ds/categories";
import {
  embedIframeSnippet,
  embedSnippet,
  generatePublicId,
  normalizeOrigin,
  type EmbedKind,
  type EmbedLayout,
  type EmbedTheme,
} from "@/lib/embeds";
import { inputStyle, labelStyle } from "./formStyles";

export interface EmbedRow {
  id: string;
  public_id: string;
  label: string | null;
  kind: EmbedKind;
  layout: EmbedLayout;
  theme: EmbedTheme;
  item_limit: number;
  category_slugs: string[];
  allowed_origins: string[];
  active: boolean;
  created_at: string;
}

export interface EmbedOwner {
  kind: "organization" | "municipality";
  id: string;
}

const KINDS: { value: EmbedKind; label: string; hint: string }[] = [
  { value: "events", label: "Arrangementer", hint: "Kommende arrangementer, nærmeste først." },
  { value: "activities", label: "Aktiviteter", hint: "Faste tilbud, sortert alfabetisk." },
  { value: "kiosk", label: "Infoskjerm", hint: "Fullskjerm med stor tekst og automatisk bla." },
];

const card = {
  background: "var(--surface-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-lg)",
  padding: 20,
} as const;

export function EmbedsManager({ owner, initial }: { owner: EmbedOwner; initial: EmbedRow[] }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<EmbedKind>("events");
  const [layout, setLayout] = useState<EmbedLayout>("list");
  const [theme, setTheme] = useState<EmbedTheme>("auto");
  const [itemLimit, setItemLimit] = useState(6);
  const [categories, setCategories] = useState<string[]>([]);
  const [origins, setOrigins] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const baseUrl = typeof window === "undefined" ? "" : window.location.origin;

  const toggleCategory = (slug: string) =>
    setCategories((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const parsedOrigins: string[] = [];
    for (const raw of origins.split(/[\s,]+/).filter(Boolean)) {
      const normalized = normalizeOrigin(raw);
      if (!normalized) {
        setError(`Ugyldig nettadresse: ${raw}. Bruk formen https://kommune.no`);
        return;
      }
      parsedOrigins.push(normalized);
    }

    setBusy(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error: insertError } = await supabase.from("embeds").insert({
      public_id: generatePublicId(),
      organization_id: owner.kind === "organization" ? owner.id : null,
      municipality_id: owner.kind === "municipality" ? owner.id : null,
      label: label.trim() || null,
      kind,
      layout,
      theme,
      item_limit: itemLimit,
      category_slugs: categories,
      allowed_origins: parsedOrigins,
      created_by: user?.id ?? null,
    });
    setBusy(false);
    if (insertError) {
      setError("Kunne ikke opprette widgeten. Prøv igjen.");
      return;
    }
    setLabel("");
    setOrigins("");
    setCategories([]);
    router.refresh();
  };

  const setActive = async (id: string, active: boolean) => {
    await supabase.from("embeds").update({ active }).eq("id", id);
    router.refresh();
  };

  const remove = async (id: string) => {
    if (!window.confirm("Slette widgeten? Innebygginger som bruker den slutter å virke.")) return;
    await supabase.from("embeds").delete().eq("id", id);
    router.refresh();
  };

  const copy = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <section style={{ ...card, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <h2 style={{ margin: "0 0 2px", fontSize: "var(--fs-h4)", fontWeight: 700 }}>Ny widget</h2>
          <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
            Widgeten viser bare publisert innhold som dere eier.
          </p>
        </div>

        <form onSubmit={create} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label htmlFor="embed-label" style={labelStyle}>Navn</label>
            <input
              id="embed-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="F.eks. forsiden på nettsiden"
              style={inputStyle}
            />
          </div>

          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend style={labelStyle}>Type</legend>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {KINDS.map((option) => (
                <label
                  key={option.value}
                  style={{
                    flex: "1 1 200px",
                    padding: 12,
                    borderRadius: "var(--radius-md)",
                    border: `1.5px solid ${kind === option.value ? "var(--border-brand)" : "var(--border-subtle)"}`,
                    background: kind === option.value ? "var(--surface-brand-soft)" : "transparent",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="embed-kind"
                    value={option.value}
                    checked={kind === option.value}
                    onChange={() => setKind(option.value)}
                    style={{ marginRight: 8 }}
                  />
                  <strong style={{ fontSize: "var(--fs-sm)" }}>{option.label}</strong>
                  <span style={{ display: "block", marginTop: 4, fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
                    {option.hint}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 150px" }}>
              <label htmlFor="embed-layout" style={labelStyle}>Visning</label>
              <select id="embed-layout" value={layout} onChange={(e) => setLayout(e.target.value as EmbedLayout)} style={inputStyle}>
                <option value="list">Liste</option>
                <option value="grid">Rutenett</option>
              </select>
            </div>
            <div style={{ flex: "1 1 150px" }}>
              <label htmlFor="embed-theme" style={labelStyle}>Tema</label>
              <select id="embed-theme" value={theme} onChange={(e) => setTheme(e.target.value as EmbedTheme)} style={inputStyle}>
                <option value="auto">Følg besøkendes tema</option>
                <option value="light">Lyst</option>
                <option value="dark">Mørkt</option>
              </select>
            </div>
            <div style={{ flex: "1 1 120px" }}>
              <label htmlFor="embed-limit" style={labelStyle}>Antall</label>
              <input
                id="embed-limit"
                type="number"
                min={1}
                max={24}
                value={itemLimit}
                onChange={(e) => setItemLimit(Math.min(24, Math.max(1, Number(e.target.value) || 1)))}
                style={inputStyle}
              />
            </div>
          </div>

          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend style={labelStyle}>Kategorier (tomt = alle)</legend>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {Object.entries(CATEGORIES).map(([slug, def]) => {
                const on = categories.includes(slug);
                return (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => toggleCategory(slug)}
                    aria-pressed={on}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 11px",
                      borderRadius: "var(--radius-pill)",
                      border: `1px solid ${on ? "var(--border-brand)" : "var(--border-subtle)"}`,
                      background: on ? def.bg : "transparent",
                      color: on ? def.fg : "var(--text-body)",
                      fontSize: "var(--fs-xs)",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Icon name={def.icon} size={14} />
                    {def.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label htmlFor="embed-origins" style={labelStyle}>Tillatte nettsteder (tomt = alle)</label>
            <input
              id="embed-origins"
              value={origins}
              onChange={(event) => setOrigins(event.target.value)}
              placeholder="https://kommune.no https://kultur.kommune.no"
              style={inputStyle}
            />
            <p style={{ margin: "6px 0 0", fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
              Bare disse nettstedene får vise widgeten. Skill flere med mellomrom.
            </p>
          </div>

          <div><Button type="submit" loading={busy} leadingIcon="plus">Lag widget</Button></div>
          {error && <p style={{ margin: 0, color: "var(--danger-text)", fontSize: "var(--fs-sm)" }}>{error}</p>}
        </form>
      </section>

      {initial.length === 0 ? (
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>Ingen widgets ennå.</p>
      ) : (
        initial.map((embed) => {
          const kindLabel = KINDS.find((k) => k.value === embed.kind)?.label ?? embed.kind;
          const snippet = embed.kind === "kiosk"
            ? `${baseUrl}/embed/${embed.public_id}/skjerm`
            : embedSnippet(baseUrl, embed.public_id);
          return (
            <section key={embed.id} style={{ ...card, display: "flex", flexDirection: "column", gap: 12, opacity: embed.active ? 1 : 0.6 }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "var(--fs-h4)", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon name="monitor" size={18} />
                    {embed.label || kindLabel}
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
                    {kindLabel} · {embed.item_limit} elementer · {embed.allowed_origins.length > 0 ? embed.allowed_origins.join(", ") : "alle nettsteder"}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Button variant="ghost" size="sm" onClick={() => setActive(embed.id, !embed.active)}>
                    {embed.active ? "Deaktiver" : "Aktiver"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(embed.id)}>Slett</Button>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <code style={{ flex: 1, minWidth: 0, overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all", padding: "10px 12px", borderRadius: "var(--radius-sm)", background: "var(--surface-sunk)", fontSize: "var(--fs-xs)" }}>
                  {snippet}
                </code>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leadingIcon={copied === embed.id ? "check" : "copy"}
                  onClick={() => copy(embed.id, snippet)}
                >
                  {copied === embed.id ? "Kopiert" : "Kopier"}
                </Button>
              </div>

              {embed.kind !== "kiosk" && (
                <details>
                  <summary style={{ cursor: "pointer", fontSize: "var(--fs-sm)", fontWeight: 600 }}>Uten JavaScript (fast høyde)</summary>
                  <code style={{ display: "block", marginTop: 8, padding: "10px 12px", borderRadius: "var(--radius-sm)", background: "var(--surface-sunk)", fontSize: "var(--fs-xs)", wordBreak: "break-all" }}>
                    {embedIframeSnippet(baseUrl, embed.public_id)}
                  </code>
                </details>
              )}

              <details>
                <summary style={{ cursor: "pointer", fontSize: "var(--fs-sm)", fontWeight: 600 }}>Forhåndsvisning</summary>
                <iframe
                  src={`${baseUrl}/embed/${embed.public_id}${embed.kind === "kiosk" ? "/skjerm" : ""}`}
                  title={`Forhåndsvisning: ${embed.label || kindLabel}`}
                  style={{ width: "100%", height: embed.kind === "kiosk" ? 480 : 380, marginTop: 8, border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}
                />
              </details>
            </section>
          );
        })
      )}
    </div>
  );
}
