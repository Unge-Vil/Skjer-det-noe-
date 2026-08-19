import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !secretKey) throw new Error("Missing Supabase credentials");

const client = createClient(url, secretKey, { auth: { persistSession: false } });
const organizationIds = [];
const listingIds = { activities: [], events: [], directory_listings: [] };

async function municipalityId(kommunenummer) {
  const { data, error } = await client
    .from("municipalities")
    .select("id")
    .eq("kommunenummer", kommunenummer)
    .single();
  if (error) throw error;
  return data.id;
}

async function createOrganization(label) {
  const { data, error } = await client
    .from("organizations")
    .insert({ name: label, slug: `${label.toLowerCase()}-${randomUUID()}`, status: "draft" })
    .select("id")
    .single();
  if (error) throw error;
  organizationIds.push(data.id);
  return data.id;
}

async function expectInsert(table, row, shouldSucceed, message) {
  const { data, error } = await client.from(table).insert(row).select("id").maybeSingle();
  if (shouldSucceed && error) throw error;
  if (!shouldSucceed && !error) throw new Error(message);
  if (data?.id) listingIds[table].push(data.id);
  return data?.id;
}

async function main() {
  const haugesundId = await municipalityId("1106");
  const karmoyId = await municipalityId("1149");
  const organizationA = await createOrganization("Integrity A");
  const organizationB = await createOrganization("Integrity B");

  const { data: profiles, error: profileError } = await client
    .from("org_profiles")
    .insert([
      { organization_id: organizationA, municipality_id: haugesundId, name: "A", slug: "a" },
      { organization_id: organizationB, municipality_id: karmoyId, name: "B", slug: "b" },
    ])
    .select("id,organization_id");
  if (profileError) throw profileError;
  const profileA = profiles.find((profile) => profile.organization_id === organizationA).id;
  const profileB = profiles.find((profile) => profile.organization_id === organizationB).id;

  const cases = [
    {
      table: "activities",
      base: { title: "Integrity activity", slug: `activity-${randomUUID()}` },
    },
    {
      table: "events",
      base: {
        title: "Integrity event",
        slug: `event-${randomUUID()}`,
        starts_at: new Date().toISOString(),
      },
    },
    {
      table: "directory_listings",
      base: {
        kind: "service",
        title: "Integrity service",
        slug: `service-${randomUUID()}`,
      },
    },
  ];

  for (const { table, base } of cases) {
    const validId = await expectInsert(
      table,
      {
        ...base,
        organization_id: organizationA,
        municipality_id: haugesundId,
        profile_id: profileA,
      },
      true,
    );

    await expectInsert(
      table,
      {
        ...base,
        slug: `${base.slug}-wrong-org`,
        organization_id: organizationB,
        municipality_id: haugesundId,
        profile_id: profileA,
      },
      false,
      `${table} accepted a profile from another organization`,
    );

    await expectInsert(
      table,
      {
        ...base,
        slug: `${base.slug}-wrong-municipality`,
        organization_id: organizationA,
        municipality_id: karmoyId,
        profile_id: profileA,
      },
      false,
      `${table} accepted a profile from another municipality`,
    );

    const { error: moveError } = await client
      .from(table)
      .update({ profile_id: profileB })
      .eq("id", validId);
    if (!moveError) throw new Error(`${table} moved to an incompatible profile`);
  }

  console.log("Listing profile integrity regression test passed");
}

try {
  await main();
} finally {
  for (const [table, ids] of Object.entries(listingIds)) {
    if (ids.length) {
      const { error } = await client.from(table).delete().in("id", ids);
      if (error) throw error;
    }
  }
  if (organizationIds.length) {
    const { error } = await client.from("organizations").delete().in("id", organizationIds);
    if (error) throw error;
  }
}