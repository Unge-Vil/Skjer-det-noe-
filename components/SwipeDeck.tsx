"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Listing } from "@/lib/types";
import { listingHref } from "@/lib/listings";
import { formatDistance, formatEventDate, formatTimeRange, weekdayName } from "@/lib/format";
import { categoryDef } from "@/components/ds/categories";
import { CategoryPill } from "@/components/ds/CategoryPill";
import { StatusLabel, type StatusKind } from "@/components/ds/StatusLabel";
import { Icon, type IconName } from "@/components/ds/Icon";
import { useI18n } from "@/components/i18n/LocaleProvider";

const SAVED_KEY = "sdn-saved";
const THRESHOLD = 110;

function addSaved(id: string) {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    if (!arr.includes(id)) {
      arr.push(id);
      localStorage.setItem(SAVED_KEY, JSON.stringify(arr));
    }
  } catch {
    // ignore
  }
}

function ActionBtn({
  icon,
  label,
  onClick,
  big,
  fg,
  bg = "var(--surface-card)",
  border,
}: {
  icon: IconName;
  label: string;
  onClick: () => void;
  big?: boolean;
  fg: string;
  bg?: string;
  border: string;
}) {
  const d = big ? 64 : 54;
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        width: d,
        height: d,
        flex: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "var(--radius-pill)",
        background: bg,
        color: fg,
        border: `2px solid ${border}`,
        boxShadow: "var(--shadow-sm)",
        cursor: "pointer",
      }}
    >
      <Icon name={icon} size={big ? 28 : 24} fill={icon === "heart" ? "currentColor" : "none"} />
    </button>
  );
}

function CardFace({ listing }: { listing: Listing }) {
  const { locale } = useI18n();
  const cat = categoryDef(listing.categorySlug);

  const when =
    listing.kind === "event"
      ? listing.startsAt
        ? formatEventDate(listing.startsAt, locale)
        : null
      : [weekdayName(listing.weekday, locale), formatTimeRange(listing.startTime, listing.endTime)]
          .filter(Boolean)
          .join(" · ") || listing.recurrenceNote;

  const statuses: { kind?: StatusKind; icon?: IconName; label?: string }[] = [];
  if (listing.price) statuses.push({ kind: /gratis|free/i.test(listing.price) ? "free" : "paid" });

  return (
    <article
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: "var(--radius-2xl)",
        overflow: "hidden",
        background: cat.bg,
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-lg)",
        userSelect: "none",
      }}
    >
      {listing.imageUrl ? (
        <Image src={listing.imageUrl} alt="" fill style={{ objectFit: "cover" }} sizes="360px" draggable={false} />
      ) : (
        <span style={{ position: "absolute", inset: 0, margin: "auto", width: 72, height: 72, color: cat.fg, opacity: 0.5, display: "inline-flex" }}>
          <Icon name={cat.icon} size={72} />
        </span>
      )}
      <span style={{ position: "absolute", top: 16, left: 16 }}>
        <CategoryPill category={listing.categorySlug} solid />
      </span>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(6,52,51,0.92) 0%, rgba(6,52,51,0.45) 32%, transparent 60%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 20, display: "flex", flexDirection: "column", gap: 8 }}>
        <h2 style={{ margin: 0, color: "#fff", fontSize: 26, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.01em" }}>{listing.title}</h2>
        {listing.organizationName && (
          <p style={{ margin: 0, color: "rgba(255,255,255,0.9)", fontWeight: 600, fontSize: "var(--fs-sm)" }}>{listing.organizationName}</p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, color: "rgba(255,255,255,0.92)", fontSize: "var(--fs-sm)" }}>
          {when && <Line icon="clock" text={when} />}
          {listing.address || listing.municipalityName ? (
            <Line icon="map-pin" text={(listing.address || listing.municipalityName)!} />
          ) : null}
          <Line icon="locate-fixed" text={formatDistance(listing.distanceM, locale)} />
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

function Line({ icon, text }: { icon: IconName; text: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <Icon name={icon} size={15} color="#fff" />
      {text}
    </span>
  );
}

export function SwipeDeck({ listings }: { listings: Listing[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [flyOut, setFlyOut] = useState<"left" | "right" | null>(null);
  const [grabbing, setGrabbing] = useState(false);
  const active = useRef(false);
  const startX = useRef(0);

  const current = listings[index];
  const next = listings[index + 1];

  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const advance = useCallback(
    (dir: "left" | "right") => {
      if (dir === "right" && current) addSaved(current.id);
      const go = () => {
        setIndex((i) => i + 1);
        setDragX(0);
        setFlyOut(null);
      };
      if (reduceMotion) {
        go();
      } else {
        setFlyOut(dir);
        setTimeout(go, 220);
      }
    },
    [current, reduceMotion],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (flyOut) return;
    active.current = true;
    startX.current = e.clientX;
    setGrabbing(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!active.current) return;
    setDragX(e.clientX - startX.current);
  };
  const onPointerUp = () => {
    if (!active.current) return;
    active.current = false;
    setGrabbing(false);
    if (dragX > THRESHOLD) advance("right");
    else if (dragX < -THRESHOLD) advance("left");
    else setDragX(0);
  };

  if (!current) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
        <Icon name="sparkles" size={40} color="var(--stone-300)" />
        <h2 style={{ margin: "12px 0 4px", fontSize: "var(--fs-h3)", fontWeight: 700, color: "var(--text-strong)" }}>{t.swipe.done}</h2>
        <p style={{ margin: "0 0 16px", fontSize: "var(--fs-sm)" }}>{t.swipe.doneHint}</p>
        {listings.length > 0 && (
          <button
            type="button"
            onClick={() => setIndex(0)}
            style={{ border: "1.5px solid var(--border-strong)", background: "var(--surface-card)", color: "var(--text-brand)", borderRadius: "var(--radius-pill)", padding: "10px 18px", fontWeight: 600, cursor: "pointer" }}
          >
            {t.swipe.restart}
          </button>
        )}
      </div>
    );
  }

  const rotation = dragX / 18;
  const topTransform = flyOut
    ? `translateX(${flyOut === "right" ? 600 : -600}px) rotate(${flyOut === "right" ? 24 : -24}deg)`
    : `translateX(${dragX}px) rotate(${rotation}deg)`;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ margin: "0 0 2px", fontSize: "var(--fs-h2)", fontWeight: 800 }}>{t.swipe.title}</h1>
        <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>{t.swipe.subtitle}</p>
      </div>

      {/* Card stack */}
      <div style={{ position: "relative", width: "100%", maxWidth: 360, aspectRatio: "3 / 4" }}>
        {next && (
          <div style={{ position: "absolute", inset: 0, transform: "scale(0.96) translateY(10px)", opacity: 0.7 }}>
            <CardFace listing={next} />
          </div>
        )}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            position: "absolute",
            inset: 0,
            cursor: grabbing ? "grabbing" : "grab",
            touchAction: "pan-y",
            transform: topTransform,
            transition: grabbing ? "none" : "transform var(--dur-base) var(--ease-soft)",
          }}
        >
          <CardFace listing={current} />
        </div>
      </div>

      <div role="group" aria-label={t.swipe.title} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <ActionBtn icon="x" label={t.swipe.skip} onClick={() => advance("left")} fg="var(--text-body)" border="var(--border-strong)" />
        <ActionBtn
          icon="info"
          label={t.swipe.info}
          onClick={() => router.push(listingHref(current.kind, current.slug))}
          fg="var(--text-brand)"
          border="var(--border-strong)"
        />
        <ActionBtn icon="heart" label={t.swipe.save} onClick={() => advance("right")} big fg="#fff" bg="var(--coral-600)" border="var(--coral-600)" />
      </div>
    </div>
  );
}
