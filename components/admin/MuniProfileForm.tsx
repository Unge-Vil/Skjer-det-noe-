"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds/Button";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { SocialLinksEditor } from "./SocialLinksEditor";
import type { SocialLinks } from "@/components/ds/socials";

const card = {
  background: "var(--surface-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-lg)",
  padding: 20,
} as const;

export function MuniProfileForm({
  municipalityId,
  initialSocialLinks,
}: {
  municipalityId: string;
  initialSocialLinks: SocialLinks;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const supabase = createClient();

  const [socialLinks, setSocialLinks] = useState<SocialLinks>(initialSocialLinks);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDone(false);
    setBusy(true);
    const { error } = await supabase
      .from("municipalities")
      .update({ social_links: socialLinks })
      .eq("id", municipalityId);
    setBusy(false);
    if (error) {
      setError(t.kommune.saveError);
      return;
    }
    setDone(true);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-3xl" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      <section style={{ ...card, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <h2 style={{ margin: "0 0 2px", fontSize: "var(--fs-h4)", fontWeight: 700 }}>{t.orgadmin.social}</h2>
          <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>{t.kommune.profileHint}</p>
        </div>
        <SocialLinksEditor value={socialLinks} onChange={setSocialLinks} />
      </section>

      {error && <p style={{ margin: 0, color: "var(--danger-text)", fontSize: "var(--fs-sm)" }}>{error}</p>}

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Button type="submit" loading={busy}>{busy ? t.kommune.saving : t.orgadmin.save}</Button>
        {done && <span style={{ color: "var(--success-text)", fontSize: "var(--fs-sm)", fontWeight: 600 }}>{t.kommune.profileSaved}</span>}
      </div>
    </form>
  );
}
