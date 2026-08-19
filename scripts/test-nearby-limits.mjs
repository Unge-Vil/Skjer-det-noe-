import { createClient } from "@supabase/supabase-js";

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false } },
);
const base = { p_lat: 59.2792, p_lng: 5.3015, p_radius_m: 1000000 };

for (const name of ["nearby_activities", "nearby_events"]) {
  const limited = await client.rpc(name, { ...base, p_limit: 1 });
  if (limited.error) throw limited.error;
  if (limited.data.length > 1) throw new Error(`${name} ignored p_limit`);

  const capped = await client.rpc(name, { ...base, p_limit: 1000 });
  if (capped.error) throw capped.error;
  if (capped.data.length > 500) throw new Error(`${name} exceeded hard cap`);

  const compatible = await client.rpc(name, base);
  if (compatible.error) throw compatible.error;
  if (compatible.data.length > 50) throw new Error(`${name} default is unbounded`);
}

console.log("Nearby search limit regression test passed");