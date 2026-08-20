"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { tiptapExtensions, EMPTY_DOC } from "@/lib/tiptap";
import { Icon, type IconName } from "@/components/ds/Icon";

/** Controlled rich-text editor. Emits the ProseMirror document as JSON. */
export function RichTextEditor({
  value,
  onChange,
  ariaLabel,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (json: any) => void;
  ariaLabel?: string;
}) {
  const editor = useEditor({
    extensions: tiptapExtensions,
    content: value ?? EMPTY_DOC,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "sdn-richtext",
        ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
  });

  if (!editor) {
    return (
      <div
        style={{
          minHeight: 180,
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          background: "var(--surface-card)",
        }}
      />
    );
  }

  return (
    <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", overflow: "hidden", background: "var(--surface-card)" }}>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div
      role="toolbar"
      aria-label="Formater tekst"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
        padding: 6,
        borderBottom: "1px solid var(--border-subtle)",
        background: "var(--surface-sunk)",
      }}
    >
      <Btn icon="bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} label="Fet" />
      <Btn icon="italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} label="Kursiv" />
      <Sep />
      <Btn icon="heading-2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} label="Overskrift 2" />
      <Btn icon="heading-3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} label="Overskrift 3" />
      <Sep />
      <Btn icon="list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} label="Punktliste" />
      <Btn icon="list-ordered" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} label="Nummerert liste" />
      <Btn icon="quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} label="Sitat" />
      <Sep />
      <Btn icon="undo" active={false} onClick={() => editor.chain().focus().undo().run()} label="Angre" />
      <Btn icon="redo" active={false} onClick={() => editor.chain().focus().redo().run()} label="Gjør om" />
    </div>
  );
}

function Sep() {
  return <span aria-hidden="true" style={{ width: 1, alignSelf: "stretch", margin: "2px 4px", background: "var(--border-subtle)" }} />;
}

function Btn({ icon, active, onClick, label }: { icon: IconName; active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        border: "none",
        borderRadius: "var(--radius-sm)",
        background: active ? "var(--surface-brand-soft)" : "transparent",
        color: active ? "var(--text-brand)" : "var(--text-body)",
        cursor: "pointer",
      }}
    >
      <Icon name={icon} size={17} />
    </button>
  );
}
