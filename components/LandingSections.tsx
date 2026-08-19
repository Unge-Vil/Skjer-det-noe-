"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import type { Listing } from "@/lib/types";
import { Icon } from "@/components/ds/Icon";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { ListingCard } from "./ListingCard";

const SAVED_KEY = "sdn-saved";

function Band({
  title,
  sub,
  actionLabel,
  actionHref,
  children,
}: {
  title: string;
  sub: string;
  actionLabel: string;
  actionHref: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pt-8">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div style={{ minWidth: 0, flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: "var(--fs-h3)", fontWeight: 800, letterSpacing: "-0.01em", textWrap: "pretty" }}>
            {title}
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
            {sub}
          </p>
        </div>
        <Link
          href={actionHref}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            whiteSpace: "nowrap",
            fontSize: "var(--fs-sm)",
            fontWeight: 600,
            color: "var(--text-brand)",
            textDecoration: "none",
          }}
        >
          {actionLabel} <Icon name="arrow-right" size={16} />
        </Link>
      </div>
      {children}
    </section>
  );
}

export function LandingSections({
  events,
  activities,
}: {
  events: Listing[];
  activities: Listing[];
}) {
  const { t } = useI18n();
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setSaved(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const toggleSave = useCallback((id: string) => {
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const empty = (
    <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.landing.empty}</p>
  );

  return (
    <>
      <Band
        title={t.landing.thisWeek}
        sub={t.landing.thisWeekSub}
        actionLabel={t.landing.allEvents}
        actionHref="/utforsk?type=event"
      >
        {events.length === 0 ? (
          empty
        ) : (
          <div className="sdn-stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <ListingCard key={e.id} listing={e} saved={saved.includes(e.id)} onToggleSave={toggleSave} />
            ))}
          </div>
        )}
      </Band>

      <Band
        title={t.landing.nearby}
        sub={t.landing.nearbySub}
        actionLabel={t.landing.seeMap}
        actionHref="/kart"
      >
        {activities.length === 0 ? (
          empty
        ) : (
          <div className="sdn-stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activities.map((a) => (
              <ListingCard key={a.id} listing={a} saved={saved.includes(a.id)} onToggleSave={toggleSave} />
            ))}
          </div>
        )}
      </Band>
    </>
  );
}
