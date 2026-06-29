"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ds/Icon";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { inputStyle } from "./formStyles";

export interface CoOrg {
  id: string;
  name: string;
}

/** Search published organisations and pick co-organisers. Parent owns `value`. */
export function CoOrganizerEditor({
  value,
  onChange,
  excludeOrgId,
}: {
  value: CoOrg[];
  onChange: (next: CoOrg[]) => void;
  excludeOrgId: string;
}) {
  const { t } = useI18n();
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CoOrg[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    let active = true;
    const handle = setTimeout(async () => {
      if (q.length < 2) {
        if (active) setResults([]);
        return;
      }
      const { data } = await supabase
        .from("organizations")
        .select("id,name")
        .eq("status", "published")
        .ilike("name", `%${q}%`)
        .order("name")
        .limit(8);
      if (!active) return;
      const chosen = new Set([excludeOrgId, ...value.map((v) => v.id)]);
      setResults(((data as CoOrg[]) ?? []).filter((o) => !chosen.has(o.id)));
      setOpen(true);
    }, 250);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [query, value, excludeOrgId, supabase]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const add = (o: CoOrg) => {
    onChange([...value, o]);
    setQuery("");
    setResults([]);
    setOpen(false);
  };
  const remove = (id: string) => onChange(value.filter((v) => v.id !== id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {value.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {value.map((o) => (
            <span
              key={o.id}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 6px 4px 12px",
                borderRadius: "var(--radius-pill)",
                background: "var(--fjord-50)",
                color: "var(--fjord-700)",
                fontSize: "var(--fs-sm)",
                fontWeight: 600,
              }}
            >
              {o.name}
              <button
                type="button"
                onClick={() => remove(o.id)}
                aria-label={`${t.orgadmin.removeMember}: ${o.name}`}
                style={{ display: "inline-flex", border: "none", background: "transparent", cursor: "pointer", color: "inherit", padding: 2 }}
              >
                <Icon name="x" size={14} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div ref={boxRef} style={{ position: "relative" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder={t.form.coOrgSearch}
          style={inputStyle}
        />
        {open && results.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              zIndex: 40,
              background: "var(--surface-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-md)",
              padding: 4,
              maxHeight: 260,
              overflowY: "auto",
            }}
          >
            {results.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => add(o)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  background: "transparent",
                  color: "var(--text-body)",
                  fontSize: "var(--fs-sm)",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <Icon name="plus" size={14} color="var(--text-muted)" />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
