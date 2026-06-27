import { createClient } from "@supabase/supabase-js";

// Supabase client (Track B). Reads connection config from Vite env vars, with
// safe public defaults so the app works even before env vars are configured.
// Both values are safe to expose to the browser (RLS protects the data):
//   VITE_SUPABASE_URL       — project URL
//   VITE_SUPABASE_ANON_KEY  — publishable/anon key
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://gltffiwkzdvsxruexklw.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_02MJNI_S1n04FcZqOX9UJQ_-ZmwO5Rm";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
