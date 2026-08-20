"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ds/Button";
import { Icon } from "@/components/ds/Icon";
import { StatusLabel } from "@/components/ds/StatusLabel";
import type { EmbedRow } from "@/components/admin/EmbedsManager";

export function RssFeedsManager({ embeds }: { embeds: EmbedRow[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  const baseUrl = typeof window === "undefined" ? "" : window.location.origin;

  const copy = async (id: string, url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(id);
  };

  if (embeds.length === 0) {
    return (
      <section style={{ padding: 20, background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)" }}>
        <h2 style={{ margin: "0 0 6px", fontSize: "var(--fs-h4)", fontWeight: 700 }}>Ingen RSS-feeder ennå</h2>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "var(--fs-sm)", lineHeight: 1.5 }}>
          Opprett en widget under Innebygging først. RSS-feeden følger widgetens type, kategorier og antall.
        </p>
        <Link href="../embeds" style={{ display: "inline-block", marginTop: 12, color: "var(--text-brand)", fontSize: "var(--fs-sm)", fontWeight: 700 }}>
          Gå til Innebygging
        </Link>
      </section>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {embeds.map((embed) => {
        const url = `${baseUrl}/api/public/v1/feeds/${embed.public_id}/rss`;
        return (
          <section key={embed.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: 20, background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)" }}>
            <Icon name="rss" size={22} color="var(--icon-brand)" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ margin: "0 0 4px", fontSize: "var(--fs-h4)", fontWeight: 700 }}>{embed.label || "RSS-feed"}</h2>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, margin: "0 0 10px" }}>
                <StatusLabel label={embed.active ? "Publisert feed" : "Deaktivert widget"} icon={embed.active ? "check" : "ban"} tone={embed.active ? "success" : "danger"} size="sm" />
                <span style={{ color: "var(--text-muted)", fontSize: "var(--fs-xs)" }}>{embed.item_limit} elementer</span>
              </div>
              <code style={{ display: "block", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all", padding: "10px 12px", borderRadius: "var(--radius-sm)", background: "var(--surface-sunk)", fontSize: "var(--fs-xs)" }}>{url}</code>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leadingIcon={copied === embed.id ? "check" : "copy"}
              onClick={() => copy(embed.id, url)}
            >
              {copied === embed.id ? "Kopiert" : "Kopier"}
            </Button>
          </section>
        );
      })}
    </div>
  );
}
