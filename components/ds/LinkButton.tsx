"use client";

import Link from "next/link";
import { useState, type ComponentProps, type CSSProperties } from "react";
import { BUTTON_SIZES, type ButtonSize, type ButtonVariant } from "./Button";
import { Icon, type IconName } from "./Icon";

const VARIANTS: Record<ButtonVariant, { background: string; color: string; border: string; hoverBg: string }> = {
  primary: { background: "var(--surface-brand-strong)", color: "#fff", border: "1px solid transparent", hoverBg: "var(--surface-brand-strong-hover)" },
  coral: { background: "var(--coral-600)", color: "#fff", border: "1px solid transparent", hoverBg: "var(--coral-700)" },
  secondary: { background: "var(--surface-card)", color: "var(--text-brand)", border: "1.5px solid var(--border-strong)", hoverBg: "var(--brand-hover-soft)" },
  ghost: { background: "transparent", color: "var(--text-brand)", border: "1px solid transparent", hoverBg: "var(--brand-hover-soft)" },
  danger: { background: "var(--danger-500)", color: "#fff", border: "1px solid transparent", hoverBg: "var(--danger-600)" },
};

interface LinkButtonProps extends Omit<ComponentProps<typeof Link>, "style"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: IconName;
  trailingIcon?: IconName;
  fullWidth?: boolean;
  style?: CSSProperties;
}

export function LinkButton({
  children,
  variant = "primary",
  size = "md",
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  style = {},
  ...rest
}: LinkButtonProps) {
  const [hover, setHover] = useState(false);
  const sizes = BUTTON_SIZES[size];
  const colors = VARIANTS[variant];

  return (
    <Link
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
        color: colors.color,
        background: hover ? colors.hoverBg : colors.background,
        border: colors.border,
        borderRadius: sizes.radius,
        textDecoration: "none",
        transform: hover ? "var(--lift)" : "none",
        boxShadow: hover && variant === "primary" ? "var(--shadow-brand)" : hover && variant === "coral" ? "var(--shadow-coral)" : "none",
        transition: "background var(--dur-fast) var(--ease-soft), transform var(--dur-fast) var(--ease-soft), box-shadow var(--dur-base) var(--ease-soft)",
        ...style,
      }}
      {...rest}
    >
      {leadingIcon && <Icon name={leadingIcon} size={sizes.icon} />}
      {children}
      {trailingIcon && <Icon name={trailingIcon} size={sizes.icon} />}
    </Link>
  );
}