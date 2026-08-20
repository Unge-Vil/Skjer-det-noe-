"use client";

import { useState, type ButtonHTMLAttributes, type CSSProperties } from "react";
import { Icon, type IconName } from "./Icon";

type Variant = "ghost" | "solid" | "outline";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, { background: string; color: string; border: string; hoverBg: string }> = {
  ghost: { background: "transparent", color: "var(--text-brand)", border: "1px solid transparent", hoverBg: "var(--brand-hover-soft)" },
  solid: { background: "var(--surface-brand-strong)", color: "var(--text-on-brand)", border: "1px solid transparent", hoverBg: "var(--surface-brand-strong-hover)" },
  outline: { background: "var(--surface-card)", color: "var(--text-brand)", border: "1.5px solid var(--border-strong)", hoverBg: "var(--brand-hover-soft)" },
};

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "style"> {
  icon: IconName;
  label: string;
  variant?: Variant;
  size?: Size;
  fill?: string;
  style?: CSSProperties;
}

export function IconButton({
  icon,
  label,
  variant = "ghost",
  size = "md",
  disabled = false,
  fill,
  style = {},
  ...rest
}: IconButtonProps) {
  const dim = { sm: 38, md: 44, lg: 52 }[size];
  const iconSize = { sm: 18, md: 20, lg: 24 }[size];
  const variants = VARIANTS[variant];
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: dim,
        height: dim,
        flex: "none",
        color: disabled ? "var(--control-disabled-text)" : variants.color,
        background: disabled ? "var(--control-disabled-bg)" : hover ? variants.hoverBg : variants.background,
        border: disabled ? "1px solid var(--control-disabled-border)" : variants.border,
        borderRadius: "var(--radius-pill)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: 1,
        transition: "background var(--dur-fast) var(--ease-soft)",
        ...style,
      }}
      {...rest}
    >
      <Icon name={icon} size={iconSize} fill={fill} />
      <span className="sr-only">{label}</span>
    </button>
  );
}
