import StarterKit from "@tiptap/starter-kit";

// Shared extension set — used both by the editor (client) and by
// generateHTML when rendering stored documents on the server. Keeping a single
// source of truth guarantees the saved JSON renders the same in both places.
export const tiptapExtensions = [StarterKit];

export const EMPTY_DOC = { type: "doc", content: [] };

/** True when a stored document has no meaningful content. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isEmptyDoc(doc: any): boolean {
  if (!doc || typeof doc !== "object" || !Array.isArray(doc.content)) return true;
  return doc.content.length === 0;
}

/** Flatten a ProseMirror document to plain text (block nodes separated by newlines). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function docToPlainText(doc: any): string {
  if (!doc || typeof doc !== "object") return "";
  const blocks: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const walkInline = (node: any): string => {
    if (!node) return "";
    if (node.type === "text") return node.text ?? "";
    if (Array.isArray(node.content)) return node.content.map(walkInline).join("");
    return "";
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const walkBlock = (node: any) => {
    if (!node) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (Array.isArray(node.content) && node.content.some((c: any) => c.type === "text")) {
      blocks.push(walkInline(node));
    } else if (Array.isArray(node.content)) {
      node.content.forEach(walkBlock);
    }
  };
  walkBlock(doc);
  return blocks.join("\n").trim();
}

/** Wrap legacy plain text into a minimal ProseMirror document. */
export function plainTextToDoc(text: string) {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return EMPTY_DOC;
  return {
    type: "doc",
    content: trimmed.split(/\n{2,}/).map((para) => ({
      type: "paragraph",
      content: para ? [{ type: "text", text: para }] : [],
    })),
  };
}
