import type { Config, Data } from "@puckeditor/core";
import type { ComponentType, CSSProperties } from "react";

// Block props for the municipality page builder.
export type PuckProps = {
  Heading: { text: string; level: "2" | "3" };
  Text: { text: string };
  RichText: { body: string };
  Columns: { left: unknown; right: unknown };
  Image: { url: string; alt: string; caption: string };
  Button: { label: string; href: string };
  Card: { imageUrl: string; title: string; text: string; linkLabel: string; linkHref: string };
  Video: { url: string };
  Embed: { url: string; height: number };
  Divider: Record<string, never>;
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
const card = {
  background: "var(--surface-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-lg)",
} as const;

/** Turn a YouTube/Vimeo/other URL into an embeddable src. */
function videoEmbed(url: string): string {
  if (!url) return "";
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return url; // assume it is already an embeddable URL
}

/** Smart-convert Google/Microsoft Forms share links to their embeddable form. */
function embedSrc(url: string): string {
  if (!url) return "";
  if (/docs\.google\.com\/forms\/.+\/viewform/.test(url) && !/[?&]embedded=true/.test(url)) {
    return url + (url.includes("?") ? "&" : "?") + "embedded=true";
  }
  if (/forms\.(office|microsoft)\.com\//.test(url) && !/[?&]embed=true/.test(url)) {
    return url + (url.includes("?") ? "&" : "?") + "embed=true";
  }
  return url;
}

function Placeholder({ label }: { label: string }) {
  return (
    <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", background: "var(--surface-sunk)", borderRadius: "var(--radius-md)", margin: "0 0 0.8em" }}>
      {label}
    </div>
  );
}

export const puckConfig: Config<PuckProps, PuckRoot> = {
  categories: {
    content: {
      title: "Innhold",
      components: ["Heading", "Text", "RichText", "Image", "Card"],
    },
    links: {
      title: "Lenker og media",
      components: ["Button", "Video", "Embed"],
    },
    layout: {
      title: "Oppsett",
      components: ["Columns", "Divider", "Spacer"],
    },
  },
  root: {
    fields: {
      title: { type: "text", label: "Tittel", placeholder: "F.eks. Fritidstilbud" },
      titleEn: { type: "text", label: "Tittel (engelsk)", placeholder: "Valgfritt" },
      slug: { type: "text", label: "Nettadresse (slug)", placeholder: "f.eks. fritidstilbud" },
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
        text: { type: "text", label: "Tekst", placeholder: "Skriv overskriften" },
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
      fields: { text: { type: "textarea", label: "Tekst", placeholder: "Skriv inn tekst her" } },
      defaultProps: { text: "Skriv inn tekst her." },
      render: ({ text }) => (
        <p style={{ margin: "0 0 0.8em", lineHeight: 1.65, whiteSpace: "pre-wrap", color: "var(--text-body)" }}>{text}</p>
      ),
    },
    RichText: {
      label: "Rik tekst",
      fields: { body: { type: "richtext", label: "Innhold", initialHeight: 180 } },
      defaultProps: { body: "Skriv inn innhold her." },
      render: ({ body }) => <div style={{ margin: "0 0 0.8em", lineHeight: 1.65 }}>{body}</div>,
    },
    Columns: {
      label: "To kolonner",
      fields: {
        left: { type: "slot", label: "Venstre kolonne" },
        right: { type: "slot", label: "Høyre kolonne" },
      },
      defaultProps: { left: [], right: [] },
      render: ({ left, right }) => {
        const Left = left as ComponentType<{ style?: CSSProperties }>;
        const Right = right as ComponentType<{ style?: CSSProperties }>;
        return (
          <div className="sdn-puck-columns" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 24, margin: "0 0 0.8em" }}>
            <Left />
            <Right />
          </div>
        );
      },
    },
    Image: {
      label: "Bilde",
      fields: {
        url: { type: "text", label: "Bilde-URL", placeholder: "https://… (lim inn lenke til bildet)" },
        alt: { type: "text", label: "Alt-tekst", placeholder: "Beskriv bildet for skjermlesere" },
        caption: { type: "text", label: "Bildetekst (valgfritt)", placeholder: "Vises under bildet" },
      },
      defaultProps: { url: "", alt: "", caption: "" },
      render: ({ url, alt, caption }) =>
        url ? (
          <figure style={{ margin: "0 0 0.8em" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={alt} style={{ maxWidth: "100%", borderRadius: "var(--radius-md)", display: "block" }} />
            {caption && (
              <figcaption style={{ marginTop: 6, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>{caption}</figcaption>
            )}
          </figure>
        ) : (
          <Placeholder label="Bilde" />
        ),
    },
    Button: {
      label: "Knapp / lenke",
      fields: {
        label: { type: "text", label: "Tekst", placeholder: "F.eks. Les mer" },
        href: { type: "text", label: "Lenke (URL)", placeholder: "https://…" },
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
    Card: {
      label: "Kort",
      fields: {
        imageUrl: { type: "text", label: "Bilde-URL (valgfritt)", placeholder: "https://…" },
        title: { type: "text", label: "Tittel", placeholder: "Korttittel" },
        text: { type: "textarea", label: "Tekst", placeholder: "Kort beskrivelse" },
        linkLabel: { type: "text", label: "Lenketekst (valgfritt)", placeholder: "F.eks. Les mer" },
        linkHref: { type: "text", label: "Lenke (URL)", placeholder: "https://…" },
      },
      defaultProps: { imageUrl: "", title: "Korttittel", text: "Kort beskrivelse.", linkLabel: "", linkHref: "" },
      render: ({ imageUrl, title, text, linkLabel, linkHref }) => (
        <div style={{ ...card, overflow: "hidden", margin: "0 0 0.8em" }}>
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={title || ""} style={{ width: "100%", display: "block", aspectRatio: "16 / 9", objectFit: "cover" }} />
          )}
          <div style={{ padding: 16 }}>
            {title && <h3 style={{ margin: "0 0 6px", fontSize: "var(--fs-h4)", fontWeight: 700 }}>{title}</h3>}
            {text && <p style={{ margin: 0, lineHeight: 1.6, color: "var(--text-body)", whiteSpace: "pre-wrap" }}>{text}</p>}
            {linkHref && (
              <a
                href={linkHref}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, color: "var(--text-link)", fontWeight: 600, textDecoration: "none" }}
              >
                {linkLabel || "Les mer"} →
              </a>
            )}
          </div>
        </div>
      ),
    },
    Video: {
      label: "Video (YouTube / Vimeo)",
      fields: {
        url: {
          type: "text",
          label: "Video-URL",
          placeholder: "https://www.youtube.com/watch?v=… eller vimeo.com/…",
        },
      },
      defaultProps: { url: "" },
      render: ({ url }) => {
        const src = videoEmbed(url);
        if (!src) return <Placeholder label="Lim inn en YouTube- eller Vimeo-lenke" />;
        return (
          <div style={{ position: "relative", paddingTop: "56.25%", margin: "0 0 0.8em", borderRadius: "var(--radius-md)", overflow: "hidden", background: "#000" }}>
            <iframe
              src={src}
              title="Video"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
            />
          </div>
        );
      },
    },
    Embed: {
      label: "Innebygging (skjema / kart / iframe)",
      fields: {
        url: {
          type: "text",
          label: "URL (Google Forms, Microsoft Forms, kart, …)",
          placeholder: "Lim inn delings-/innebyggingslenke",
        },
        height: { type: "number", label: "Høyde (px)", min: 120, max: 2000, step: 20 },
      },
      defaultProps: { url: "", height: 600 },
      render: ({ url, height }) => {
        const src = embedSrc(url);
        if (!src) return <Placeholder label="Lim inn en delings-/innebyggingslenke" />;
        return (
          <iframe
            src={src}
            title="Innebygging"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            style={{ width: "100%", height: Math.max(120, height || 600), border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", margin: "0 0 0.8em" }}
          />
        );
      },
    },
    Divider: {
      label: "Skillelinje",
      fields: {},
      defaultProps: {},
      render: () => <hr style={{ border: 0, borderTop: "1px solid var(--border-subtle)", margin: "1.4em 0" }} />,
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
