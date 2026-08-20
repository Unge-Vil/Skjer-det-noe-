"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  formatEventDate,
  formatTimeRange,
  weekdayName,
} from "@/lib/format";
import { fmt } from "@/lib/i18n/config";
import { categoryDef } from "@/components/ds/categories";
import { CategoryPill } from "@/components/ds/CategoryPill";
import { StatusLabel, type StatusKind } from "@/components/ds/StatusLabel";
import { IconButton } from "@/components/ds/IconButton";
import { Icon, type IconName } from "@/components/ds/Icon";
import { Button } from "@/components/ds/Button";
import { useI18n } from "@/components/i18n/LocaleProvider";

const SAVED_KEY = "sdn-saved";

export interface DetailData {
  id: string;
  kind: "activity" | "event";
  title: string;
  description: string | null;
  organizationName: string | null;
  organizationSlug: string | null;
  categorySlug: string | null;
  municipalityName: string | null;
  municipalityNumber: string | null;
  address: string | null;
  accessibility?: string | null;
  area?: string | null;
  price: string | null;
  ageMin: number | null;
  ageMax: number | null;
  url: string | null;
  imageUrl: string | null;
  weekday?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  recurrenceNote?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  coOrganizers?: { name: string; slug: string | null }[];
  exceptions?: ListingException[];
}

interface ListingException {
  occurrence_date: string;
  kind: "cancelled" | "closed" | "changed" | "notice";
  message: string | null;
  reason: string | null;
  start_time: string | null;
  end_time: string | null;
}

function exceptionText(exception: ListingException, locale: string): { title: string; body: string | null; icon: IconName; color: string; background: string } {
  const norwegian = locale !== "en";
  if (exception.kind === "cancelled") return { title: norwegian ? "Avlyst" : "Cancelled", body: exception.message || exception.reason, icon: "ban", color: "var(--status-danger-text)", background: "var(--status-danger-bg)" };
  if (exception.kind === "closed") return { title: norwegian ? "Stengt denne datoen" : "Closed on this date", body: exception.message || exception.reason, icon: "door-open", color: "var(--status-sol-text)", background: "var(--status-sol-bg)" };
  if (exception.kind === "changed") return { title: norwegian ? "Endret denne datoen" : "Changed on this date", body: exception.message || exception.reason, icon: "clock", color: "var(--status-sol-text)", background: "var(--status-sol-bg)" };
  return { title: norwegian ? "Viktig informasjon" : "Important information", body: exception.message || exception.reason, icon: "info", color: "var(--text-brand)", background: "var(--surface-brand-soft)" };
}

function Fact({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 10, padding: 12, background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
      <Icon name={icon} size={18} color="var(--text-brand)" />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)", fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text-strong)" }}>{value}</div>
      </div>
    </div>
  );
}

export function DetailView({ data }: { data: DetailData }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const cat = categoryDef(data.categorySlug);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const arr: string[] = JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSaved(arr.includes(data.id));
    } catch {
      // ignore
    }
  }, [data.id]);

  const toggleSave = () => {
    setSaved((prev) => {
      const next = !prev;
      try {
        const arr: string[] = JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]");
        const updated = next ? [...new Set([...arr, data.id])] : arr.filter((x) => x !== data.id);
        localStorage.setItem(SAVED_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const timeValue =
    data.kind === "event"
      ? data.startsAt
        ? formatEventDate(data.startsAt, locale)
        : null
      : [weekdayName(data.weekday, locale), formatTimeRange(data.startTime, data.endTime)]
          .filter(Boolean)
          .join(" · ") || data.recurrenceNote || null;

  const place = data.address || data.municipalityName || null;
  const ageValue =
    data.ageMin != null && data.ageMax != null
      ? fmt(t.card.ageRange, { min: data.ageMin, max: data.ageMax })
      : data.ageMin != null
        ? fmt(t.card.ageFrom, { min: data.ageMin })
        : data.ageMax != null
          ? fmt(t.card.ageTo, { max: data.ageMax })
          : null;

  const statuses: { kind?: StatusKind; icon?: IconName; label?: string }[] = [];
  if (data.price) statuses.push({ kind: /gratis|free/i.test(data.price) ? "free" : "paid" });
  if (ageValue) statuses.push({ icon: "users-round", label: ageValue });

  const mapHref = `/kart${data.municipalityNumber ? `?kommune=${data.municipalityNumber}` : ""}`;
  const today = new Date().toISOString().slice(0, 10);
  const visibleExceptions = (data.exceptions ?? []).filter((exception) => exception.occurrence_date >= today);

  return (
    <main id="main" className="flex-1">
      {/* Hero */}
      <div style={{ position: "relative", height: 240, background: cat.bg }}>
        {data.imageUrl ? (
          <Image src={data.imageUrl} alt="" fill style={{ objectFit: "cover" }} sizes="100vw" priority />
        ) : (
          <span style={{ position: "absolute", inset: 0, margin: "auto", width: 72, height: 72, color: cat.fg, opacity: 0.5, display: "inline-flex" }}>
            <Icon name={cat.icon} size={72} />
          </span>
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(6,52,51,0.35), transparent 40%)" }} />
        <div style={{ position: "absolute", top: 12, left: 12, right: 12, display: "flex", justifyContent: "space-between" }}>
          <IconButton icon="arrow-left" label={t.detail.back} variant="outline" onClick={() => router.back()} style={{ background: "rgba(255,255,255,0.92)" }} />
          <IconButton
            icon="heart"
            label={t.swipe.save}
            variant="outline"
            onClick={toggleSave}
            fill={saved ? "currentColor" : "none"}
            style={{ background: "rgba(255,255,255,0.92)", color: saved ? "var(--coral-600)" : "var(--stone-600)" }}
          />
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl px-4 pb-12 pt-5" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <CategoryPill category={data.categorySlug} />
          <h1 style={{ margin: "10px 0 6px", fontSize: "var(--fs-h1)", fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.15 }}>
            {data.title}
          </h1>
          {data.organizationName &&
            (data.organizationSlug ? (
              <Link
                href={`/organisasjon/${data.organizationSlug}`}
                style={{ fontSize: "var(--fs-body)", color: "var(--text-link)", fontWeight: 600 }}
              >
                {data.organizationName}
              </Link>
            ) : (
              <p style={{ margin: 0, fontSize: "var(--fs-body)", color: "var(--text-muted)", fontWeight: 600 }}>
                {data.organizationName}
              </p>
            ))}
          {data.coOrganizers && data.coOrganizers.length > 0 && (
            <p style={{ margin: "4px 0 0", fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
              {t.form.coArranger}:{" "}
              {data.coOrganizers.map((c, i) => (
                <span key={`${c.slug ?? c.name}-${i}`}>
                  {i > 0 && ", "}
                  {c.slug ? (
                    <Link href={`/organisasjon/${c.slug}`} style={{ color: "var(--text-link)", fontWeight: 600 }}>
                      {c.name}
                    </Link>
                  ) : (
                    c.name
                  )}
                </span>
              ))}
            </p>
          )}
        </div>

        {statuses.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {statuses.map((s, i) => (
              <StatusLabel key={i} kind={s.kind} icon={s.icon} label={s.label} />
            ))}
          </div>
        )}

        {visibleExceptions.map((exception) => {
          const text = exceptionText(exception, locale);
          const date = new Date(`${exception.occurrence_date}T00:00:00Z`).toLocaleDateString(locale === "en" ? "en-GB" : "nb-NO", { day: "numeric", month: "long", year: "numeric" });
          const changedTime = exception.start_time && exception.end_time ? ` ${exception.start_time.slice(0, 5)}–${exception.end_time.slice(0, 5)}` : "";
          return (
            <div key={`${exception.occurrence_date}-${exception.kind}`} style={{ display: "flex", gap: 10, padding: 16, background: text.background, borderRadius: "var(--radius-lg)", color: text.color }}>
              <Icon name={text.icon} size={20} color={text.color} />
              <div>
                <strong>{text.title}: {date}{changedTime}</strong>
                {text.body && <p style={{ margin: "4px 0 0", fontSize: "var(--fs-sm)", lineHeight: 1.5 }}>{text.body}</p>}
              </div>
            </div>
          );
        })}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {timeValue && <Fact icon="clock" label={t.detail.time} value={timeValue} />}
          {place && <Fact icon="map-pin" label={t.detail.place} value={place} />}
          {data.area && <Fact icon="locate-fixed" label={t.form.area} value={data.area} />}
          <Fact icon="wallet" label={t.detail.price} value={data.price || t.detail.free} />
          {ageValue && <Fact icon="users-round" label={t.detail.age} value={ageValue} />}
        </div>

        {data.description && (
          <p style={{ margin: 0, fontSize: "var(--fs-body)", lineHeight: 1.6, color: "var(--text-body)" }}>
            {data.description}
          </p>
        )}

        {data.accessibility && (
          <div style={{ display: "flex", gap: 10, padding: 16, background: "var(--surface-brand-soft)", borderRadius: "var(--radius-lg)" }}>
            <Icon name="accessibility" size={20} color="var(--text-brand)" />
            <div>
              <div style={{ fontSize: "var(--fs-sm)", fontWeight: 700, marginBottom: 2 }}>{t.form.accessibility}</div>
              <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-body)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{data.accessibility}</p>
            </div>
          </div>
        )}

        {data.kind === "activity" && (
          <div style={{ display: "flex", gap: 10, padding: 16, background: "var(--status-success-bg)", borderRadius: "var(--radius-lg)" }}>
            <Icon name="sparkles" size={20} color="var(--status-success-text)" />
            <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--status-success-text)", lineHeight: 1.5 }}>
              <strong>{t.detail.newHere}</strong> {t.detail.newHereBody}
            </p>
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {data.url && (
            <a href={data.url} target="_blank" rel="noopener noreferrer">
              <Button leadingIcon="arrow-right">{t.detail.website}</Button>
            </a>
          )}
          <Link href={mapHref}>
            <Button variant="secondary" leadingIcon="map">{t.detail.onMap}</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
