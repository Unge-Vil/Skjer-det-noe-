"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ds/Button";
import { useI18n } from "@/components/i18n/LocaleProvider";

export function LogoutButton() {
  const { t } = useI18n();
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={async () => {
        const { error } = await createClient().auth.signOut({ scope: "local" });
        if (!error) window.location.assign("/");
      }}
    >
      {t.auth.logout}
    </Button>
  );
}
