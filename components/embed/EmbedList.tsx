import { EmbedCard } from "./EmbedCard";
import type { EmbedItem, EmbedLayout } from "@/lib/embeds";

export function EmbedList({
  items,
  layout,
  baseUrl,
  emptyText,
}: {
  items: EmbedItem[];
  layout: EmbedLayout;
  baseUrl: string;
  emptyText: string;
}) {
  if (items.length === 0) {
    return (
      <p style={{ margin: 0, padding: 16, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{emptyText}</p>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: 10,
        gridTemplateColumns: layout === "grid" ? "repeat(auto-fill, minmax(240px, 1fr))" : "1fr",
      }}
    >
      {items.map((item) => (
        <EmbedCard
          key={`${item.kind}-${item.id}`}
          item={item}
          href={`${baseUrl}${item.kind === "event" ? "/arrangement/" : "/aktivitet/"}${item.slug}`}
        />
      ))}
    </div>
  );
}
