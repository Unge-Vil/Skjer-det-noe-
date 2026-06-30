import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { Icon } from "@/components/ds/Icon";
import { AccountActions } from "@/components/admin/AccountActions";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getUser();
  if (!user) redirect("/logg-inn");

  const t = getDictionary(await getLocale());

  return (
    <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <Link
        href="/admin"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-link)", fontWeight: 600, fontSize: "var(--fs-sm)", textDecoration: "none" }}
      >
        <Icon name="arrow-left" size={15} />
        {t.account.backToAdmin}
      </Link>
      <h1 style={{ margin: "16px 0 4px", fontSize: "var(--fs-h1)", fontWeight: 800 }}>{t.account.title}</h1>
      <p style={{ margin: "0 0 24px", color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>{t.account.subtitle}</p>
      <AccountActions userId={user.id} email={user.email ?? ""} />
    </main>
  );
}
