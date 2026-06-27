import type { CSSProperties } from "react";

/** Initials avatar in a rounded fjord-tint square. */
export function Avatar({
  name,
  size = 40,
  style = {},
}: {
  name: string;
  size?: number;
  style?: CSSProperties;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        flex: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "var(--radius-md)",
        background: "var(--fjord-100)",
        color: "var(--fjord-700)",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: Math.round(size * 0.38),
        ...style,
      }}
    >
      {initials}
    </span>
  );
}
