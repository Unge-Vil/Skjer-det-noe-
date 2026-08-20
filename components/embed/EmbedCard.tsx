import Image from "next/image";
import { categoryDef } from "@/components/ds/categories";
import { Icon } from "@/components/ds/Icon";
import { formatEventDate, formatTimeRange, weekdayName } from "@/lib/format";
import type { EmbedItem } from "@/lib/embeds";

function when(item: EmbedItem): string | null {
  if (item.kind === "event") {
    return item.startsAt ? formatEventDate(item.startsAt, "nb") : null;
  }
  const day = weekdayName(item.weekday, "nb");
  const time = formatTimeRange(item.startTime, item.endTime);
  return [day, time].filter(Boolean).join(" ") || item.recurrenceNote;
}

export function EmbedCard({ item, href }: { item: EmbedItem; href: string }) {
  const category = categoryDef(item.categorySlug);
  const timing = when(item);

  return (
    <a
      href={href}
      target="_top"
      rel="noopener"
      style={{
        display: "flex",
        gap: 12,
        padding: 12,
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-subtle)",
        background: "var(--surface-card)",
        color: "var(--text-body)",
        textDecoration: "none",
      }}
    >
      <div
        style={{
          position: "relative",
          flexShrink: 0,
          width: 72,
          height: 72,
          borderRadius: "var(--radius-sm)",
          overflow: "hidden",
          background: category.bg,
          display: "grid",
          placeItems: "center",
        }}
      >
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt="" fill sizes="72px" style={{ objectFit: "cover" }} />
        ) : (
          <Icon name={category.icon} size={26} color={category.fg} />
        )}
      </div>
      <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
        <strong style={{ fontSize: "var(--fs-sm)", color: "var(--text-strong)" }}>{item.title}</strong>
        {timing && (
          <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-brand)", fontWeight: 600 }}>{timing}</span>
        )}
        {item.organizationName && (
          <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{item.organizationName}</span>
        )}
        {item.address && (
          <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{item.address}</span>
        )}
      </div>
    </a>
  );
}
