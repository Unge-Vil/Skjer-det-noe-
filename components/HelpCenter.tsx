"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/ds/Icon";
import { helpArticles, type HelpCategory } from "@/lib/help";

const categories: { slug: string; name: HelpCategory; icon: "sparkles" | "users-round" | "building-2" | "shield-check" | "key"; description: string }[] = [
  { slug: "kom-i-gang", name: "Kom i gang", icon: "sparkles", description: "Det viktigste for å finne frem." },
  { slug: "for-organisasjoner", name: "For organisasjoner", icon: "users-round", description: "Publiser og administrer tilbud." },
  { slug: "for-kommuner", name: "For kommuner", icon: "building-2", description: "Bygg en bedre lokal oversikt." },
  { slug: "api-dokumentasjon", name: "API-dokumentasjon", icon: "key", description: "Koble egne systemer til tjenesten." },
  { slug: "konto-og-personvern", name: "Konto og personvern", icon: "shield-check", description: "Svar på spørsmål om data og konto." },
];

export function HelpCenter() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredArticles = useMemo(
    () => helpArticles.filter((article) =>
      !normalizedQuery || `${article.title} ${article.description} ${article.category}`.toLowerCase().includes(normalizedQuery),
    ),
    [normalizedQuery],
  );

  return (
    <main id="main" className="sdn-page-enter" style={{ minHeight: "70vh", background: "var(--bg-app)" }}>
      <section style={{ background: "var(--surface-brand-soft)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ maxWidth: 1050, margin: "0 auto", padding: "64px 20px 58px", textAlign: "center" }}>
          <p style={{ margin: "0 0 12px", color: "var(--text-brand)", fontSize: "var(--fs-sm)", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" }}>Hjelpesenter</p>
          <h1 style={{ margin: "0 auto 12px", maxWidth: 680, color: "var(--text-heading)", fontSize: "clamp(2rem, 5vw, 3.25rem)", lineHeight: 1.05, fontWeight: 850 }}>Hvordan kan vi hjelpe?</h1>
          <p style={{ margin: "0 auto 28px", maxWidth: 580, color: "var(--text-muted)", fontSize: "var(--fs-lg)", lineHeight: 1.5 }}>Finn svar, veiledninger og praktiske tips for Skjer det noe.</p>
          <label style={{ position: "relative", display: "block", maxWidth: 620, margin: "0 auto", textAlign: "left" }}>
            <span style={{ position: "absolute", top: "50%", left: 18, display: "grid", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <Icon name="search" size={21} color="var(--text-muted)" />
            </span>
            <span className="sr-only">Søk i hjelpesenteret</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Søk etter en artikkel ..." style={{ width: "100%", minHeight: 56, padding: "0 20px 0 50px", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-lg)", background: "var(--surface-card)", color: "var(--text-heading)", font: "inherit", fontSize: "var(--fs-md)", boxShadow: "var(--shadow-md)" }} />
          </label>
        </div>
      </section>

      <div style={{ maxWidth: 1050, margin: "0 auto", padding: "38px 20px 70px" }}>
        <section aria-labelledby="categories-heading">
          <h2 id="categories-heading" style={{ margin: "0 0 16px", color: "var(--text-heading)", fontSize: "var(--fs-h3)", fontWeight: 800 }}>Utforsk etter tema</h2>
          <div className="sdn-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 12 }}>
            {categories.map((category) => (
              <Link key={category.name} href={`/hjelp/kategori/${category.slug}`} style={{ display: "block", minHeight: 142, padding: 20, border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", background: "var(--surface-card)", color: "var(--text-heading)", textAlign: "left", textDecoration: "none", boxShadow: "var(--shadow-sm)" }}>
                <Icon name={category.icon} size={25} color="var(--icon-brand)" />
                <strong style={{ display: "block", marginTop: 13, fontSize: "var(--fs-md)" }}>{category.name}</strong>
                <span style={{ display: "block", marginTop: 5, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{category.description}</span>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="articles-heading" style={{ marginTop: 48 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginBottom: 14 }}>
            <h2 id="articles-heading" style={{ margin: 0, color: "var(--text-heading)", fontSize: "var(--fs-h3)", fontWeight: 800 }}>Alle artikler</h2>
            <span style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{filteredArticles.length} artikler</span>
          </div>
          <div className="sdn-stagger" style={{ display: "grid", gap: 8 }}>
            {filteredArticles.map((article) => (
              <Link key={article.slug} href={`/hjelp/${article.slug}`} style={{ display: "flex", alignItems: "center", gap: 16, padding: "17px 18px", borderBottom: "1px solid var(--border-subtle)", color: "inherit", textDecoration: "none" }}>
                <Icon name={article.icon} size={20} color="var(--icon-brand)" />
                <span style={{ minWidth: 0, flex: 1 }}><strong style={{ display: "block", color: "var(--text-heading)", fontSize: "var(--fs-md)" }}>{article.title}</strong><span style={{ display: "block", marginTop: 3, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{article.description}</span></span>
                <span style={{ color: "var(--text-muted)", fontSize: "var(--fs-xs)", whiteSpace: "nowrap" }}>{article.readTime}</span>
                <Icon name="arrow-right" size={17} color="var(--text-muted)" />
              </Link>
            ))}
          </div>
          {filteredArticles.length === 0 && <p style={{ padding: "24px 0", color: "var(--text-muted)" }}>Fant ingen artikler som passer søket.</p>}
        </section>
      </div>
    </main>
  );
}
