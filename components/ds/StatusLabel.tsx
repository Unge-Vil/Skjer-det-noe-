"use client";

import type { CSSProperties } from "react";
import { Icon, type IconName } from "./Icon";
import { useI18n } from "@/components/i18n/LocaleProvider";

type Tone = "sol" | "brand" | "neutral" | "success" | "danger";

export type StatusKind =
  | "free"
  | "paid"
  | "dropin"
  | "registration"
  | "beginners"
  | "accessible"
  | "full"
  | "cancelled";

// Icon + tone per kind; the visible label is localized from the dictionary.
const PRESETS: Record<StatusKind, { icon: IconName; tone: Tone }> = {
  free: { icon: "tag", tone: "sol" },
  paid: { icon: "wallet", tone: "neutral" },
  dropin: { icon: "door-open", tone: "brand" },
  registration: { icon: "clipboard-list", tone: "neutral" },
  beginners: { icon: "sparkles", tone: "success" },
  accessible: { icon: "accessibility", tone: "brand" },
  full: { icon: "user-x", tone: "danger" },
  cancelled: { icon: "ban", tone: "danger" },
};

const TONES: Record<Tone, { bg: string; fg: string }> = {
  sol: { bg: "var(--status-sol-bg)", fg: "var(--status-sol-text)" },
  brand: { bg: "var(--status-brand-bg)", fg: "var(--status-brand-text)" },
  neutral: { bg: "var(--status-neutral-bg)", fg: "var(--status-neutral-text)" },
  success: { bg: "var(--status-success-bg)", fg: "var(--status-success-text)" },
  danger: { bg: "var(--status-danger-bg)", fg: "var(--status-danger-text)" },
};

/** Accessible status pill — always icon + text, never colour alone. */
export function StatusLabel({
  kind,
  icon,
  label,
  tone,
  size = "md",
  style = {},
}: {
  kind?: StatusKind;
  icon?: IconName;
  label?: string;
  tone?: Tone;
  size?: "sm" | "md";
  style?: CSSProperties;
}) {
  const { t } = useI18n();
  const preset = kind ? PRESETS[kind] : null;
  const _icon = icon || preset?.icon;
  const _label = label || (kind ? t.status[kind] : undefined);
  const _tone = TONES[tone || preset?.tone || "neutral"];
  const dims =
    size === "sm"
      ? { pad: "3px 9px", font: "var(--fs-xs)", icon: 13, gap: 4 }
      : { pad: "5px 12px", font: "var(--fs-sm)", icon: 15, gap: 5 };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: dims.gap,
        padding: dims.pad,
        fontFamily: "var(--font-sans)",
        fontSize: dims.font,
        fontWeight: "var(--fw-semibold)",
        lineHeight: 1.1,
        color: _tone.fg,
        background: _tone.bg,
        borderRadius: "var(--radius-pill)",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {_icon && <Icon name={_icon} size={dims.icon} />}
      {_label}
    </span>
  );
}
