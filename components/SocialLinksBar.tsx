import { SocialIcon } from "@/components/ds/SocialIcon";
import { SOCIAL_PLATFORMS, parseSocialLinks } from "@/components/ds/socials";

/** Public row of social-media links. Renders nothing when there are none. */
export function SocialLinksBar({ links }: { links: unknown }) {
  const parsed = parseSocialLinks(links);
  const items = SOCIAL_PLATFORMS.filter((p) => parsed[p.key]);
  if (items.length === 0) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {items.map((p) => (
        <a
          key={p.key}
          href={parsed[p.key]}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={p.label}
          title={p.label}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            background: "var(--surface-card)",
            color: "var(--text-body)",
          }}
        >
          <SocialIcon name={p.key} size={20} />
        </a>
      ))}
    </div>
  );
}
