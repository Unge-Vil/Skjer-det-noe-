// The public municipality portal lives at /kommune/[slug], so only /kommune
// itself and its reserved admin subsections are admin areas — a bare slug
// (e.g. /kommune/karmoy) is the public page and must keep the public chrome.
const KOMMUNE_ADMIN_SEGMENTS = [
  "organisasjoner",
  "innhold",
  "integrasjoner",
  "sider",
  "profil",
  "aktiviteter",
  "tjenester",
  "frivilligtorg",
] as const;

const KOMMUNE_ADMIN_RE = new RegExp(`^/kommune/(${KOMMUNE_ADMIN_SEGMENTS.join("|")})(/|$)`);

export function isAdminArea(pathname: string): boolean {
  if (pathname.startsWith("/admin") || pathname.startsWith("/plattform")) return true;
  if (pathname === "/kommune" || pathname === "/kommune/") return true;
  return KOMMUNE_ADMIN_RE.test(pathname);
}
