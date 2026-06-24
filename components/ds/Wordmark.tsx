import type { CSSProperties } from "react";

/** "Skjer det noe?" brand lockup — type-led, the "?" is coral. */
export function Wordmark({
  size = 28,
  withMark = false,
  onDark = false,
  style = {},
}: {
  size?: number;
  withMark?: boolean;
  onDark?: boolean;
  style?: CSSProperties;
}) {
  const markDim = Math.round(size * 1.85);
  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", gap: size * 0.55, ...style }}
    >
      {withMark && (
        <span
          aria-hidden="true"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: markDim,
            height: markDim,
            borderRadius: markDim * 0.27,
            background: "var(--fjord-600)",
            color: "var(--sol-400)",
            fontFamily: "var(--font-display)",
            fontWeight: 900,
            fontSize: markDim * 0.62,
            lineHeight: 1,
            flex: "none",
          }}
        >
          ?
        </span>
      )}
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 900,
          fontSize: size,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          color: onDark ? "#fff" : "var(--text-strong)",
          whiteSpace: "nowrap",
        }}
      >
        Skjer det noe
        <span style={{ color: onDark ? "var(--sol-400)" : "var(--accent)" }}>?</span>
      </span>
    </span>
  );
}
