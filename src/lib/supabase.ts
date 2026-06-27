import { createClient } from "@supabase/supabase-js";

// Supabase client (Track B). Reads connection config from Vite env vars.
// Both values are safe to expose to the browser:
//   VITE_SUPABASE_URL       — project URL
//   VITE_SUPABASE_ANON_KEY  — publishable/anon key (RLS protects the data)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Configuração ausente: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no ambiente.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
