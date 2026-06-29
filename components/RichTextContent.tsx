import { generateHTML } from "@tiptap/html/server";
import { tiptapExtensions, isEmptyDoc } from "@/lib/tiptap";

/** Server-side renderer for a stored Tiptap document. The HTML comes from a
 *  controlled schema (no arbitrary tags), so it is safe to inject. */
export function RichTextContent({ doc }: { doc: unknown }) {
  if (isEmptyDoc(doc)) return null;
  // doc is a controlled ProseMirror document loaded from our own DB.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html = generateHTML(doc as any, tiptapExtensions);
  return (
    <div
      className="sdn-richtext"
      style={{ minHeight: 0, padding: 0 }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
