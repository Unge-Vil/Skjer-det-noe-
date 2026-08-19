import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const platformAdminPassword = process.env.SUPABASE_TEST_PASSWORD;

if (!url || !publishableKey || !secretKey || !platformAdminPassword) {
  throw new Error(
    "Missing Supabase credentials or SUPABASE_TEST_PASSWORD",
  );
}

const adminClient = createClient(url, secretKey, {
  auth: { persistSession: false },
});
const platformClient = createClient(url, publishableKey, {
  auth: { persistSession: false },
});

const testPassword = `Profile-security-${crypto.randomUUID()}`;
const testEmail = `profile-security-${crypto.randomUUID()}@example.test`;
let testUserId;

function assertRejected(error, message) {
  if (!error) throw new Error(message);
}

async function main() {
  const { data: created, error: createError } =
    await adminClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { full_name: "Profile security test" },
    });
  if (createError) throw createError;
  testUserId = created.user.id;

  const testClient = createClient(url, publishableKey, {
    auth: { persistSession: false },
  });
  const { error: testLoginError } = await testClient.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });
  if (testLoginError) throw testLoginError;

  const { error: safeUpdateError } = await testClient
    .from("profiles")
    .update({ full_name: "Profile security verified" })
    .eq("id", testUserId);
  if (safeUpdateError) throw safeUpdateError;

  const { error: escalationError } = await testClient
    .from("profiles")
    .update({ is_platform_admin: true })
    .eq("id", testUserId);
  assertRejected(
    escalationError,
    "Temporary user could update is_platform_admin directly",
  );

  const { error: unauthorizedRpcError } = await testClient.rpc(
    "set_platform_admin",
    {
      p_user_id: testUserId,
      p_is_platform_admin: true,
    },
  );
  assertRejected(
    unauthorizedRpcError,
    "Temporary user could call set_platform_admin",
  );

  const { error: platformLoginError } =
    await platformClient.auth.signInWithPassword({
      email: "jan.helge@ungevil.no",
      password: platformAdminPassword,
    });
  if (platformLoginError) throw platformLoginError;

  const { error: grantError } = await platformClient.rpc(
    "set_platform_admin",
    {
      p_user_id: testUserId,
      p_is_platform_admin: true,
    },
  );
  if (grantError) throw grantError;

  const { data: profile, error: readError } = await testClient
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", testUserId)
    .single();
  if (readError) throw readError;
  if (!profile.is_platform_admin) {
    throw new Error("Controlled platform-admin update was not persisted");
  }

  console.log("Profile security regression test passed");
}

try {
  await main();
} finally {
  if (testUserId) {
    const { error } = await adminClient.auth.admin.deleteUser(testUserId);
    if (error) console.error("Failed to delete temporary test user", error);
  }
}