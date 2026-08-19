import type { NavItem } from "./AdminShell";

/** Sidebar nav for the municipality admin shell. `active` highlights a section
 *  for routes the bare pathname-equality check in AdminShell would miss. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function kommuneNav(t: any, active?: string): NavItem[] {
  const items: NavItem[] = [
    { href: "/kommune", label: t.orgadmin.overview, icon: "layout-dashboard" },
    { href: "/kommune/organisasjoner", label: t.kommune.organizations, icon: "building-2" },
    { href: "/kommune/innhold", label: t.kommune.content, icon: "clipboard-list" },
    { href: "/kommune/sider", label: t.kommune.pages, icon: "file-text" },
    { href: "/kommune/profil", label: t.orgadmin.profile, icon: "building-2" },
  ];
  return items.map((n) => ({ ...n, active: active ? n.href === active : undefined }));
}
