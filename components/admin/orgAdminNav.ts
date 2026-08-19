import type { Dictionary } from "@/lib/i18n/dictionaries/nb";
import type { NavItem } from "./AdminShell";

export function orgAdminNav(t: Dictionary): NavItem[] {
  return [
    { href: "/admin", label: t.orgadmin.overview, icon: "layout-dashboard" },
    { href: "/admin/profil", label: t.orgadmin.profile, icon: "building-2" },
    { href: "/admin/profiler", label: t.orgadmin.departments, icon: "building-2" },
    {
      href: "/admin#aktiviteter",
      label: t.kommune.content,
      icon: "clipboard-list",
      children: [
        { href: "/admin#aktiviteter", label: t.admin.activities, icon: "repeat" },
        { href: "/admin#arrangementer", label: t.admin.events, icon: "calendar-days" },
        { href: "/admin#tjenester", label: t.directory.services, icon: "clipboard-list" },
        { href: "/admin#frivilligtorg", label: t.directory.volunteer, icon: "users-round" },
      ],
    },
    {
      href: "/admin/bilder",
      label: "Mer",
      icon: "list",
      children: [
        { href: "/admin/bilder", label: t.orgadmin.media, icon: "image" },
        { href: "/admin/integrasjoner", label: t.orgadmin.integrations, icon: "plug" },
        { href: "/admin/innstillinger", label: t.orgadmin.settings, icon: "settings" },
      ],
    },
  ];
}
