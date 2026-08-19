"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds/Button";
import { useI18n } from "@/components/i18n/LocaleProvider";

/** Approve (publish) or unpublish an organisation. */
export function OrgStatusButton({ id, status }: { id: string; status: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const publish = status !== "published";

  return (
    <Button
      size="sm"
      variant={publish ? "primary" : "secondary"}
      leadingIcon={publish ? "sparkles" : undefined}
      onClick={async () => {
        const { error } = await createClient().rpc("moderate_organization", {
          p_organization: id,
          p_status: publish ? "published" : "draft",
        });
        if (!error) router.refresh();
      }}
    >
      {publish ? t.kommune.approve : t.kommune.unpublish}
    </Button>
  );
}
