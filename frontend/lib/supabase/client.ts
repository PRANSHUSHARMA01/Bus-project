import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mock-transit.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "mock-anon-key-transit-jwt-placeholder-32chars";

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
