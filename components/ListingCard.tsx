"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Listing } from "@/lib/types";
import { listingHref } from "@/lib/listings";
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
  showDistance = true,
  variant = "card",
  onHover,
  onToggleSave,
}: {
  listing: Listing;
  active?: boolean;
  saved?: boolean;
  showDistance?: boolean;
  variant?: "card" | "row";
  onHover?: (id: string | null) => void;
  onToggleSave?: (id: string) => void;
}) {
  const { t, locale } = useI18n();
  const href = listingHref(listing.kind, listing.slug);
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
    textDecoration: "none",
    color: "inherit",
  };

  // Real anchor so cards can be opened in a new tab / middle-clicked and are
  // crawlable; the save button stops propagation to avoid navigating.
  const handlers = {
    href,
    onMouseEnter: () => {
      setHover(true);
      onHover?.(listing.id);
    },
    onMouseLeave: () => {
      setHover(false);
      onHover?.(null);
    },
  };

  if (variant === "row") {
    const schedule =
      listing.kind === "event" && listing.startsAt
        ? new Date(listing.startsAt).toLocaleString(INTL_LOCALE[locale], {
            weekday: "short",
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })
        : [weekdayName(listing.weekday, locale), formatTimeRange(listing.startTime, listing.endTime)]
            .filter(Boolean)
            .join(" · ") || listing.recurrenceNote;

    return (
      <Link
        {...handlers}
        style={{
          ...cardShell,
          display: "grid",
          gridTemplateColumns: "clamp(148px, 34vw, 220px) minmax(0,1fr)",
          gap: 12,
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative", background: cat.bg, aspectRatio: "16 / 9" }}>
          {listing.imageUrl ? (
            <Image src={listing.imageUrl} alt="" fill style={{ objectFit: "cover" }} sizes="120px" />
          ) : (
            <span
              style={{
                position: "absolute",
                inset: 0,
                margin: "auto",
                width: 30,
                height: 30,
                color: cat.fg,
                opacity: 0.6,
                display: "inline-flex",
              }}
            >
              <Icon name={cat.icon} size={30} />
            </span>
          )}
        </div>

        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 6, padding: "10px 12px 10px 0" }}>
          <div style={{ display: "flex", alignItems: "start", gap: 8 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: "var(--fs-body)", fontWeight: 700, lineHeight: 1.3 }}>
                {listing.title}
              </h3>
              {listing.organizationName && (
                <p style={{ margin: "2px 0 0", fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
                  {listing.organizationName}
                </p>
              )}
            </div>
            {onToggleSave && <SaveButton saved={saved} onToggle={() => onToggleSave(listing.id)} />}
          </div>

          <p style={{ margin: 0, fontSize: "var(--fs-xs)", color: "var(--text-muted)", display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span>{listing.kind === "event" ? t.card.event : t.card.activity}</span>
            {schedule && <span>{schedule}</span>}
            {placeText && <span>{placeText}</span>}
            {showDistance && <span>{distance}</span>}
          </p>
        </div>
      </Link>
    );
  }

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
      <Link {...handlers} style={{ ...cardShell, display: "flex", gap: 14, padding: 14 }}>
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
            {showDistance && <MetaRow icon="locate-fixed" text={distance} />}
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
      </Link>
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
    <Link {...handlers} style={{ ...cardShell, display: "flex", flexDirection: "column", overflow: "hidden" }}>
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
          {showDistance && <MetaRow icon="locate-fixed" text={distance} />}
        </div>
        {statuses.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
            {statuses.map((s, i) => (
              <StatusLabel key={i} kind={s.kind} icon={s.icon} label={s.label} size="sm" />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
