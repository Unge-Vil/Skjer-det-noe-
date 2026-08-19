"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds/Button";
import { useI18n } from "@/components/i18n/LocaleProvider";

export function DirectoryStatusButton({ id, status }: { id: string; status: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const publish = status !== "published";

  return (
    <Button
      size="sm"
      variant={publish ? "primary" : "secondary"}
      leadingIcon={publish ? "sparkles" : undefined}
      onClick={async () => {
        await createClient().rpc("moderate_directory_listing", {
          p_listing: id,
          p_status: publish ? "published" : "draft",
        });
        router.refresh();
      }}
    >
      {publish ? t.kommune.moderate : t.kommune.unpublishContent}
    </Button>
  );
}
