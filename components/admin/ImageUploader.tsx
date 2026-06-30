"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds/Button";
import { Icon } from "@/components/ds/Icon";
import { useI18n } from "@/components/i18n/LocaleProvider";

export function ImageUploader({
  rowId,
  table = "organizations",
  pathPrefix,
  column,
  label,
  currentUrl,
  aspect = "1 / 1",
  recommended,
  expectedRatio,
}: {
  rowId: string;
  /** Table whose row holds the image column. Defaults to organizations. */
  table?: "organizations" | "organization_municipalities" | "org_profiles";
  /** Storage path prefix; defaults to `org/<rowId>`. */
  pathPrefix?: string;
  column: "logo_url" | "banner_url";
  label?: string;
  currentUrl: string | null;
  aspect?: string;
  /** Display string for recommended pixel size, e.g. "1200 × 400 px". */
  recommended?: string;
  /** Expected width/height ratio; a deviating upload triggers a soft warning. */
  expectedRatio?: number;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const checkRatio = (file: File) =>
    new Promise<void>((resolve) => {
      if (!expectedRatio) return resolve();
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        // Warn when off by more than ~12% from the recommended aspect.
        if (Math.abs(ratio - expectedRatio) / expectedRatio > 0.12) {
          setWarning(t.orgadmin.imageRatioWarning);
        }
        URL.revokeObjectURL(url);
        resolve();
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      img.src = url;
    });

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setWarning(null);
    await checkRatio(file);
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${pathPrefix ?? `org/${rowId}`}/${column}-${Date.now()}.${ext}`;
      const up = await supabase.storage.from("media").upload(path, file, { upsert: true });
      if (up.error) throw up.error;
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      const { error } = await supabase.from(table).update({ [column]: data.publicUrl }).eq("id", rowId);
      if (error) throw error;
      router.refresh();
    } catch {
      setError(t.orgadmin.uploadError);
    } finally {
      setBusy(false);
    }
  };

  const removeImage = async () => {
    setBusy(true);
    await supabase.from(table).update({ [column]: null }).eq("id", rowId);
    setBusy(false);
    router.refresh();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {label && <div style={{ fontSize: "var(--fs-sm)", fontWeight: 600 }}>{label}</div>}
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
        }}
      >
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Icon name="image" size={28} color="var(--stone-300)" />
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={onFile} />
      <div style={{ display: "flex", gap: 8 }}>
        <Button variant="secondary" size="sm" leadingIcon="image" loading={busy} onClick={() => inputRef.current?.click()}>
          {busy ? t.orgadmin.uploading : t.orgadmin.upload}
        </Button>
        {currentUrl && (
          <Button variant="ghost" size="sm" onClick={removeImage}>{t.orgadmin.removeImage}</Button>
        )}
      </div>
      <p style={{ margin: 0, fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>
        {t.orgadmin.imageHint}
        {recommended && ` ${t.orgadmin.imageRecommended}: ${recommended}.`}
      </p>
      {warning && <p style={{ margin: 0, fontSize: "var(--fs-xs)", color: "var(--warning-600)" }}>{warning}</p>}
      {error && <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--danger-600)" }}>{error}</p>}
    </div>
  );
}
