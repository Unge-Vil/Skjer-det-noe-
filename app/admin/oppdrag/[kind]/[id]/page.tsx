import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getMyOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { DirectoryForm, type DirectoryInitial } from "@/components/admin/DirectoryForm";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContextSwitcher } from "@/components/admin/ContextSwitcher";
import { orgAdminNav } from "@/components/admin/orgAdminNav";

export const dynamic = "force-dynamic";

const KIND_MAP: Record<string, "service" | "volunteer"> = {
  tjeneste: "service",
  frivillig: "volunteer",
};

export default async function DirectoryFormPage({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  const { kind: kindParam, id } = await params;
  const kind = KIND_MAP[kindParam];
  if (!kind) notFound();

  const user = await getUser();
  if (!user) redirect("/logg-inn");

  const org = await getMyOrg();
  if (!org) redirect("/registrer");

  const supabase = await createClient();
  const locale = await getLocale();
  const t = getDictionary(locale);
  const { data: cats } = await supabase.from("categories").select("id,name").order("sort_order");

  let initial: DirectoryInitial | null = null;
  if (id !== "ny") {
    const { data } = await supabase
      .from("directory_listings")
      .select(
        "id,title,title_en,description,description_en,category_id,municipality_id,area,contact_name,contact_email,contact_phone,url,image_url,price,time_commitment,status",
      )
      .eq("id", id)
      .eq("kind", kind)
      .maybeSingle();
    if (!data) notFound();
    initial = data as DirectoryInitial;
  }

  const heading =
    id === "ny"
      ? kind === "service"
        ? t.directory.newService
        : t.directory.newVolunteer
      : kind === "service"
        ? t.directory.editService
        : t.directory.editVolunteer;

  return (
    <AdminShell title={heading} identity={<ContextSwitcher />} nav={orgAdminNav(t)}>
      <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <h1 style={{ margin: "0 0 20px", fontSize: "var(--fs-h2)", fontWeight: 800 }}>{heading}</h1>
        <DirectoryForm
          kind={kind}
          orgId={org.id}
          categories={cats ?? []}
          municipalities={org.municipalities}
          initial={initial}
          returnHref="/admin"
        />
      </main>
    </AdminShell>
  );
}
