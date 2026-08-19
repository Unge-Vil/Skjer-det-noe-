import type { Dictionary } from "@/lib/i18n/dictionaries/nb";
import type { NavItem } from "./AdminShell";

export function platformNav(t: Dictionary): NavItem[] {
  return [
    { href: "/plattform", label: t.orgadmin.overview, icon: "layout-dashboard" },
    { href: "/plattform/kommuner", label: t.platform.municipalities, icon: "map" },
    { href: "/plattform/organisasjoner", label: t.platform.allOrgs, icon: "building-2" },
    { href: "/plattform/tilganger", label: t.platform.muniAdmins, icon: "key" },
  ];
}
