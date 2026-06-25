"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds/Button";
import { useI18n } from "@/components/i18n/LocaleProvider";

export function LogoutButton() {
  const { t } = useI18n();
  const router = useRouter();
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={async () => {
        await createClient().auth.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      {t.auth.logout}
    </Button>
  );
}
