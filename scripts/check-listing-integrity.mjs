import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !secretKey) throw new Error("Missing Supabase credentials");

const client = createClient(url, secretKey, { auth: { persistSession: false } });

async function allRows(table, columns) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await client.from(table).select(columns).range(from, from + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
}

const profiles = new Map(
  (await allRows("org_profiles", "id,organization_id,municipality_id"))
    .map((profile) => [profile.id, profile]),
);
const inconsistencies = [];

for (const table of ["activities", "events", "directory_listings"]) {
  const rows = await allRows(table, "id,organization_id,municipality_id,profile_id");
  for (const row of rows) {
    if (!row.profile_id) continue;
    const profile = profiles.get(row.profile_id);
    if (
      !profile ||
      profile.organization_id !== row.organization_id ||
      profile.municipality_id !== row.municipality_id
    ) {
      inconsistencies.push({ table, id: row.id, profileId: row.profile_id });
    }
  }
}

if (inconsistencies.length) {
  console.error(JSON.stringify(inconsistencies, null, 2));
  throw new Error(`Found ${inconsistencies.length} inconsistent profile-linked listings`);
}

console.log("Listing profile integrity audit passed");