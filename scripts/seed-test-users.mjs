/**
 * One-off: create demo users + roles using the Supabase service key.
 * Run: node --env-file=.env scripts/seed-test-users.mjs
 * Idempotent — safe to re-run.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
  process.exit(1);
}

const sb = createClient(url, secret, { auth: { persistSession: false } });

async function ensureUser(email, fullName) {
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password: "demo",
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (!error) {
    console.log(`created user ${email}`);
    return data.user.id;
  }
  // Already exists → find it.
  const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
  const found = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!found) throw new Error(`could not create or find ${email}: ${error.message}`);
  console.log(`exists user ${email}`);
  return found.id;
}

async function muniId(kommunenummer) {
  const { data } = await sb
    .from("municipalities")
    .select("id")
    .eq("kommunenummer", kommunenummer)
    .single();
  return data.id;
}

async function main() {
  // 1. Users
  const janId = await ensureUser("jan.helge@ungevil.no", "Jan Helge Naley");
  const demoId = await ensureUser("demo@ungevil.no", "Unge Vil (demo)");
  const kommuneId = await ensureUser("kommune@ungevil.no", "Karmøy kommune (demo)");

  // 2. jan.helge = platform admin
  await sb.from("profiles").update({ is_platform_admin: true }).eq("id", janId);
  console.log("set jan.helge platform admin");

  // 3. Unge Vil org (Brønnøysund 932814331)
  const haugesund = await muniId("1106");
  const karmoy = await muniId("1149");

  let brreg = {};
  try {
    const r = await fetch("https://data.brreg.no/enhetsregisteret/api/enheter/932814331", {
      headers: { accept: "application/json" },
    });
    if (r.ok) brreg = await r.json();
  } catch {
    /* ignore */
  }
  const addr = brreg.forretningsadresse ?? {};
  const street = [Array.isArray(addr.adresse) ? addr.adresse.join(", ") : null, addr.postnummer, addr.poststed]
    .filter(Boolean)
    .join(", ");

  let { data: org } = await sb.from("organizations").select("id").eq("org_number", "932814331").maybeSingle();
  if (!org) {
    const { data: created, error } = await sb
      .from("organizations")
      .insert({
        name: "Unge Vil",
        slug: "unge-vil",
        org_number: "932814331",
        is_volunteer: true,
        description: "Ungdomsorganisasjon bygget på samarbeid, inkludering og lavterskel deltakelse.",
        website: brreg.hjemmeside ? `https://${brreg.hjemmeside}` : "https://ungevil.no",
        email: brreg.epostadresse ?? "org@ungevil.no",
        address: street || "Britavegen 12, 5516 Haugesund",
        municipality_id: haugesund,
        status: "published",
      })
      .select("id")
      .single();
    if (error) throw error;
    org = created;
    console.log("created Unge Vil org");
  } else {
    console.log("Unge Vil org exists");
  }

  // org ↔ municipalities (Haugesund + Karmøy so both kommune admins see it)
  await sb
    .from("organization_municipalities")
    .upsert(
      [
        { organization_id: org.id, municipality_id: haugesund },
        { organization_id: org.id, municipality_id: karmoy },
      ],
      { onConflict: "organization_id,municipality_id", ignoreDuplicates: true },
    );

  // members: demo + jan.helge own Unge Vil
  await sb
    .from("organization_members")
    .upsert(
      [
        { organization_id: org.id, user_id: demoId, role: "owner" },
        { organization_id: org.id, user_id: janId, role: "owner" },
      ],
      { onConflict: "organization_id,user_id", ignoreDuplicates: true },
    );
  console.log("set Unge Vil members");

  // 4. kommune@ = Karmøy municipality admin
  await sb
    .from("municipality_admins")
    .upsert([{ municipality_id: karmoy, user_id: kommuneId }], {
      onConflict: "municipality_id,user_id",
      ignoreDuplicates: true,
    });
  console.log("set Karmøy municipality admin");

  // 5. Backfill org↔municipality links for existing orgs (predate the M2M table)
  const { data: allOrgs } = await sb.from("organizations").select("id,municipality_id");
  const links = (allOrgs ?? [])
    .filter((o) => o.municipality_id)
    .map((o) => ({ organization_id: o.id, municipality_id: o.municipality_id }));
  if (links.length) {
    await sb
      .from("organization_municipalities")
      .upsert(links, { onConflict: "organization_id,municipality_id", ignoreDuplicates: true });
    console.log(`backfilled ${links.length} org↔municipality links`);
  }

  console.log("\nDone. Logins (password: demo):");
  console.log("  jan.helge@ungevil.no  → platform admin + Unge Vil owner");
  console.log("  demo@ungevil.no       → Unge Vil owner");
  console.log("  kommune@ungevil.no    → Karmøy municipality admin");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
