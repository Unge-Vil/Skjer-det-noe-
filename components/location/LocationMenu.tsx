"use client";

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ds/Button";
import { Icon } from "@/components/ds/Icon";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { findMunicipality } from "@/lib/location";
import { useLocation } from "./LocationProvider";

export function LocationMenu() {
  const { t } = useI18n();
  const location = useLocation();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const selected = findMunicipality(location.municipalities, location.selectedMunicipality);
  const defaultMunicipality = findMunicipality(location.municipalities, location.defaultMunicipality);
  const activeName = location.mode === "nearby"
    ? location.currentMunicipality?.name ?? t.location.nearMe
    : selected?.name ?? defaultMunicipality?.name ?? t.location.chooseMunicipality;

  const close = useCallback(() => {
    location.closeMenu();
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, [location]);

  useEffect(() => {
    if (!location.menuOpen) return;
    panelRef.current?.querySelector<HTMLElement>("button, select, [href]")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [location.menuOpen, close]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={location.menuOpen}
        onClick={() => location.menuOpen ? location.closeMenu() : location.openMenu()}
        className="flex max-w-[170px] items-center gap-2 sm:max-w-[220px]"
        style={{
          minHeight: 40,
          padding: "0 12px",
          borderRadius: "var(--radius-pill)",
          border: "1.5px solid var(--border-strong)",
          background: location.menuOpen ? "var(--surface-brand-soft)" : "var(--surface-card)",
          color: "var(--text-brand)",
          cursor: "pointer",
        }}
      >
        <Icon name={location.mode === "nearby" ? "locate-fixed" : "map-pin"} size={17} />
        <span className="truncate" style={{ fontSize: "var(--fs-sm)", fontWeight: 650 }}>{activeName}</span>
        <Icon name="chevron-down" size={15} />
      </button>

      {location.menuOpen && typeof document !== "undefined" && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.location.title}
          className="fixed inset-0 flex items-end justify-center p-3 pb-[84px] sm:items-center sm:pb-3"
          style={{ zIndex: 39 }}
        >
          <button
            type="button"
            aria-label={t.nav.close}
            onClick={close}
            className="absolute inset-0"
            style={{ border: 0, background: "rgba(8,52,51,0.28)" }}
          />
          <div
            ref={panelRef}
            className="sdn-sheet relative w-full max-w-[370px]"
            style={{
              zIndex: 1,
              padding: 20,
              paddingBottom: "calc(20px + env(safe-area-inset-bottom))",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              background: "var(--surface-card)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 style={{ margin: 0, fontSize: "var(--fs-h4)", fontWeight: 750 }}>{t.location.title}</h2>
                <p style={{ margin: "2px 0 0", color: "var(--text-muted)", fontSize: "var(--fs-xs)" }}>
                  {t.location.notStored}
                </p>
              </div>
              <button
                type="button"
                aria-label={t.nav.close}
                onClick={close}
                style={{ width: 40, height: 40, borderRadius: "var(--radius-pill)", border: "1px solid var(--border-subtle)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2" role="group" aria-label={t.location.mode}>
              <Button
                variant={location.mode === "nearby" ? "primary" : "secondary"}
                leadingIcon="locate-fixed"
                onClick={location.requestLocation}
                loading={location.locating}
                fullWidth
              >
                {t.location.nearMe}
              </Button>
              <Button
                variant={location.mode === "municipality" ? "primary" : "secondary"}
                leadingIcon="map-pin"
                onClick={() => location.setMode("municipality")}
                fullWidth
              >
                {t.location.municipality}
              </Button>
            </div>

            {location.error && (
              <p role="alert" style={{ margin: "10px 0 0", color: "var(--danger-text)", fontSize: "var(--fs-sm)" }}>
                {location.error}
              </p>
            )}

            <label className="mt-4 block" style={{ fontSize: "var(--fs-sm)", fontWeight: 650 }}>
              {t.location.chooseMunicipality}
              <select
                value={location.selectedMunicipality ?? ""}
                onChange={(event) => location.selectMunicipality(event.target.value)}
                style={{ width: "100%", minHeight: 44, marginTop: 6, padding: "0 12px", border: "1.5px solid var(--border-strong)", borderRadius: "var(--radius-md)", background: "var(--surface-card)", color: "var(--text-strong)" }}
              >
                <option value="" disabled>{t.location.chooseMunicipality}</option>
                {location.municipalities.map((municipality) => (
                  <option key={municipality.id} value={municipality.kommunenummer}>{municipality.name}</option>
                ))}
              </select>
            </label>

            {selected && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant={location.defaultMunicipality === selected.kommunenummer ? "ghost" : "secondary"}
                  onClick={() => location.setDefaultMunicipality(selected.kommunenummer)}
                  disabled={location.defaultMunicipality === selected.kommunenummer}
                >
                  {location.defaultMunicipality === selected.kommunenummer ? t.location.isDefault : t.location.setDefault}
                </Button>
                <Link href={`/kommune/${selected.slug}`} onClick={close} style={{ color: "var(--text-link)", fontSize: "var(--fs-sm)", fontWeight: 650 }}>
                  {t.location.openMunicipality}
                </Link>
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
