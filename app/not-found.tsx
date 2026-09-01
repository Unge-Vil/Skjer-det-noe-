import Link from "next/link";
import { Icon } from "@/components/ds/Icon";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex w-full max-w-2xl flex-1 items-center px-4 py-16">
      <section
        style={{
          width: "100%",
          padding: 24,
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          background: "var(--surface-card)",
        }}
      >
        <Icon name="search" size={28} color="var(--text-muted)" />
        <h1 style={{ margin: "12px 0 8px", fontSize: "var(--fs-h2)", fontWeight: 800 }}>
          Fant ikke siden
        </h1>
        <p style={{ margin: "0 0 20px", color: "var(--text-muted)" }}>
          Siden finnes ikke, eller den er flyttet. Gå tilbake til forsiden for å finne aktiviteter og arrangementer.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            minHeight: "var(--tap-comfy)",
            padding: "0 20px",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--fs-body)",
            fontWeight: "var(--fw-semibold)",
            color: "var(--text-on-brand)",
            background: "var(--surface-brand-strong)",
            borderRadius: "var(--radius-md)",
            textDecoration: "none",
          }}
        >
          <Icon name="house" size={20} color="var(--text-on-brand)" />
          Til forsiden
        </Link>
      </section>
    </main>
  );
}
