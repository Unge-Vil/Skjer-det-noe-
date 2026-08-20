"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ds/Icon";
import { useI18n } from "@/components/i18n/LocaleProvider";

export function IntegrationNav() {
  const { t } = useI18n();
  const pathname = usePathname();
  const items = [
    { href: "/admin/integrasjoner", label: t.integrations.title, icon: "plug" as const },
    { href: "/admin/integrasjoner/api", label: "API", icon: "key" as const },
    { href: "/admin/integrasjoner/kalender", label: "Kalender-feeds", icon: "calendar-days" as const },
    { href: "/admin/integrasjoner/embeds", label: "Innebygging", icon: "monitor" as const },
    { href: "/admin/integrasjoner/rss", label: "RSS-feed", icon: "rss" as const },
    { href: "/admin/integrasjoner/mcp", label: t.integrations.mcpTitle, icon: "sparkles" as const },
  ];
  return (
    <nav aria-label={t.integrations.title} style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
      {items.map((item) => {
        const active = pathname === item.href;
        return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 11px", borderRadius: "var(--radius-md)", textDecoration: "none", background: active ? "var(--surface-brand-soft)" : "transparent", color: active ? "var(--text-brand)" : "var(--text-body)", fontSize: "var(--fs-sm)", fontWeight: active ? 700 : 600 }}><Icon name={item.icon} size={16} />{item.label}</Link>;
      })}
    </nav>
  );
}
