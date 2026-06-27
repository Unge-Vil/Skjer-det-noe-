import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getMyOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CENTER } from "@/lib/listings";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { ActivityForm, type ActivityInitial } from "@/components/admin/ActivityForm";

export const dynamic = "force-dynamic";

export default async function ActivityFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect("/logg-inn");
  const org = await getMyOrg();
  if (!org) redirect("/registrer");

  const supabase = await createClient();
  const { data: cats } = await supabase.from("categories").select("id,name").order("sort_order");

  let initial: ActivityInitial | null = null;
  if (id !== "ny") {
    const { data } = await supabase
      .from("activities")
      .select(
        "id,title,title_en,description,description_en,category_id,municipality_id,address,weekday,start_time,end_time,recurrence_note,age_min,age_max,price,image_url,status",
      )
      .eq("id", id)
      .maybeSingle();
    if (!data) notFound();
    initial = data as ActivityInitial;
  }

  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <h1 style={{ margin: "0 0 20px", fontSize: "var(--fs-h2)", fontWeight: 800 }}>
        {id === "ny" ? t.form.createActivity : t.form.editActivity}
      </h1>
      <ActivityForm
        orgId={org.id}
        categories={cats ?? []}
        municipalities={org.municipalities}
        defaultCenter={DEFAULT_CENTER}
        initial={initial}
      />
    </main>
  );
}
