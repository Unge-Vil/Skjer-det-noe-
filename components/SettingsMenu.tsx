"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ds/Icon";
import { SettingsContent } from "./SettingsContent";
import { useI18n } from "@/components/i18n/LocaleProvider";

/** Desktop settings dropdown: a gear button revealing language/theme controls. */
export function SettingsMenu() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        aria-label={t.nav.settings}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: "var(--radius-pill)",
          border: "1.5px solid var(--border-strong)",
          background: open ? "var(--surface-brand-soft)" : "var(--surface-card)",
          color: "var(--text-brand)",
          cursor: "pointer",
        }}
      >
        <Icon name="settings" size={18} />
      </button>
      {open && (
        <div
          role="menu"
          className="sdn-pop"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            zIndex: 40,
            minWidth: 240,
            padding: 16,
            background: "var(--surface-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <SettingsContent />
        </div>
      )}
    </div>
  );
}
