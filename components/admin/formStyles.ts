import type { CSSProperties } from "react";

export const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "var(--tap-comfy)",
  padding: "0 14px",
  background: "var(--surface-card)",
  border: "1.5px solid var(--border-strong)",
  borderRadius: "var(--radius-md)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--fs-body)",
  color: "var(--text-strong)",
};

export const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: 6,
  fontSize: "var(--fs-sm)",
  fontWeight: 600,
  color: "var(--text-body)",
};

export const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: 84,
  padding: 14,
  lineHeight: 1.5,
};
