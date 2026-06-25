"use client";

import { useEffect, useState } from "react";
import { Icon, type IconName } from "./Icon";
import { useI18n } from "@/components/i18n/LocaleProvider";

type Theme = "auto" | "light" | "dark";

const OPTS: { value: Theme; icon: IconName }[] = [
  { value: "auto", icon: "monitor" },
  { value: "light", icon: "sun" },
  { value: "dark", icon: "moon" },
];

/** Auto / Lyst / Mørkt theme switch — writes data-theme + persists to localStorage. */
export function ThemeToggle() {
  const { t } = useI18n();
  const [theme, setTheme] = useState<Theme>("auto");

  useEffect(() => {
    // Read persisted theme after mount — localStorage is client-only, and a lazy
    // initializer would cause an SSR/client hydration mismatch on the toggle state.
    const stored = (localStorage.getItem("sdn-theme") as Theme | null) ?? "auto";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(stored);
  }, []);

  const apply = (t: Theme) => {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem("sdn-theme", t);
    } catch {
      // ignore storage failures (private mode)
    }
  };

  return (
    <div
      role="group"
      aria-label={t.theme.label}
      style={{
        display: "inline-flex",
        gap: 2,
        padding: 3,
        background: "var(--surface-sunk)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-pill)",
      }}
    >
      {OPTS.map((o) => {
        const active = o.value === theme;
        const label = t.theme[o.value];
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            aria-label={label}
            title={label}
            onClick={() => apply(o.value)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 34,
              height: 34,
              border: "none",
              borderRadius: "var(--radius-pill)",
              background: active ? "var(--surface-card)" : "transparent",
              color: active ? "var(--text-brand)" : "var(--text-muted)",
              boxShadow: active ? "var(--shadow-xs)" : "none",
              cursor: "pointer",
            }}
          >
            <Icon name={o.icon} size={17} />
          </button>
        );
      })}
    </div>
  );
}
