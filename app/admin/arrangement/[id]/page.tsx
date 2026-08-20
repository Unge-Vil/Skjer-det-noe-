import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getMyOrg } from "@/lib/org";
import { getMyProfiles, getProfile } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CENTER } from "@/lib/listings";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { EventForm, type EventInitial } from "@/components/admin/EventForm";
import type { CoOrg } from "@/components/admin/CoOrganizerEditor";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContextSwitcher } from "@/components/admin/ContextSwitcher";
import { orgAdminNav } from "@/components/admin/orgAdminNav";
import { ExceptionManager } from "@/components/admin/ExceptionManager";

export const dynamic = "force-dynamic";

async function fetchCoOrgs(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  eventId: string,
): Promise<CoOrg[]> {
  const { data } = await supabase
    .from("event_co_organizers")
    .select("organizations(id,name)")
    .eq("event_id", eventId);
  return (data ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((r: any) => r.organizations)
    .filter(Boolean)
    .map((o: CoOrg) => ({ id: o.id, name: o.name }));
}

export default async function EventFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ profile?: string }>;
}) {
  const { id } = await params;
  const { profile: profileId } = await searchParams;
  const user = await getUser();
  if (!user) redirect("/logg-inn");

  const supabase = await createClient();
  const locale = await getLocale();
  const t = getDictionary(locale);
  const { data: cats } = await supabase.from("categories").select("id,name").order("sort_order");

  let orgId: string;
  let municipalities: { id: string; name: string }[] = [];
  let lockedMunicipality: { id: string; name: string } | undefined;
  let scopedProfileId: string | undefined;
  let returnHref = "/admin";

  if (profileId) {
    const allowed = await getMyProfiles();
    if (!allowed.some((p) => p.id === profileId)) notFound();
    const profile = await getProfile(profileId);
    if (!profile) notFound();
    orgId = profile.organizationId;
    scopedProfileId = profile.id;
    if (profile.municipalityId && profile.municipalityName)
      lockedMunicipality = { id: profile.municipalityId, name: profile.municipalityName };
    returnHref = `/admin/profiler/${profile.id}`;
  } else {
    const org = await getMyOrg();
    if (!org) redirect("/registrer");
    orgId = org.id;
    municipalities = org.municipalities;
  }

  let initial: EventInitial | null = null;
  let initialCoOrganizers: CoOrg[] = [];
  if (id !== "ny") {
    const { data } = await supabase
      .from("events")
      .select(
        "id,title,title_en,description,description_en,category_id,category_ids,municipality_id,address,accessibility,area,starts_at,ends_at,age_min,age_max,price,image_url,status",
      )
      .eq("id", id)
      .maybeSingle();
    if (!data) notFound();
    initial = data as EventInitial;
    initialCoOrganizers = await fetchCoOrgs(supabase, id);
  }

  const title = id === "ny" ? t.form.createEvent : t.form.editEvent;
  return (
    <AdminShell title={title} identity={<ContextSwitcher />} nav={orgAdminNav(t)}>
      <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <h1 style={{ margin: "0 0 20px", fontSize: "var(--fs-h2)", fontWeight: 800 }}>{title}</h1>
        <EventForm
          orgId={orgId}
          categories={cats ?? []}
          municipalities={municipalities}
          defaultCenter={DEFAULT_CENTER}
          initial={initial}
          initialCoOrganizers={initialCoOrganizers}
          lockedMunicipality={lockedMunicipality}
          profileId={scopedProfileId}
          returnHref={returnHref}
        />
        {id !== "ny" && <ExceptionManager listingKind="event" listingId={id} organizationId={orgId} />}
      </main>
    </AdminShell>
  );
}
