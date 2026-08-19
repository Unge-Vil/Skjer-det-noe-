"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ds/Button";
import { useI18n } from "@/components/i18n/LocaleProvider";

const KEY = "sdn-cookie-consent";

/** Lightweight informational cookie notice. We only use functional cookies, so
 *  this is acknowledgement-only (no granular consent needed). */
export function CookieBanner() {
  const { t } = useI18n();
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      // ignore
    }
  }, []);

  if (!show) return null;

  const accept = () => {
    try {
      localStorage.setItem(KEY, new Date().toISOString());
    } catch {
      // ignore
    }
    setShow(false);
    window.dispatchEvent(new Event("sdn:cookie-consent"));
  };

  return (
    <div
      role="region"
      aria-label={t.footer.privacy}
      className="sdn-sheet bottom-[84px] sm:bottom-3"
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        zIndex: 35,
        maxWidth: 520,
        margin: "0 auto",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <p style={{ margin: 0, flex: "1 1 240px", fontSize: "var(--fs-sm)", color: "var(--text-body)" }}>
        {t.cookie.body}{" "}
        <Link href="/personvern" style={{ color: "var(--text-link)", fontWeight: 600 }}>
          {t.cookie.more}
        </Link>
      </p>
      <Button size="sm" onClick={accept}>{t.cookie.accept}</Button>
    </div>
  );
}
