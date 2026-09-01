"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ds/Button";
import { Icon } from "@/components/ds/Icon";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { useLocation } from "./LocationProvider";

const COOKIE_CONSENT_KEY = "sdn-cookie-consent";

export function LocationPrimer() {
  const { t } = useI18n();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [defaultPromptDismissed, setDefaultPromptDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (location.primerSeen) return;
    queueMicrotask(() => {
      try {
        if (localStorage.getItem(COOKIE_CONSENT_KEY)) setVisible(true);
      } catch {
        setVisible(true);
      }
    });
  }, [location.primerSeen]);

  const canSuggestDefault = Boolean(
    location.primerSeen &&
    location.currentMunicipality?.id &&
    !location.defaultMunicipality &&
    !defaultPromptDismissed,
  );

  const dialogOpen = mounted && visible && !location.primerSeen && !canSuggestDefault;

  useEffect(() => {
    if (!dialogOpen) return;
    dialogRef.current?.querySelector<HTMLElement>("button, [href], input, select, textarea")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        location.markPrimerSeen();
        setVisible(false);
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
        ),
      ).filter((el) => el.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [dialogOpen, location]);

  if (!mounted || ((!visible || location.primerSeen) && !canSuggestDefault)) return null;

  const finish = () => {
    location.markPrimerSeen();
    setVisible(false);
  };

  const usePosition = () => {
    finish();
    location.requestLocation();
  };

  const chooseMunicipality = () => {
    finish();
    location.openMenu();
  };

  if (canSuggestDefault && location.currentMunicipality) {
    return createPortal(
      <aside
        role="status"
        className="sdn-sheet fixed inset-x-3 bottom-[84px] mx-auto max-w-[520px] sm:bottom-4"
        style={{ zIndex: 35, padding: 16, border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", background: "var(--surface-card)", boxShadow: "var(--shadow-lg)" }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Icon name="map-pin" size={20} color="var(--text-brand)" />
          <p style={{ margin: 0, flex: "1 1 230px", color: "var(--text-body)", fontSize: "var(--fs-sm)" }}>
            {t.location.defaultPrompt.replace("{place}", location.currentMunicipality.name)}
          </p>
          <Button
            size="sm"
            onClick={() => {
              location.setDefaultMunicipality(location.currentMunicipality!.kommunenummer);
              setDefaultPromptDismissed(true);
            }}
          >
            {t.location.setDefault}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDefaultPromptDismissed(true)}>{t.location.notNow}</Button>
        </div>
      </aside>,
      document.body,
    );
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-primer-title"
      className="fixed inset-0 flex items-end justify-center p-3 pb-[84px] sm:items-center sm:pb-3"
      style={{ zIndex: 38 }}
    >
      <button
        type="button"
        aria-label={t.nav.close}
        onClick={finish}
        className="absolute inset-0"
        style={{ border: 0, background: "rgba(8,52,51,0.3)" }}
      />
      <section
        ref={dialogRef}
        className="sdn-sheet relative w-full max-w-[520px]"
        style={{
          zIndex: 1,
          padding: 24,
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          background: "var(--surface-card)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div className="mb-4 flex items-start gap-3">
          <span style={{ display: "inline-flex", width: 44, height: 44, flex: "none", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-pill)", background: "var(--surface-brand-soft)", color: "var(--text-brand)" }}>
            <Icon name="locate-fixed" size={22} />
          </span>
          <div>
            <h2 id="location-primer-title" style={{ margin: 0, fontSize: "var(--fs-h3)", fontWeight: 800 }}>{t.location.primerTitle}</h2>
            <p style={{ margin: "6px 0 0", color: "var(--text-body)", lineHeight: 1.5 }}>{t.location.primerBody}</p>
          </div>
        </div>
        <p style={{ margin: "0 0 18px", color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
          {t.location.primerPrivacy}{" "}
          <Link href="/personvern" style={{ color: "var(--text-link)", fontWeight: 650 }}>{t.cookie.more}</Link>
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="coral" leadingIcon="locate-fixed" onClick={usePosition}>{t.location.usePosition}</Button>
          <Button variant="secondary" onClick={chooseMunicipality}>{t.location.chooseMunicipality}</Button>
          <Button variant="ghost" onClick={finish}>{t.location.notNow}</Button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
