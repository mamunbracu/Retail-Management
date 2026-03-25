import { isSupabaseConfigured } from "../config/supabase.js";

// Middleware to check Supabase configuration
export const checkSupabase = (req: any, res: any, next: any) => {
  if (req.path === "/health") return next();
  if (!isSupabaseConfigured) {
    return res.status(503).json({ 
      error: "Database not configured", 
      details: "Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the Secrets panel." 
    });
  }
  next();
};
