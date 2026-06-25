import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/** Current authenticated user (server-side), or null. */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
