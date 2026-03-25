import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = supabaseUrl && 
                            supabaseKey && 
                            supabaseUrl !== "https://placeholder.supabase.co" && 
                            supabaseKey !== "placeholder";

if (!isSupabaseConfigured) {
  console.error("CRITICAL: Supabase credentials missing or invalid. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.");
} else {
  console.log(`Supabase URL: ${supabaseUrl!.substring(0, 15)}...`);
  console.log(`Supabase Key: ${supabaseKey!.substring(0, 5)}...`);
}

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl! : "https://placeholder.supabase.co", 
  isSupabaseConfigured ? supabaseKey! : "placeholder"
);

export { supabaseUrl, supabaseKey };
