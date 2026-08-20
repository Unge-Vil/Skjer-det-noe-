"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { categoryDef } from "@/components/ds/categories";
import { Icon } from "@/components/ds/Icon";
import { Wordmark } from "@/components/ds/Wordmark";
import { formatEventDate, formatTimeRange, weekdayName } from "@/lib/format";
import type { EmbedItem } from "@/lib/embeds";

const PER_SCREEN = 4;
const ROTATE_MS = 12000;
const REFRESH_MS = 300000;

function when(item: EmbedItem): string | null {
  if (item.kind === "event") return item.startsAt ? formatEventDate(item.startsAt, "nb") : null;
  const day = weekdayName(item.weekday, "nb");
  const time = formatTimeRange(item.startTime, item.endTime);
  return [day, time].filter(Boolean).join(" ") || item.recurrenceNote;
}

export function KioskView({ items, ownerName }: { items: EmbedItem[]; ownerName: string | null }) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [clock, setClock] = useState("");
  const pages = Math.max(1, Math.ceil(items.length / PER_SCREEN));

  useEffect(() => {
    const tick = () => setClock(new Intl.DateTimeFormat("nb-NO", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date()));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (pages < 2) return;
    const id = setInterval(() => setPage((p) => (p + 1) % pages), ROTATE_MS);
    return () => clearInterval(id);
  }, [pages]);

  useEffect(() => {
    const id = setInterval(() => router.refresh(), REFRESH_MS);
    return () => clearInterval(id);
  }, [router]);

  const visible = items.slice(page * PER_SCREEN, page * PER_SCREEN + PER_SCREEN);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", gap: 24, padding: "clamp(20px, 3vw, 48px)", background: "var(--bg-app)", color: "var(--text-body)" }}>
      <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
        <h1 style={{ margin: 0, fontSize: "clamp(28px, 3.4vw, 56px)", fontWeight: 900, color: "var(--text-strong)" }}>
          {ownerName ? `Hva skjer hos ${ownerName}?` : "Hva skjer?"}
        </h1>
        <span style={{ fontSize: "clamp(14px, 1.4vw, 24px)", color: "var(--text-muted)", textTransform: "capitalize" }}>{clock}</span>
      </header>
      {visible.length === 0 ? (
        <p style={{ fontSize: "clamp(18px, 2vw, 32px)", color: "var(--text-muted)" }}>Ingen kommende arrangementer.</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
          {visible.map((item) => {
            const category = categoryDef(item.categorySlug);
            return (
              <li key={`${item.kind}-${item.id}`} style={{ display: "flex", alignItems: "center", gap: 20, padding: "clamp(14px, 1.6vw, 28px)", borderRadius: "var(--radius-lg)", background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
                <span style={{ flexShrink: 0, width: "clamp(48px, 5vw, 88px)", height: "clamp(48px, 5vw, 88px)", borderRadius: "var(--radius-md)", background: category.bg, display: "grid", placeItems: "center" }}>
                  <Icon name={category.icon} size={36} color={category.fg} />
                </span>
                <span style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                  <strong style={{ fontSize: "clamp(20px, 2.2vw, 40px)", color: "var(--text-strong)" }}>{item.title}</strong>
                  <span style={{ fontSize: "clamp(15px, 1.5vw, 26px)", color: "var(--text-brand)", fontWeight: 700 }}>{when(item)}</span>
                  <span style={{ fontSize: "clamp(13px, 1.2vw, 22px)", color: "var(--text-muted)" }}>
                    {[item.organizationName, item.address].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <footer style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <Wordmark size={20} withMark />
        {pages > 1 && (
          <div style={{ display: "flex", gap: 8 }} aria-hidden>
            {Array.from({ length: pages }, (_, i) => (
              <span key={i} style={{ width: 10, height: 10, borderRadius: "var(--radius-pill)", background: i === page ? "var(--accent)" : "var(--border-subtle)" }} />
            ))}
          </div>
        )}
      </footer>
    </div>
  );
}
