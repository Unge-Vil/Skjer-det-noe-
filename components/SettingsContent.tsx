"use client";

import type { ReactNode } from "react";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { ThemeToggle } from "@/components/ds/ThemeToggle";
import { useI18n } from "@/components/i18n/LocaleProvider";

/** Shared settings body — used by the desktop dropdown and the mobile sheet.
 *  Add further accessibility controls here as new sections. */
export function SettingsContent() {
  const { t } = useI18n();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Section label={t.locale.label}>
        <LanguageToggle />
      </Section>
      <Section label={t.theme.label}>
        <ThemeToggle />
      </Section>
    </div>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span
        style={{
          fontSize: "var(--fs-xs)",
          fontWeight: 700,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}
