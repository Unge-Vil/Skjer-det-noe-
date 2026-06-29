import type { Config, Data } from "@measured/puck";

// Block props for the municipality page builder.
export type PuckProps = {
  Heading: { text: string; level: "2" | "3" };
  Text: { text: string };
  Image: { url: string; alt: string };
  Button: { label: string; href: string };
  Spacer: { size: "small" | "medium" | "large" };
};

// Page-level metadata edited in Puck's root sidebar.
export type PuckRoot = {
  title: string;
  titleEn: string;
  slug: string;
  status: "draft" | "published";
};

const SPACER: Record<PuckProps["Spacer"]["size"], number> = { small: 16, medium: 32, large: 64 };

export const puckConfig: Config<PuckProps, PuckRoot> = {
  root: {
    fields: {
      title: { type: "text", label: "Tittel" },
      titleEn: { type: "text", label: "Tittel (engelsk)" },
      slug: { type: "text", label: "Nettadresse (slug)" },
      status: {
        type: "select",
        label: "Status",
        options: [
          { label: "Utkast", value: "draft" },
          { label: "Publisert", value: "published" },
        ],
      },
    },
    defaultProps: { title: "", titleEn: "", slug: "", status: "draft" },
    render: ({ children }) => <div className="sdn-puck">{children}</div>,
  },
  components: {
    Heading: {
      label: "Overskrift",
      fields: {
        text: { type: "text", label: "Tekst" },
        level: {
          type: "select",
          label: "Nivå",
          options: [
            { label: "Stor (H2)", value: "2" },
            { label: "Mindre (H3)", value: "3" },
          ],
        },
      },
      defaultProps: { text: "Overskrift", level: "2" },
      render: ({ text, level }) =>
        level === "3" ? (
          <h3 style={{ fontSize: "var(--fs-h4)", fontWeight: 700, margin: "1em 0 0.35em" }}>{text}</h3>
        ) : (
          <h2 style={{ fontSize: "var(--fs-h3)", fontWeight: 700, margin: "1.2em 0 0.4em" }}>{text}</h2>
        ),
    },
    Text: {
      label: "Tekst",
      fields: { text: { type: "textarea", label: "Tekst" } },
      defaultProps: { text: "Skriv inn tekst her." },
      render: ({ text }) => (
        <p style={{ margin: "0 0 0.8em", lineHeight: 1.65, whiteSpace: "pre-wrap", color: "var(--text-body)" }}>{text}</p>
      ),
    },
    Image: {
      label: "Bilde",
      fields: {
        url: { type: "text", label: "Bilde-URL" },
        alt: { type: "text", label: "Alt-tekst" },
      },
      defaultProps: { url: "", alt: "" },
      render: ({ url, alt }) =>
        url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={alt} style={{ maxWidth: "100%", borderRadius: "var(--radius-md)", margin: "0 0 0.8em" }} />
        ) : (
          <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", background: "var(--surface-sunk)", borderRadius: "var(--radius-md)" }}>
            Bilde
          </div>
        ),
    },
    Button: {
      label: "Knapp / lenke",
      fields: {
        label: { type: "text", label: "Tekst" },
        href: { type: "text", label: "Lenke (URL)" },
      },
      defaultProps: { label: "Les mer", href: "#" },
      render: ({ label, href }) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "10px 18px",
            margin: "0 0 0.8em",
            borderRadius: "var(--radius-md)",
            background: "var(--surface-brand-strong)",
            color: "#fff",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          {label}
        </a>
      ),
    },
    Spacer: {
      label: "Luft",
      fields: {
        size: {
          type: "select",
          label: "Størrelse",
          options: [
            { label: "Liten", value: "small" },
            { label: "Middels", value: "medium" },
            { label: "Stor", value: "large" },
          ],
        },
      },
      defaultProps: { size: "medium" },
      render: ({ size }) => <div aria-hidden="true" style={{ height: SPACER[size] }} />,
    },
  },
};

/** Build Puck editor data from stored content + denormalised metadata columns. */
export function toPuckData(content: unknown, root: PuckRoot): Data {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = content as any;
  const blocks = c && Array.isArray(c.content) ? c.content : [];
  const zones = c && typeof c.zones === "object" ? c.zones : {};
  return { content: blocks, root: { props: root }, zones } as Data;
}
