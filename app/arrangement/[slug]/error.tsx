"use client";

import { Button } from "@/components/ds/Button";
import { Icon } from "@/components/ds/Icon";

export default function EventError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="mx-auto flex w-full max-w-2xl flex-1 items-center px-4 py-16">
      <section
        role="alert"
        aria-live="polite"
        style={{
          width: "100%",
          padding: 24,
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          background: "var(--surface-card)",
        }}
      >
        <Icon name="info" size={28} color="var(--danger-text)" />
        <h1 style={{ margin: "12px 0 8px", fontSize: "var(--fs-h2)", fontWeight: 800 }}>
          Kunne ikke vise arrangementet
        </h1>
        <p style={{ margin: "0 0 20px", color: "var(--text-muted)" }}>
          Vi klarte ikke å hente dette arrangementet. Prøv igjen om litt.
        </p>
        <Button leadingIcon="repeat" onClick={reset}>Prøv igjen</Button>
      </section>
    </main>
  );
}
