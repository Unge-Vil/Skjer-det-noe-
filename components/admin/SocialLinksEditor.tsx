"use client";

import { SocialIcon } from "@/components/ds/SocialIcon";
import { SOCIAL_PLATFORMS, type SocialLinks, type SocialKey } from "@/components/ds/socials";
import { inputStyle } from "./formStyles";

/** Controlled editor for the social-links map. Parent owns the state and save. */
export function SocialLinksEditor({
  value,
  onChange,
}: {
  value: SocialLinks;
  onChange: (next: SocialLinks) => void;
}) {
  const set = (key: SocialKey, url: string) => {
    const next = { ...value };
    if (url.trim()) next[key] = url;
    else delete next[key];
    onChange(next);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {SOCIAL_PLATFORMS.map((p) => (
        <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            aria-hidden="true"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              flexShrink: 0,
              borderRadius: "var(--radius-sm)",
              background: "var(--surface-sunk)",
              color: "var(--text-muted)",
            }}
          >
            <SocialIcon name={p.key} size={18} />
          </span>
          <input
            type="url"
            inputMode="url"
            aria-label={p.label}
            placeholder={p.placeholder}
            value={value[p.key] ?? ""}
            onChange={(e) => set(p.key, e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
        </div>
      ))}
    </div>
  );
}
