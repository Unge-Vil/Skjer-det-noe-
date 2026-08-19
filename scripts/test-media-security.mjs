import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !publishableKey || !secretKey) throw new Error("Missing Supabase credentials");

const adminClient = createClient(url, secretKey, { auth: { persistSession: false } });
const password = `Media-security-${randomUUID()}`;
const userIds = [];
const objectPaths = [];
const organizationIds = [];
let municipalityAdmin;

async function createUser(label) {
  const email = `${label}-${randomUUID()}@example.test`;
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  userIds.push(data.user.id);
  return { id: data.user.id, email };
}

async function signIn(email) {
  const signedInClient = createClient(url, publishableKey, { auth: { persistSession: false } });
  const { error } = await signedInClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return signedInClient;
}

function expectRejected(error, message) {
  if (!error) throw new Error(message);
}

async function main() {
  const owner = await createUser("media-owner");
  const outsider = await createUser("media-outsider");
  const ownerClient = await signIn(owner.email);
  const outsiderClient = await signIn(outsider.email);
  const publicClient = createClient(url, publishableKey, { auth: { persistSession: false } });

  const { data: organization, error: organizationError } = await adminClient
    .from("organizations")
    .insert({ name: "Media security test", slug: `media-${randomUUID()}`, status: "draft" })
    .select("id")
    .single();
  if (organizationError) throw organizationError;
  const organizationId = organization.id;
  organizationIds.push(organizationId);

  const { data: otherOrganization, error: otherOrganizationError } = await adminClient
    .from("organizations")
    .insert({ name: "Other media test", slug: `media-other-${randomUUID()}`, status: "draft" })
    .select("id")
    .single();
  if (otherOrganizationError) throw otherOrganizationError;
  organizationIds.push(otherOrganization.id);

  const { error: memberError } = await adminClient.from("organization_members").insert({
    organization_id: organizationId,
    user_id: owner.id,
    role: "owner",
  });
  if (memberError) throw memberError;

  const { data: profile, error: profileError } = await adminClient
    .from("org_profiles")
    .insert({ organization_id: organizationId, name: "Media profile", slug: "media-profile" })
    .select("id")
    .single();
  if (profileError) throw profileError;

  const image = new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" });
  const orgPath = `org/${organizationId}/security.png`;
  const profilePath = `profile/${profile.id}/security.png`;
  objectPaths.push(orgPath, profilePath);

  const { error: orgUploadError } = await ownerClient.storage
    .from("media")
    .upload(orgPath, image, { contentType: "image/png" });
  if (orgUploadError) throw orgUploadError;

  const { error: profileUploadError } = await ownerClient.storage
    .from("media")
    .upload(profilePath, image, { contentType: "image/png" });
  if (profileUploadError) throw profileUploadError;

  const { error: crossUploadError } = await outsiderClient.storage
    .from("media")
    .upload(`org/${organizationId}/outsider.png`, image, { contentType: "image/png" });
  expectRejected(crossUploadError, "Outsider uploaded into another organization path");

  const { error: crossOrganizationError } = await ownerClient.storage
    .from("media")
    .upload(`org/${otherOrganization.id}/cross-org.png`, image, { contentType: "image/png" });
  expectRejected(crossOrganizationError, "Organization owner uploaded into another organization path");

  const { error: overwriteError } = await outsiderClient.storage
    .from("media")
    .upload(orgPath, image, { contentType: "image/png", upsert: true });
  expectRejected(overwriteError, "Outsider overwrote another organization object");

  await outsiderClient.storage.from("media").remove([orgPath]);
  const { error: stillExistsError } = await ownerClient.storage.from("media").download(orgPath);
  if (stillExistsError) throw new Error("Outsider deleted another organization object");

  const { error: mimeError } = await ownerClient.storage
    .from("media")
    .upload(`org/${organizationId}/invalid.txt`, new Blob(["text"]), {
      contentType: "text/plain",
    });
  expectRejected(mimeError, "Bucket accepted a disallowed MIME type");

  const { error: sizeError } = await ownerClient.storage
    .from("media")
    .upload(
      `org/${organizationId}/too-large.png`,
      new Blob([new Uint8Array(5 * 1024 * 1024 + 1)], { type: "image/png" }),
      { contentType: "image/png" },
    );
  expectRejected(sizeError, "Bucket accepted a file above 5 MB");

  const { data: municipality, error: municipalityError } = await adminClient
    .from("municipalities")
    .select("id")
    .eq("kommunenummer", "1149")
    .single();
  if (municipalityError) throw municipalityError;

  const { error: municipalityAdminError } = await adminClient
    .from("municipality_admins")
    .insert({ municipality_id: municipality.id, user_id: owner.id });
  if (municipalityAdminError) throw municipalityAdminError;
  municipalityAdmin = { municipalityId: municipality.id, userId: owner.id };

  const municipalityPath = `municipality/${municipality.id}/security.png`;
  objectPaths.push(municipalityPath);
  const { error: municipalityUploadError } = await ownerClient.storage
    .from("media")
    .upload(municipalityPath, image, { contentType: "image/png" });
  if (municipalityUploadError) throw municipalityUploadError;

  const { error: outsiderMunicipalityError } = await outsiderClient.storage
    .from("media")
    .upload(`municipality/${municipality.id}/outsider.png`, image, { contentType: "image/png" });
  expectRejected(outsiderMunicipalityError, "Outsider uploaded into a municipality path");

  const { error: publicReadError } = await publicClient.storage.from("media").download(orgPath);
  if (publicReadError) throw new Error("Public media reading no longer works");

  console.log("Media ownership security regression test passed");
}

try {
  await main();
} finally {
  if (objectPaths.length) {
    const { error } = await adminClient.storage.from("media").remove(objectPaths);
    if (error) throw error;
  }
  if (municipalityAdmin) {
    const { error } = await adminClient
      .from("municipality_admins")
      .delete()
      .eq("municipality_id", municipalityAdmin.municipalityId)
      .eq("user_id", municipalityAdmin.userId);
    if (error) throw error;
  }
  if (organizationIds.length) {
    const { error } = await adminClient.from("organizations").delete().in("id", organizationIds);
    if (error) throw error;
  }
  for (const userId of userIds) {
    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) throw error;
  }
}