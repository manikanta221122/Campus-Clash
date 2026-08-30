import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) throw new Error("Supabase is not configured. Copy .env.example to .env.local and add your project details.");

export const supabase = createClient(url, key);
