import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ds/Icon";
import { SiteFooter } from "@/components/SiteFooter";
import { getHelpArticle, helpArticles, type HelpSection } from "@/lib/help";

export const dynamic = "force-dynamic";

function SectionBody({ section }: { section: HelpSection }) {
  return (
    <>
      {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      {section.list && (
        <ul>
          {section.list.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
      {section.cards && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))", gap: 12, margin: "6px 0 8px" }}>
          {section.cards.map((cardItem) => (
            <div key={cardItem.title} style={{ padding: 16, border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", background: "var(--surface-card)", boxShadow: "var(--shadow-sm)" }}>
              <span style={{ display: "grid", placeItems: "center", width: 38, height: 38, borderRadius: "var(--radius-sm)", background: "var(--surface-brand-soft)" }}>
                <Icon name={cardItem.icon} size={20} color="var(--icon-brand)" />
              </span>
              <strong style={{ display: "block", margin: "11px 0 5px", color: "var(--text-heading)", fontSize: "var(--fs-sm)" }}>{cardItem.title}</strong>
              <span style={{ display: "block", color: "var(--text-muted)", fontSize: "var(--fs-sm)", lineHeight: 1.5 }}>{cardItem.body}</span>
            </div>
          ))}
        </div>
      )}
      {section.callout && (
        <aside style={{ display: "flex", gap: 13, margin: "18px 0", padding: "15px 17px", borderLeft: "4px solid var(--accent)", borderRadius: "0 var(--radius-md) var(--radius-md) 0", background: "var(--surface-sunk)" }}>
          <span style={{ flex: "0 0 auto", marginTop: 1 }}><Icon name={section.callout.icon} size={20} color="var(--icon-brand)" /></span>
          <span style={{ fontSize: "var(--fs-sm)", lineHeight: 1.55 }}>
            <strong style={{ display: "block", color: "var(--text-heading)" }}>{section.callout.title}</strong>
            <span style={{ color: "var(--text-body)" }}>{section.callout.body}</span>
          </span>
        </aside>
      )}
      {section.link && (
        <p style={{ margin: "4px 0 0" }}>
          <Link href={section.link.href} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 15px", borderRadius: "var(--radius-pill)", background: "var(--surface-brand-soft)", color: "var(--text-link)", fontWeight: 700, fontSize: "var(--fs-sm)", textDecoration: "none" }}>
            {section.link.label} <Icon name="arrow-right" size={15} />
          </Link>
        </p>
      )}
    </>
  );
}

export default async function HelpArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const article = getHelpArticle((await params).slug);
  if (!article) notFound();

  return (
    <>
      <main id="main" className="sdn-page-enter" style={{ maxWidth: 820, margin: "0 auto", padding: "42px 20px 70px" }}>
        <Link href="/hjelp" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--text-link)", fontSize: "var(--fs-sm)", fontWeight: 700, textDecoration: "none" }}><Icon name="arrow-left" size={16} /> Til hjelpesenteret</Link>
        <div style={{ display: "flex", alignItems: "center", gap: 18, margin: "42px 0 20px", padding: 20, border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", background: "var(--surface-brand-soft)" }}>
          <span style={{ display: "grid", placeItems: "center", flex: "0 0 58px", width: 58, height: 58, borderRadius: "var(--radius-md)", background: "var(--surface-card)", boxShadow: "var(--shadow-sm)" }}><Icon name={article.icon} size={28} color="var(--icon-brand)" /></span>
          <span><strong style={{ display: "block", color: "var(--text-brand)", fontSize: "var(--fs-sm)" }}>{article.category}</strong><span style={{ display: "block", marginTop: 4, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>Veiledning · {article.readTime} lesetid</span></span>
        </div>
        <h1 style={{ margin: "0 0 12px", color: "var(--text-heading)", fontSize: "var(--fs-h1)", lineHeight: 1.08, fontWeight: 850 }}>{article.title}</h1>
        <p style={{ margin: "0 0 34px", color: "var(--text-muted)", fontSize: "var(--fs-lg)", lineHeight: 1.5 }}>{article.description}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 34 }}>
          {article.sections.map((section, index) => <a key={section.heading} href={`#section-${index + 1}`} style={{ padding: "7px 11px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-pill)", color: "var(--text-muted)", fontSize: "var(--fs-xs)", textDecoration: "none" }}>{section.heading}</a>)}
        </div>
        <article className="sdn-richtext" style={{ padding: 0 }}>
          {article.sections.map((section, index) => (
            <section key={section.heading} id={`section-${index + 1}`}>
              <h2>{section.heading}</h2>
              <SectionBody section={section} />
            </section>
          ))}
        </article>
        <nav aria-label="Flere artikler" style={{ marginTop: 48, paddingTop: 22, borderTop: "1px solid var(--border-subtle)" }}>
          <p style={{ margin: "0 0 10px", color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>Flere artikler</p>
          {helpArticles.filter((item) => item.slug !== article.slug).slice(0, 3).map((item) => <Link key={item.slug} href={`/hjelp/${item.slug}`} style={{ display: "block", padding: "9px 0", color: "var(--text-link)", fontWeight: 700, textDecoration: "none" }}>{item.title}</Link>)}
        </nav>
      </main>
      <SiteFooter />
    </>
  );
}