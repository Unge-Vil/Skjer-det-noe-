"use client";

import type { CSSProperties } from "react";
import { Icon, type IconName } from "./Icon";

export type MapListView = "list" | "map";

const OPTS: { value: MapListView; label: string; icon: IconName }[] = [
  { value: "list", label: "Liste", icon: "list" },
  { value: "map", label: "Kart", icon: "map" },
];

/** Mandatory list/map pairing — a map view always offers a list alternative. */
export function MapListToggle({
  value = "list",
  onChange,
  style = {},
}: {
  value?: MapListView;
  onChange?: (v: MapListView) => void;
  style?: CSSProperties;
}) {
  return (
    <div
      role="group"
      aria-label="Velg visning"
      style={{
        display: "inline-flex",
        gap: 4,
        padding: 4,
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-pill)",
        boxShadow: "var(--shadow-xs)",
        ...style,
      }}
    >
      {OPTS.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange?.(o.value)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              minHeight: 40,
              padding: "0 18px",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-sm)",
              fontWeight: "var(--fw-semibold)",
              color: active ? "#fff" : "var(--text-body)",
              background: active ? "var(--surface-brand-strong)" : "transparent",
              border: "none",
              borderRadius: "var(--radius-pill)",
              cursor: "pointer",
              transition: "background var(--dur-fast), color var(--dur-fast)",
            }}
          >
            <Icon name={o.icon} size={17} />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
