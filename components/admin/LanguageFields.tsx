"use client";

import { useState, type ReactNode } from "react";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { Icon } from "@/components/ds/Icon";

/**
 * Norwegian-first language affordance. English fields stay hidden behind a
 * "+ Legg til engelsk" button; once opened they render inside a subtle framed
 * section with a "Fjern engelsk" action that clears the value(s) via `onRemove`.
 * Starts open when the English content already exists (`hasContent`).
 */
export function LanguageFields({
  hasContent,
  onRemove,
  children,
}: {
  hasContent: boolean;
  /** Clear the English value(s) so the collapsed state is truthful. */
  onRemove?: () => void;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(hasContent);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          alignSelf: "flex-start",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          borderRadius: "var(--radius-pill)",
          border: "1px dashed var(--border-strong)",
          background: "transparent",
          color: "var(--text-brand)",
          fontSize: "var(--fs-sm)",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        <Icon name="plus" size={16} />
        {t.form.addEnglish}
      </button>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 16,
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-subtle)",
        background: "var(--surface-sunk)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--text-body)" }}>
          {t.form.englishSection}
        </span>
        <button
          type="button"
          onClick={() => {
            onRemove?.();
            setOpen(false);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 8px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            background: "transparent",
            color: "var(--text-muted)",
            fontSize: "var(--fs-xs)",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Icon name="x" size={14} />
          {t.form.removeEnglish}
        </button>
      </div>
      {children}
    </div>
  );
}
