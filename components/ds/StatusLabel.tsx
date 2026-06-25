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
  sol: { bg: "var(--sol-200)", fg: "#6b4e00" },
  brand: { bg: "var(--fjord-50)", fg: "var(--fjord-700)" },
  neutral: { bg: "var(--stone-100)", fg: "var(--stone-700)" },
  success: { bg: "var(--success-50)", fg: "var(--success-600)" },
  danger: { bg: "var(--danger-50)", fg: "var(--danger-600)" },
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
