"use client";

import { useState } from "react";
import Image from "next/image";
import type { Listing } from "@/lib/types";
import { formatDistance, formatTimeRange, weekdayName } from "@/lib/format";
import { Icon, type IconName } from "@/components/ds/Icon";
import { CategoryPill } from "@/components/ds/CategoryPill";
import { StatusLabel, type StatusKind } from "@/components/ds/StatusLabel";
import { categoryDef } from "@/components/ds/categories";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { fmt, INTL_LOCALE } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/nb";

function priceStatus(price: string | null): StatusKind | null {
  if (!price) return null;
  return /gratis|free/i.test(price) ? "free" : "paid";
}

function ageLabel(
  min: number | null,
  max: number | null,
  t: Dictionary,
): string | null {
  if (min != null && max != null) return fmt(t.card.ageRange, { min, max });
  if (min != null) return fmt(t.card.ageFrom, { min });
  if (max != null) return fmt(t.card.ageTo, { max });
  return null;
}

function MetaRow({ icon, text }: { icon: IconName; text: string }) {
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: "var(--fs-sm)",
        color: "var(--text-body)",
      }}
    >
      <Icon name={icon} size={16} color="var(--text-muted)" />
      {text}
    </span>
  );
}

function SaveButton({
  saved,
  onToggle,
  floating,
}: {
  saved: boolean;
  onToggle: () => void;
  floating?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? "Fjern fra favoritter" : "Lagre i favoritter"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      style={{
        position: floating ? "absolute" : "relative",
        zIndex: 1,
        top: floating ? 10 : undefined,
        right: floating ? 10 : undefined,
        flex: "none",
        width: 40,
        height: 40,
        alignSelf: "flex-start",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: "none",
        borderRadius: "var(--radius-pill)",
        background: floating ? "rgba(255,255,255,0.92)" : "transparent",
        color: saved ? "var(--coral-600)" : "var(--stone-500)",
        cursor: "pointer",
        boxShadow: floating ? "var(--shadow-sm)" : "none",
      }}
    >
      <Icon name="heart" size={20} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}

export function ListingCard({
  listing,
  active,
  saved = false,
  onHover,
  onSelect,
  onToggleSave,
}: {
  listing: Listing;
  active?: boolean;
  saved?: boolean;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string) => void;
  onToggleSave?: (id: string) => void;
}) {
  const { t, locale } = useI18n();
  const [hover, setHover] = useState(false);
  const cat = categoryDef(listing.categorySlug);

  const statuses: { kind?: StatusKind; icon?: IconName; label?: string }[] = [];
  const ps = priceStatus(listing.price);
  if (ps) statuses.push({ kind: ps });
  const age = ageLabel(listing.ageMin, listing.ageMax, t);
  if (age) statuses.push({ icon: "users-round", label: age });

  const placeText = listing.address || listing.municipalityName || null;
  const distance = formatDistance(listing.distanceM, locale);

  const cardShell = {
    position: "relative" as const,
    background: "var(--surface-card)",
    border: active ? "2px solid var(--border-brand)" : "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-lg)",
    boxShadow: hover || active ? "var(--shadow-md)" : "var(--shadow-sm)",
    transform: hover ? "var(--lift)" : "none",
    transition:
      "box-shadow var(--dur-base) var(--ease-soft), transform var(--dur-base) var(--ease-soft), border-color var(--dur-base)",
    cursor: "pointer",
  };

  const handlers = {
    onMouseEnter: () => {
      setHover(true);
      onHover?.(listing.id);
    },
    onMouseLeave: () => {
      setHover(false);
      onHover?.(null);
    },
    onClick: () => onSelect?.(listing.id),
  };

  // ── Event: horizontal card led by a date block ──
  if (listing.kind === "event" && listing.startsAt) {
    const d = new Date(listing.startsAt);
    const intl = INTL_LOCALE[locale];
    const day = d.toLocaleDateString(intl, { day: "numeric" });
    const month = d
      .toLocaleDateString(intl, { month: "short" })
      .replace(".", "")
      .toUpperCase();
    const time = d.toLocaleTimeString(intl, { hour: "2-digit", minute: "2-digit" });

    return (
      <article {...handlers} style={{ ...cardShell, display: "flex", gap: 14, padding: 14 }}>
        <div
          style={{
            flex: "none",
            width: 64,
            height: 72,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: cat.bg,
            color: cat.fg,
            borderRadius: "var(--radius-md)",
          }}
        >
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, lineHeight: 1 }}>
            {day}
          </span>
          <span style={{ fontSize: "var(--fs-xs)", fontWeight: 700, letterSpacing: "0.05em", marginTop: 2 }}>
            {month}
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          <CategoryPill category={listing.categorySlug} size="sm" />
          <h3 style={{ margin: 0, fontSize: "var(--fs-h4)", fontWeight: "var(--fw-bold)", lineHeight: 1.25 }}>
            {listing.title}
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px" }}>
            <MetaRow icon="clock" text={time} />
            {placeText && <MetaRow icon="map-pin" text={placeText} />}
            <MetaRow icon="locate-fixed" text={distance} />
          </div>
          {statuses.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
              {statuses.map((s, i) => (
                <StatusLabel key={i} kind={s.kind} icon={s.icon} label={s.label} size="sm" />
              ))}
            </div>
          )}
        </div>

        {onToggleSave && <SaveButton saved={saved} onToggle={() => onToggleSave(listing.id)} />}
      </article>
    );
  }

  // ── Activity: vertical card with media header ──
  const schedule = [
    weekdayName(listing.weekday, locale),
    formatTimeRange(listing.startTime, listing.endTime),
  ]
    .filter(Boolean)
    .join(" · ");
  const scheduleText = schedule || listing.recurrenceNote || null;

  return (
    <article {...handlers} style={{ ...cardShell, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ position: "relative", aspectRatio: "16 / 10", background: cat.bg, overflow: "hidden" }}>
        {listing.imageUrl ? (
          <Image src={listing.imageUrl} alt="" fill style={{ objectFit: "cover" }} sizes="420px" />
        ) : (
          <span
            style={{
              position: "absolute",
              inset: 0,
              margin: "auto",
              width: 46,
              height: 46,
              color: cat.fg,
              opacity: 0.55,
              display: "inline-flex",
            }}
          >
            <Icon name={cat.icon} size={46} />
          </span>
        )}
        <span style={{ position: "absolute", top: 12, left: 12 }}>
          <CategoryPill category={listing.categorySlug} size="sm" style={{ boxShadow: "var(--shadow-xs)" }} />
        </span>
        {onToggleSave && (
          <SaveButton saved={saved} onToggle={() => onToggleSave(listing.id)} floating />
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "14px 16px 16px" }}>
        <h3 style={{ margin: 0, fontSize: "var(--fs-h4)", fontWeight: "var(--fw-bold)", lineHeight: 1.25, letterSpacing: "-0.01em" }}>
          {listing.title}
        </h3>
        {listing.organizationName && (
          <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)", fontWeight: "var(--fw-medium)" }}>
            {listing.organizationName}
          </p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {scheduleText && <MetaRow icon="clock" text={scheduleText} />}
          {placeText && <MetaRow icon="map-pin" text={placeText} />}
          <MetaRow icon="locate-fixed" text={distance} />
        </div>
        {statuses.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
            {statuses.map((s, i) => (
              <StatusLabel key={i} kind={s.kind} icon={s.icon} label={s.label} size="sm" />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
