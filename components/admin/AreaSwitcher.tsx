"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icon, type IconName } from "@/components/ds/Icon";
import { useI18n } from "@/components/i18n/LocaleProvider";

interface Area {
  key: "org" | "municipality" | "platform";
  href: string;
  label: string;
  icon: IconName;
}

/** Lets a user with access to several admin areas (organisation, municipality,
 *  platform) jump between them. Renders nothing when only one area applies. */
export function AreaSwitcher() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [areas, setAreas] = useState<Area[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const [orgRes, profileMemRes, muniRes, profRes] = await Promise.all([
        supabase.from("organization_members").select("organization_id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("org_profile_members").select("profile_id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("municipality_admins").select("user_id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("profiles").select("is_platform_admin").eq("id", user.id).maybeSingle(),
      ]);
      if (!active) return;
      const platform = Boolean(profRes.data?.is_platform_admin);
      const list: Area[] = [];
      if ((orgRes.count ?? 0) > 0 || (profileMemRes.count ?? 0) > 0)
        list.push({ key: "org", href: "/admin", label: t.areas.org, icon: "building-2" });
      if ((muniRes.count ?? 0) > 0 || platform)
        list.push({ key: "municipality", href: "/kommune", label: t.areas.municipality, icon: "map-pin" });
      if (platform) list.push({ key: "platform", href: "/plattform", label: t.areas.platform, icon: "layout-dashboard" });
      setAreas(list);
    })();
    return () => {
      active = false;
    };
  }, [t]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (areas.length <= 1) return null;

  const activeArea =
    areas.find((a) => (a.href === "/admin" ? pathname.startsWith("/admin") : pathname.startsWith(a.href))) ?? areas[0];

  const go = (href: string) => {
    setOpen(false);
    if (!pathname.startsWith(href)) router.push(href);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        aria-label={t.areas.label}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          height: 40,
          padding: "0 12px",
          borderRadius: "var(--radius-pill)",
          border: "1.5px solid var(--border-strong)",
          background: open ? "var(--surface-brand-soft)" : "var(--surface-card)",
          color: "var(--text-brand)",
          fontSize: "var(--fs-sm)",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        <Icon name={activeArea.icon} size={16} />
        <span className="hidden sm:inline">{activeArea.label}</span>
        <Icon name="chevron-down" size={15} color="var(--text-muted)" />
      </button>
      {open && (
        <div
          role="menu"
          className="sdn-pop"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            zIndex: 40,
            minWidth: 200,
            padding: 4,
            background: "var(--surface-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {areas.map((a) => {
            const isActive = a.key === activeArea.key;
            return (
              <button
                key={a.key}
                type="button"
                role="menuitem"
                onClick={() => go(a.href)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  background: isActive ? "var(--fjord-50)" : "transparent",
                  color: isActive ? "var(--fjord-700)" : "var(--text-body)",
                  fontSize: "var(--fs-sm)",
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <Icon name={a.icon} size={18} color={isActive ? "var(--fjord-600)" : "var(--stone-500)"} />
                <span style={{ flex: 1 }}>{a.label}</span>
                {isActive && <Icon name="check" size={15} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
