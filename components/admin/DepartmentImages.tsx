"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ds/Icon";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { ImageUploader } from "./ImageUploader";

type Column = "logo_url" | "banner_url";

export function DepartmentImages({
  deptId,
  logoOverride,
  bannerOverride,
  logoInherited,
  bannerInherited,
}: {
  deptId: string;
  logoOverride: string | null;
  bannerOverride: string | null;
  logoInherited: string | null;
  bannerInherited: string | null;
}) {
  const { t } = useI18n();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Field
        deptId={deptId}
        column="banner_url"
        label={t.orgadmin.banner}
        override={bannerOverride}
        inherited={bannerInherited}
        aspect="3 / 1"
        recommended="1200 × 400 px · 3:1"
        expectedRatio={3}
      />
      <Field
        deptId={deptId}
        column="logo_url"
        label={t.orgadmin.logo}
        override={logoOverride}
        inherited={logoInherited}
        aspect="1 / 1"
        recommended="400 × 400 px · 1:1"
        expectedRatio={1}
      />
    </div>
  );
}

function Field({
  deptId,
  column,
  label,
  override,
  inherited,
  aspect,
  recommended,
  expectedRatio,
}: {
  deptId: string;
  column: Column;
  label: string;
  override: string | null;
  inherited: string | null;
  aspect: string;
  recommended: string;
  expectedRatio: number;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const supabase = createClient();
  // Custom when there's an override, or the user explicitly switched to custom.
  const [custom, setCustom] = useState(override != null);

  const revertToInherited = async () => {
    await supabase.from("org_profiles").update({ [column]: null }).eq("id", deptId);
    setCustom(false);
    router.refresh();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: "var(--fs-sm)", fontWeight: 600 }}>{label}</div>
        <div style={{ display: "inline-flex", borderRadius: "var(--radius-pill)", overflow: "hidden" }}>
          <Toggle active={!custom} onClick={() => (override != null ? revertToInherited() : setCustom(false))}>
            {t.orgadmin.inheritField}
          </Toggle>
          <Toggle active={custom} left onClick={() => setCustom(true)}>
            {t.orgadmin.customField}
          </Toggle>
        </div>
      </div>

      {custom ? (
        <ImageUploader
          rowId={deptId}
          table="org_profiles"
          pathPrefix={`profile/${deptId}`}
          column={column}
          currentUrl={override}
          aspect={aspect}
          recommended={recommended}
          expectedRatio={expectedRatio}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            style={{
              aspectRatio: aspect,
              maxWidth: column === "banner_url" ? "100%" : 160,
              background: "var(--surface-sunk)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.85,
            }}
          >
            {inherited ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={inherited} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Icon name="image" size={28} color="var(--stone-300)" />
            )}
          </div>
          <p style={{ margin: 0, fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{t.orgadmin.inheritActive}</p>
        </div>
      )}
    </div>
  );
}

function Toggle({ active, left, onClick, children }: { active: boolean; left?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        border: "1px solid var(--border-subtle)",
        borderLeft: left ? "none" : "1px solid var(--border-subtle)",
        padding: "3px 10px",
        fontSize: "var(--fs-xs)",
        fontWeight: 600,
        cursor: "pointer",
        background: active ? "var(--fjord-50)" : "transparent",
        color: active ? "var(--fjord-700)" : "var(--text-muted)",
      }}
    >
      {children}
    </button>
  );
}
