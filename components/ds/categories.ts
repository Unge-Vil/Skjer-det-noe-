import type { IconName } from "./Icon";

export interface CategoryDef {
  label: string;
  icon: IconName;
  fg: string;
  bg: string;
}

/** Category slug → label, Lucide icon, and colour pair (from colors.css). */
export const CATEGORIES: Record<string, CategoryDef> = {
  gaming: { label: "Gaming", icon: "gamepad-2", fg: "var(--cat-gaming-fg)", bg: "var(--cat-gaming-bg)" },
  music: { label: "Musikk", icon: "music", fg: "var(--cat-music-fg)", bg: "var(--cat-music-bg)" },
  film: { label: "Film", icon: "clapperboard", fg: "var(--cat-film-fg)", bg: "var(--cat-film-bg)" },
  sports: { label: "Sport", icon: "volleyball", fg: "var(--cat-sports-fg)", bg: "var(--cat-sports-bg)" },
  outdoor: { label: "Friluftsliv", icon: "tent-tree", fg: "var(--cat-outdoor-fg)", bg: "var(--cat-outdoor-bg)" },
  creative: { label: "Skapende", icon: "palette", fg: "var(--cat-creative-fg)", bg: "var(--cat-creative-bg)" },
  social: { label: "Møteplass", icon: "users-round", fg: "var(--cat-social-fg)", bg: "var(--cat-social-bg)" },
  courses: { label: "Kurs", icon: "graduation-cap", fg: "var(--cat-courses-fg)", bg: "var(--cat-courses-bg)" },
  club: { label: "Ungdomsklubb", icon: "house-heart", fg: "var(--cat-club-fg)", bg: "var(--cat-club-bg)" },
};

export function categoryDef(slug: string | null | undefined): CategoryDef {
  return (slug && CATEGORIES[slug]) || CATEGORIES.social;
}
