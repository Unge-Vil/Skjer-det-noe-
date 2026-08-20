"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { HELP_AUDIENCES, HELP_CATEGORIES, type HelpArticle, type HelpAudience, type HelpCategory } from "@/lib/help";

export function HelpDirectory({ articles }: { articles: HelpArticle[] }) {
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState<HelpAudience | "alle">("alle");
  const [category, setCategory] = useState<HelpCategory | "alle">("alle");
  const normalizedQuery = query.trim().toLocaleLowerCase("nb-NO");

  const filteredArticles = useMemo(
    () => articles.filter((article) => {
      const searchable = [article.title, article.excerpt, ...article.keywords].join(" ").toLocaleLowerCase("nb-NO");
      return (
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (audience === "alle" || article.audience.includes(audience)) &&
        (category === "alle" || article.category === category)
      );
    }),
    [articles, audience, category, normalizedQuery],
  );

  return (
    <section aria-label="Søk i hjelp" style={{ display: "grid", gap: 24 }}>
      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "var(--fs-xl)", fontWeight: 800 }}>Hva gjelder det?</h2>
          <p style={{ margin: "5px 0 0", color: "var(--text-muted)" }}>Velg den inngangen som passer best for deg.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
          <button type="button" onClick={() => setAudience("alle")} aria-pressed={audience === "alle"} style={audienceCardStyle(audience === "alle")}>
            <strong>Alle guider</strong>
            <span>Se hele hjelpesenteret.</span>
          </button>
          {HELP_AUDIENCES.map((item) => (
            <button key={item.id} type="button" onClick={() => setAudience(item.id)} aria-pressed={audience === item.id} style={audienceCardStyle(audience === item.id)}>
              <strong>{item.label}</strong>
              <span>{item.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <label htmlFor="help-search" style={{ fontWeight: 700 }}>Hva trenger du hjelp med?</label>
        <input
          id="help-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Søk etter en guide"
          style={{ width: "100%", minHeight: 48, padding: "10px 14px", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-sm)", background: "var(--surface-card)", color: "var(--text-primary)", font: "inherit" }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
        <label style={{ display: "grid", gap: 6, fontSize: "var(--fs-sm)", fontWeight: 700 }}>
          Målgruppe
          <select value={audience} onChange={(event) => setAudience(event.target.value as HelpAudience | "alle")} style={selectStyle}>
            <option value="alle">Alle målgrupper</option>
            {HELP_AUDIENCES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label style={{ display: "grid", gap: 6, fontSize: "var(--fs-sm)", fontWeight: 700 }}>
          Tema
          <select value={category} onChange={(event) => setCategory(event.target.value as HelpCategory | "alle")} style={selectStyle}>
            <option value="alle">Alle temaer</option>
            {HELP_CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
      </div>

      <p aria-live="polite" style={{ margin: 0, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
        {filteredArticles.length} {filteredArticles.length === 1 ? "guide" : "guider"}
      </p>

      {filteredArticles.length > 0 ? (
        <div style={{ display: "grid", gap: 12 }}>
          {filteredArticles.map((article) => (
            <Link key={article.slug} href={`/hjelp/${article.slug}`} style={articleStyle}>
              <span style={{ color: "var(--text-muted)", fontSize: "var(--fs-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{article.category}</span>
              <strong style={{ color: "var(--text-primary)", fontSize: "var(--fs-lg)" }}>{article.title}</strong>
              <span style={{ color: "var(--text-muted)" }}>{article.excerpt}</span>
            </Link>
          ))}
        </div>
      ) : (
        <div style={{ padding: 24, border: "1px dashed var(--border-strong)", borderRadius: "var(--radius-sm)" }}>
          <h2 style={{ margin: "0 0 8px", fontSize: "var(--fs-lg)" }}>Ingen guider funnet</h2>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>Prøv et annet søkeord eller fjern et filter.</p>
        </div>
      )}
    </section>
  );
}

const selectStyle = { width: "100%", minHeight: 44, padding: "8px 12px", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-sm)", background: "var(--surface-card)", color: "var(--text-primary)", font: "inherit" } as const;
const articleStyle = { display: "grid", gap: 7, padding: 20, border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--surface-card)", textDecoration: "none", transition: "transform var(--dur-fast) var(--ease-soft), box-shadow var(--dur-fast) var(--ease-soft)" } as const;
const audienceCardStyle = (selected: boolean) => ({ display: "grid", gap: 6, minHeight: 92, padding: "15px 16px", border: selected ? "2px solid var(--accent)" : "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: selected ? "var(--surface-brand-soft)" : "var(--surface-card)", color: "var(--text-primary)", textAlign: "left" as const, font: "inherit", cursor: "pointer", transition: "background var(--dur-fast) var(--ease-soft), border-color var(--dur-fast) var(--ease-soft)" });