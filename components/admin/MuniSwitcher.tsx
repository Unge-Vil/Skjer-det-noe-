"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ds/Avatar";
import { Icon } from "@/components/ds/Icon";
import { setActiveMunicipality } from "@/app/actions/kommune";
import { useI18n } from "@/components/i18n/LocaleProvider";
import type { MuniRef } from "@/lib/kommune";

export function MuniSwitcher({ munis, activeId }: { munis: MuniRef[]; activeId: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const active = munis.find((m) => m.id === activeId) ?? munis[0];
  const multiple = munis.length > 1;

  const choose = (id: string) => {
    setOpen(false);
    if (id === activeId) return;
    startTransition(async () => {
      await setActiveMunicipality(id);
      router.refresh();
    });
  };

  const identity = (
    <>
      <Avatar name={active.name} size={40} />
      <div style={{ minWidth: 0, lineHeight: 1.25, flex: 1, textAlign: "left" }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {active.name}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.kommune.title}</div>
      </div>
    </>
  );

  if (!multiple) {
    return <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>{identity}</div>;
  }

  return (
    <div style={{ position: "relative", marginTop: 14 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: 6,
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-subtle)",
          background: "var(--surface-card)",
          cursor: "pointer",
          opacity: pending ? 0.6 : 1,
        }}
      >
        {identity}
        <Icon name="chevron-down" size={16} color="var(--text-muted)" />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 40,
            background: "var(--surface-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-md)",
            padding: 4,
          }}
        >
          {munis.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => choose(m.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                border: "none",
                borderRadius: "var(--radius-sm)",
                background: m.id === activeId ? "var(--fjord-50)" : "transparent",
                color: m.id === activeId ? "var(--fjord-700)" : "var(--text-body)",
                fontSize: "var(--fs-sm)",
                fontWeight: m.id === activeId ? 700 : 500,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <Avatar name={m.name} size={26} />
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
              {m.id === activeId && <Icon name="check" size={15} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
