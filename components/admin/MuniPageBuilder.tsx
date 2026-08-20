"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Puck, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { createClient } from "@/lib/supabase/client";
import { puckConfig, type PuckRoot } from "@/lib/puck/config";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { Icon } from "@/components/ds/Icon";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[æå]/g, "a")
    .replace(/ø/g, "o")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function MuniPageBuilder({
  municipalityId,
  pageId,
  initialData,
}: {
  municipalityId: string;
  pageId: string | null;
  initialData: Data;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [tooNarrow, setTooNarrow] = useState(false);

  // The Puck editor's side panels are unusable below tablet width — gate it.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setTooNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const save = async (data: Data) => {
    setError(null);
    const root = (data.root.props ?? {}) as PuckRoot;
    const finalSlug = slugify(root.slug || root.title || "") || "side";
    const row = {
      municipality_id: municipalityId,
      title: (root.title || "").trim() || finalSlug,
      title_en: (root.titleEn || "").trim() || null,
      slug: finalSlug,
      content: data,
      status: root.status === "published" ? "published" : "draft",
    };

    if (pageId) {
      const { error } = await supabase.from("municipality_pages").update(row).eq("id", pageId);
      if (error) return setError(t.kommune.saveError);
      router.refresh();
    } else {
      const { data: inserted, error } = await supabase
        .from("municipality_pages")
        .insert(row)
        .select("id")
        .single();
      if (error || !inserted) return setError(t.kommune.saveError);
      router.replace(`/kommune/sider/${inserted.id}`);
      router.refresh();
    }
  };

  const remove = async () => {
    if (!pageId) return;
    if (!confirm(t.kommune.confirmDeletePage)) return;
    await supabase.from("municipality_pages").delete().eq("id", pageId);
    router.replace("/kommune/sider");
    router.refresh();
  };

  return (
    <div
      style={{
        // Fill the space under the (sticky) admin header. isolation:isolate keeps
        // Puck's own chrome from stacking over the admin header.
        height: "calc(100dvh - 65px)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        isolation: "isolate",
      }}
    >
      {error && (
        <p role="alert" style={{ margin: 0, padding: "8px 16px", color: "var(--danger-text)", fontSize: "var(--fs-sm)" }}>{error}</p>
      )}
      {tooNarrow ? (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: "32px 24px",
            textAlign: "center",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: "var(--radius-pill)",
              background: "var(--surface-brand-soft)",
              color: "var(--text-brand)",
            }}
          >
            <Icon name="monitor" size={26} color="var(--icon-brand)" />
          </span>
          <h2 style={{ margin: 0, fontSize: "var(--fs-h4)", fontWeight: 700 }}>{t.kommune.builderDesktopTitle}</h2>
          <p style={{ margin: 0, maxWidth: 340, lineHeight: 1.6, color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.kommune.builderDesktopHint}</p>
        </div>
      ) : (
      <div style={{ flex: 1, minHeight: 0 }}>
        <Puck
          config={puckConfig}
          data={initialData}
          onPublish={save}
          overrides={{
            headerActions: ({ children }) => (
              <>
                {pageId && (
                  <button
                    type="button"
                    onClick={remove}
                    style={{
                      marginRight: 8,
                      padding: "8px 14px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-subtle)",
                      background: "transparent",
                      color: "var(--danger-text)",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {t.kommune.deletePage}
                  </button>
                )}
                {children}
              </>
            ),
          }}
        />
      </div>
      )}
    </div>
  );
}
