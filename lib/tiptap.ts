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
