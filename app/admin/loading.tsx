export default function AdminLoading() {
  return (
    <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8" aria-busy="true">
      <span className="sr-only" role="status">Laster …</span>
      <div className="sdn-skeleton" style={{ height: 32, maxWidth: 280, marginBottom: 20 }} />
      <div style={{ display: "grid", gap: 12 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="sdn-skeleton" style={{ height: 72 }} />
        ))}
      </div>
    </main>
  );
}
