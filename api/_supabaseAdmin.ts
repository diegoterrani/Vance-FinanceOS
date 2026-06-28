import { createClient } from "@supabase/supabase-js";

// Service-role Supabase client for server-side functions (bypasses RLS).
// Requires SUPABASE_SERVICE_ROLE_KEY in the environment.
const url = process.env.SUPABASE_URL || "https://gltffiwkzdvsxruexklw.supabase.co";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const hasAdmin = !!serviceKey;
export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
export const SUPABASE_URL = url;
