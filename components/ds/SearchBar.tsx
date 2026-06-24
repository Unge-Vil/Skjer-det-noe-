"use client";

import { useState, type CSSProperties } from "react";
import { Icon } from "./Icon";

/** Public discovery search — large target, leading icon, optional scope pill. */
export function SearchBar({
  placeholder = "Søk etter aktiviteter…",
  value,
  onChange,
  onSubmit,
  scope,
  style = {},
}: {
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
  onSubmit?: (v: string | undefined) => void;
  scope?: string;
  style?: CSSProperties;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(value);
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        height: 56,
        padding: "0 8px 0 16px",
        background: "var(--surface-card)",
        border: `2px solid ${focus ? "var(--fjord-500)" : "var(--border-strong)"}`,
        borderRadius: "var(--radius-pill)",
        boxShadow: focus ? "0 0 0 4px var(--focus-glow)" : "var(--shadow-sm)",
        transition: "border-color var(--dur-fast), box-shadow var(--dur-fast)",
        ...style,
      }}
    >
      <Icon name="search" size={22} color="var(--text-muted)" />
      {scope && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 12px",
            background: "var(--surface-brand-soft)",
            color: "var(--text-brand)",
            fontSize: "var(--fs-sm)",
            fontWeight: "var(--fw-semibold)",
            borderRadius: "var(--radius-pill)",
            whiteSpace: "nowrap",
          }}
        >
          <Icon name="map-pin" size={15} />
          {scope}
        </span>
      )}
      <input
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          flex: 1,
          minWidth: 0,
          height: "100%",
          border: "none",
          outline: "none",
          background: "transparent",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-body)",
          color: "var(--text-strong)",
        }}
      />
      <button
        type="submit"
        aria-label="Søk"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 44,
          height: 44,
          flex: "none",
          borderRadius: "var(--radius-pill)",
          border: "none",
          background: "var(--surface-brand-strong)",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        <Icon name="arrow-right" size={20} color="#fff" />
      </button>
    </form>
  );
}
