import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ds/Icon";
import { SiteFooter } from "@/components/SiteFooter";
import { getHelpCategory, helpArticles } from "@/lib/help";

export const dynamic = "force-dynamic";

export default async function HelpCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const category = getHelpCategory(slug);
  if (!category) notFound();
  const articles = helpArticles.filter((article) => article.category === category);

  return (
    <>
      <main id="main" className="sdn-page-enter" style={{ maxWidth: 900, margin: "0 auto", padding: "42px 20px 70px" }}>
        <Link href="/hjelp" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--text-link)", fontSize: "var(--fs-sm)", fontWeight: 700, textDecoration: "none" }}><Icon name="arrow-left" size={16} /> Til hjelpesenteret</Link>
        <p style={{ margin: "48px 0 10px", color: "var(--text-brand)", fontSize: "var(--fs-sm)", fontWeight: 800 }}>Hjelpesenter</p>
        <h1 style={{ margin: "0 0 12px", color: "var(--text-heading)", fontSize: "var(--fs-h1)", lineHeight: 1.08, fontWeight: 850 }}>{category}</h1>
        <p style={{ margin: "0 0 34px", color: "var(--text-muted)", fontSize: "var(--fs-lg)" }}>{articles.length} artikler i denne kategorien</p>
        <section aria-label={`Artikler i ${category}`} style={{ display: "grid", gap: 8 }}>
          {articles.map((article) => (
            <Link key={article.slug} href={`/hjelp/${article.slug}`} style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 18px", borderBottom: "1px solid var(--border-subtle)", color: "inherit", textDecoration: "none" }}>
              <span style={{ display: "grid", placeItems: "center", flex: "0 0 42px", width: 42, height: 42, borderRadius: "var(--radius-md)", background: "var(--surface-brand-soft)" }}><Icon name={article.icon} size={20} color="var(--icon-brand)" /></span>
              <span style={{ minWidth: 0, flex: 1 }}><strong style={{ display: "block", color: "var(--text-heading)", fontSize: "var(--fs-md)" }}>{article.title}</strong><span style={{ display: "block", marginTop: 4, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{article.description}</span></span>
              <span style={{ color: "var(--text-muted)", fontSize: "var(--fs-xs)", whiteSpace: "nowrap" }}>{article.readTime}</span>
              <Icon name="arrow-right" size={17} color="var(--text-muted)" />
            </Link>
          ))}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
