import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "placeholder";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from("app_settings").select("*").limit(1);
  console.log("App Settings Error:", error);
  if (data && data.length > 0) {
    console.log("App Settings Keys:", Object.keys(data[0]));
    console.log("App Settings Data:", data[0]);
  }
}

run();
