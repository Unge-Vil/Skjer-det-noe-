import { createHash, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !publishableKey || !secretKey) {
  throw new Error("Missing Supabase credentials");
}

const adminClient = createClient(url, secretKey, {
  auth: { persistSession: false },
});
const password = `Owner-editor-${randomUUID()}`;
const users = [];
let organizationId;

async function createUser(label) {
  const email = `${label}-${randomUUID()}@example.test`;
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  users.push(data.user.id);
  return { id: data.user.id, email };
}

async function signIn(email) {
  const signedInClient = createClient(url, publishableKey, {
    auth: { persistSession: false },
  });
  const { error } = await signedInClient.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return signedInClient;
}

function expectRejected(error, message) {
  if (!error) throw new Error(message);
}

async function main() {
  const owner = await createUser("owner");
  const editor = await createUser("editor");
  const candidate = await createUser("candidate");

  const { data: organization, error: organizationError } = await adminClient
    .from("organizations")
    .insert({
      name: "Owner editor security test",
      slug: `owner-editor-${randomUUID()}`,
      status: "draft",
    })
    .select("id")
    .single();
  if (organizationError) throw organizationError;
  organizationId = organization.id;

  const { error: memberSetupError } = await adminClient
    .from("organization_members")
    .insert([
      { organization_id: organizationId, user_id: owner.id, role: "owner" },
      { organization_id: organizationId, user_id: editor.id, role: "editor" },
    ]);
  if (memberSetupError) throw memberSetupError;

  const { data: profile, error: profileError } = await adminClient
    .from("org_profiles")
    .insert({
      organization_id: organizationId,
      name: "Security profile",
      slug: "security-profile",
    })
    .select("id")
    .single();
  if (profileError) throw profileError;

  const { error: profileMemberError } = await adminClient
    .from("org_profile_members")
    .insert([
      { profile_id: profile.id, user_id: owner.id, role: "owner" },
      { profile_id: profile.id, user_id: editor.id, role: "editor" },
    ]);
  if (profileMemberError) throw profileMemberError;

  const ownerClient = await signIn(owner.email);
  const editorClient = await signIn(editor.email);

  const { error: contentError } = await editorClient
    .from("organizations")
    .update({ description: "Editor content update verified" })
    .eq("id", organizationId);
  if (contentError) throw contentError;

  const { error: editorAddError } = await editorClient.rpc("add_org_member", {
    p_org: organizationId,
    p_email: candidate.email,
    p_role: "editor",
  });
  expectRejected(editorAddError, "Editor added an organization member");

  const { error: editorProfileAddError } = await editorClient.rpc(
    "add_profile_member",
    { p_profile: profile.id, p_email: candidate.email, p_role: "editor" },
  );
  expectRejected(editorProfileAddError, "Editor added a profile member");

  const { error: editorRoleError } = await editorClient.rpc(
    "update_org_member_role",
    { p_org: organizationId, p_user: editor.id, p_role: "owner" },
  );
  expectRejected(editorRoleError, "Editor promoted themselves to owner");

  const editorHash = createHash("sha256")
    .update(`editor-${randomUUID()}`)
    .digest("hex");
  const { error: editorKeyError } = await editorClient.from("api_keys").insert({
    organization_id: organizationId,
    key_prefix: "sdn_test_editor",
    key_hash: editorHash,
    created_by: editor.id,
  });
  expectRejected(editorKeyError, "Editor created an API key");

  const { error: editorFeedError } = await editorClient
    .from("calendar_feeds")
    .insert({
      organization_id: organizationId,
      url: "https://example.test/editor.ics",
    });
  expectRejected(editorFeedError, "Editor created a calendar feed");

  const { error: lastOrgOwnerError } = await ownerClient.rpc(
    "remove_org_member",
    { p_org: organizationId, p_user: owner.id },
  );
  expectRejected(lastOrgOwnerError, "Last organization owner was removed");

  const { error: lastProfileOwnerError } = await ownerClient.rpc(
    "remove_profile_member",
    { p_profile: profile.id, p_user: owner.id },
  );
  expectRejected(lastProfileOwnerError, "Last profile owner was removed");

  const { error: lastOwnerDemotionError } = await ownerClient.rpc(
    "update_org_member_role",
    { p_org: organizationId, p_user: owner.id, p_role: "editor" },
  );
  expectRejected(lastOwnerDemotionError, "Last organization owner was demoted");

  const { error: promotionError } = await ownerClient.rpc(
    "update_org_member_role",
    { p_org: organizationId, p_user: editor.id, p_role: "owner" },
  );
  if (promotionError) throw promotionError;

  const { error: profilePromotionError } = await ownerClient.rpc(
    "update_profile_member_role",
    { p_profile: profile.id, p_user: editor.id, p_role: "owner" },
  );
  if (profilePromotionError) throw profilePromotionError;

  const { error: ownerAddError } = await ownerClient.rpc("add_org_member", {
    p_org: organizationId,
    p_email: candidate.email,
    p_role: "owner",
  });
  if (ownerAddError) throw ownerAddError;

  const ownerHash = createHash("sha256")
    .update(`owner-${randomUUID()}`)
    .digest("hex");
  const { error: ownerKeyError } = await ownerClient.from("api_keys").insert({
    organization_id: organizationId,
    key_prefix: "sdn_test_owner",
    key_hash: ownerHash,
    created_by: owner.id,
  });
  if (ownerKeyError) throw ownerKeyError;

  const { error: ownerFeedError } = await ownerClient
    .from("calendar_feeds")
    .insert({
      organization_id: organizationId,
      url: "https://example.test/owner.ics",
    });
  if (ownerFeedError) throw ownerFeedError;

  const { error: removeSecondOwnerError } = await ownerClient.rpc(
    "remove_org_member",
    { p_org: organizationId, p_user: candidate.id },
  );
  if (removeSecondOwnerError) throw removeSecondOwnerError;

  console.log("Owner/editor security regression test passed");
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
  for (const userId of users) {
    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) throw error;
  }
}