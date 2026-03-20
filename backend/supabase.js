/**
 * supabase.js  –  Supabase client instances
 *
 * SUPABASE_URL          – your project URL  (https://xxxx.supabase.co)
 * SUPABASE_ANON_KEY     – public anon key   (safe to expose in front-end)
 * SUPABASE_SERVICE_KEY  – service-role key  (server-side only, never expose!)
 */
import 'dotenv/config'; // For ES Modules (which you are using)
import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL)         throw new Error("Missing SUPABASE_URL");
if (!process.env.SUPABASE_ANON_KEY)    throw new Error("Missing SUPABASE_ANON_KEY");
if (!process.env.SUPABASE_SERVICE_KEY) throw new Error("Missing SUPABASE_SERVICE_KEY");

// Public client – respects Row Level Security
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: { persistSession: false },
    global: { headers: { "x-application-name": "roommate-kz" } },
  }
);

// Admin / service client – bypasses RLS (NEVER send this key to the browser)
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-application-name": "roommate-kz-admin" } },
  }
);
