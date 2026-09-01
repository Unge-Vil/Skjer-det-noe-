export default function ExploreLoading() {
  return (
    <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6" aria-busy="true">
      <span className="sr-only" role="status">Laster innhold …</span>
      <div className="sdn-skeleton" style={{ height: 44, maxWidth: 480, marginBottom: 16 }} />
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="sdn-skeleton" style={{ height: 32, width: 96, borderRadius: "var(--radius-pill)" }} />
        ))}
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="sdn-skeleton" style={{ height: 104 }} />
        ))}
      </div>
    </main>
  );
}
