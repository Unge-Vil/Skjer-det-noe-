"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

/** Toggleable filter pill — selected shows a check + fjord fill + aria-pressed. */
export function FilterChip({
  children,
  selected = false,
  leadingIcon,
  onClick,
  style = {},
}: {
  children: ReactNode;
  selected?: boolean;
  leadingIcon?: IconName;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        minHeight: 40,
        padding: "0 16px",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--fs-sm)",
        fontWeight: "var(--fw-semibold)",
        color: selected ? "#fff" : "var(--text-strong)",
        background: selected
          ? "var(--surface-brand-strong)"
          : hover
            ? "var(--brand-hover-soft)"
            : "var(--surface-card)",
        border: `1.5px solid ${selected ? "var(--surface-brand-strong)" : "var(--border-strong)"}`,
        borderRadius: "var(--radius-pill)",
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "background var(--dur-fast), border-color var(--dur-fast)",
        ...style,
      }}
    >
      {selected && <Icon name="check" size={16} />}
      {!selected && leadingIcon && <Icon name={leadingIcon} size={16} />}
      {children}
    </button>
  );
}
