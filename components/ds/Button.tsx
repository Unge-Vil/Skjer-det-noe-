"use client";

import { useState, type ButtonHTMLAttributes, type CSSProperties } from "react";
import { Icon, type IconName } from "./Icon";

type Variant = "primary" | "coral" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, { height: number | string; padding: string; font: string; radius: string; gap: number; icon: number }> = {
  sm: { height: 38, padding: "0 14px", font: "var(--fs-sm)", radius: "var(--radius-sm)", gap: 6, icon: 16 },
  md: { height: "var(--tap-comfy)", padding: "0 20px", font: "var(--fs-body)", radius: "var(--radius-md)", gap: 8, icon: 20 },
  lg: { height: 56, padding: "0 28px", font: "var(--fs-body-lg)", radius: "var(--radius-md)", gap: 10, icon: 22 },
};

const VARIANTS: Record<Variant, { background: string; color: string; border: string; hoverBg: string }> = {
  primary: { background: "var(--surface-brand-strong)", color: "#fff", border: "1px solid transparent", hoverBg: "var(--surface-brand-strong-hover)" },
  coral: { background: "var(--coral-600)", color: "#fff", border: "1px solid transparent", hoverBg: "var(--coral-700)" },
  secondary: { background: "var(--surface-card)", color: "var(--text-brand)", border: "1.5px solid var(--border-strong)", hoverBg: "var(--brand-hover-soft)" },
  ghost: { background: "transparent", color: "var(--text-brand)", border: "1px solid transparent", hoverBg: "var(--brand-hover-soft)" },
  danger: { background: "var(--danger-500)", color: "#fff", border: "1px solid transparent", hoverBg: "var(--danger-600)" },
};

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "style"> {
  variant?: Variant;
  size?: Size;
  leadingIcon?: IconName;
  trailingIcon?: IconName;
  fullWidth?: boolean;
  loading?: boolean;
  style?: CSSProperties;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  disabled = false,
  loading = false,
  type = "button",
  style = {},
  ...rest
}: ButtonProps) {
  const sizes = SIZES[size];
  const variants = VARIANTS[variant];
  const [hover, setHover] = useState(false);
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: sizes.gap,
        width: fullWidth ? "100%" : "auto",
        minHeight: sizes.height,
        height: sizes.height,
        padding: sizes.padding,
        fontFamily: "var(--font-sans)",
        fontSize: sizes.font,
        fontWeight: "var(--fw-semibold)",
        lineHeight: 1,
        color: isDisabled ? "var(--stone-500)" : variants.color,
        background: isDisabled ? "var(--stone-200)" : hover ? variants.hoverBg : variants.background,
        border: isDisabled ? "1px solid transparent" : variants.border,
        borderRadius: sizes.radius,
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.65 : 1,
        transform: hover && !isDisabled ? "var(--lift)" : "none",
        boxShadow:
          hover && !isDisabled && variant === "primary"
            ? "var(--shadow-brand)"
            : hover && !isDisabled && variant === "coral"
              ? "var(--shadow-coral)"
              : "none",
        transition:
          "background var(--dur-fast) var(--ease-soft), transform var(--dur-fast) var(--ease-soft), box-shadow var(--dur-base) var(--ease-soft)",
        ...style,
      }}
      {...rest}
    >
      {loading && <Icon name="loader-circle" size={sizes.icon} className="sdn-spin" />}
      {!loading && leadingIcon && <Icon name={leadingIcon} size={sizes.icon} />}
      {children}
      {!loading && trailingIcon && <Icon name={trailingIcon} size={sizes.icon} />}
    </button>
  );
}
