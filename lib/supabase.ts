import { createClient } from "@supabase/supabase-js";

// Fallback values allow the build to succeed without env vars.
// At runtime (dev & production) real values must be set.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
