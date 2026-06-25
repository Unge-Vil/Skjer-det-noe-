"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds/Button";
import { useI18n } from "@/components/i18n/LocaleProvider";

export function DeleteButton({
  table,
  id,
}: {
  table: "activities" | "events";
  id: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        if (!confirm(t.admin.confirmDelete)) return;
        await createClient().from(table).delete().eq("id", id);
        router.refresh();
      }}
    >
      {t.admin.delete}
    </Button>
  );
}
