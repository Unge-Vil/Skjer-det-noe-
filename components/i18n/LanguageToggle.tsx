"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LOCALES, type Locale } from "@/lib/i18n/config";
import { setLocale } from "@/app/actions/locale";
import { useI18n } from "./LocaleProvider";

const LABELS: Record<Locale, string> = { nb: "NO", en: "EN" };

/** Compact Norsk/English switch — persists a cookie and re-renders. */
export function LanguageToggle() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const choose = (next: Locale) => {
    if (next === locale) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  };

  return (
    <div
      role="group"
      aria-label={t.locale.label}
      style={{
        display: "inline-flex",
        gap: 2,
        padding: 3,
        background: "var(--surface-sunk)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-pill)",
        opacity: pending ? 0.6 : 1,
      }}
    >
      {LOCALES.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            aria-pressed={active}
            onClick={() => choose(l)}
            style={{
              minWidth: 34,
              height: 34,
              padding: "0 8px",
              border: "none",
              borderRadius: "var(--radius-pill)",
              background: active ? "var(--surface-card)" : "transparent",
              color: active ? "var(--text-brand)" : "var(--text-muted)",
              boxShadow: active ? "var(--shadow-xs)" : "none",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-sm)",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {LABELS[l]}
          </button>
        );
      })}
    </div>
  );
}
