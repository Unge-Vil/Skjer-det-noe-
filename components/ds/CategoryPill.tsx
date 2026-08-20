"use client";

import type { CSSProperties } from "react";
import { Icon } from "./Icon";
import { categoryDef } from "./categories";
import { useI18n } from "@/components/i18n/LocaleProvider";

/** Category label with its icon + colour pair. Colour reinforces; icon + text carry meaning. */
export function CategoryPill({
  category,
  label,
  size = "md",
  solid = false,
  style = {},
}: {
  category: string | null | undefined;
  label?: string;
  size?: "sm" | "md";
  solid?: boolean;
  style?: CSSProperties;
}) {
  const { t } = useI18n();
  const c = categoryDef(category);
  const localized =
    category && category in t.categories
      ? t.categories[category as keyof typeof t.categories]
      : c.label;
  const dims =
    size === "sm"
      ? { pad: "3px 10px", font: "var(--fs-xs)", icon: 13, gap: 5 }
      : { pad: "6px 14px", font: "var(--fs-sm)", icon: 16, gap: 6 };
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
        color: solid ? "var(--text-on-brand)" : c.fg,
        background: solid ? c.fg : c.bg,
        borderRadius: "var(--radius-pill)",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      <Icon name={c.icon} size={dims.icon} />
      {label || localized}
    </span>
  );
}
