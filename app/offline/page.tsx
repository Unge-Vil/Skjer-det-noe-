import { getDictionary, getLocale } from "@/lib/i18n/server";
import { Icon } from "@/components/ds/Icon";

export default async function OfflinePage() {
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-20 text-center"
    >
      <Icon name="info" size={40} color="var(--text-brand)" />
      <h1 style={{ margin: "16px 0 6px", fontSize: "var(--fs-h2)", fontWeight: 800 }}>
        {t.offline.title}
      </h1>
      <p style={{ margin: 0, color: "var(--text-muted)", lineHeight: 1.5 }}>{t.offline.body}</p>
    </main>
  );
}
