import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const testPassword = process.env.SUPABASE_TEST_PASSWORD;

if (!url || !publishableKey || !secretKey || !testPassword) {
  throw new Error(
    "Missing Supabase credentials or SUPABASE_TEST_PASSWORD",
  );
}

const adminClient = createClient(url, secretKey, {
  auth: { persistSession: false },
});

const ownerEmail = `org-status-${crypto.randomUUID()}@example.test`;
const ownerPassword = `Org-status-${crypto.randomUUID()}`;
let ownerId;
let organizationId;

function client() {
  return createClient(url, publishableKey, {
    auth: { persistSession: false },
  });
}

function assertRejected(error, message) {
  if (!error) throw new Error(message);
}

async function municipalityId(kommunenummer) {
  const { data, error } = await adminClient
    .from("municipalities")
    .select("id")
    .eq("kommunenummer", kommunenummer)
    .single();
  if (error) throw error;
  return data.id;
}

async function signIn(email, password) {
  const signedInClient = client();
  const { error } = await signedInClient.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return signedInClient;
}

async function main() {
  const haugesundId = await municipalityId("1106");
  const karmoyId = await municipalityId("1149");

  const { data: owner, error: ownerError } =
    await adminClient.auth.admin.createUser({
      email: ownerEmail,
      password: ownerPassword,
      email_confirm: true,
    });
  if (ownerError) throw ownerError;
  ownerId = owner.user.id;

  const { data: organization, error: organizationError } = await adminClient
    .from("organizations")
    .insert({
      name: "Organization status security test",
      slug: `org-status-${crypto.randomUUID()}`,
      status: "draft",
    })
    .select("id")
    .single();
  if (organizationError) throw organizationError;
  organizationId = organization.id;

  const { error: setupError } = await adminClient
    .from("organization_members")
    .insert({ organization_id: organizationId, user_id: ownerId, role: "owner" });
  if (setupError) throw setupError;

  const { error: linkError } = await adminClient
    .from("organization_municipalities")
    .insert({ organization_id: organizationId, municipality_id: haugesundId });
  if (linkError) throw linkError;

  const ownerClient = await signIn(ownerEmail, ownerPassword);
  const { error: profileEditError } = await ownerClient
    .from("organizations")
    .update({ name: "Organization profile edit verified" })
    .eq("id", organizationId);
  if (profileEditError) throw profileEditError;

  const { error: directStatusError } = await ownerClient
    .from("organizations")
    .update({ status: "published" })
    .eq("id", organizationId);
  assertRejected(directStatusError, "Owner changed status directly");

  const { error: ownerModerationError } = await ownerClient.rpc(
    "moderate_organization",
    { p_organization: organizationId, p_status: "published" },
  );
  assertRejected(ownerModerationError, "Owner moderated own organization");

  const municipalityClient = await signIn("kommune@ungevil.no", testPassword);
  const { error: wrongMunicipalityError } = await municipalityClient.rpc(
    "moderate_organization",
    { p_organization: organizationId, p_status: "published" },
  );
  assertRejected(
    wrongMunicipalityError,
    "Municipality admin moderated an organization outside their municipality",
  );

  const { error: karmoyLinkError } = await adminClient
    .from("organization_municipalities")
    .insert({ organization_id: organizationId, municipality_id: karmoyId });
  if (karmoyLinkError) throw karmoyLinkError;

  const { error: municipalityModerationError } = await municipalityClient.rpc(
    "moderate_organization",
    { p_organization: organizationId, p_status: "published" },
  );
  if (municipalityModerationError) throw municipalityModerationError;

  const platformClient = await signIn("jan.helge@ungevil.no", testPassword);
  const { error: platformModerationError } = await platformClient.rpc(
    "moderate_organization",
    { p_organization: organizationId, p_status: "archived" },
  );
  if (platformModerationError) throw platformModerationError;

  const { data: result, error: resultError } = await adminClient
    .from("organizations")
    .select("status")
    .eq("id", organizationId)
    .single();
  if (resultError) throw resultError;
  if (result.status !== "archived") {
    throw new Error("Platform moderation was not persisted");
  }

  console.log("Organization status security regression test passed");
}

try {
  await main();
} finally {
  if (organizationId) {
    const { error } = await adminClient
      .from("organizations")
      .delete()
      .eq("id", organizationId);
    if (error) throw error;
  }
  if (ownerId) {
    const { error } = await adminClient.auth.admin.deleteUser(ownerId);
    if (error) throw error;
  }
}