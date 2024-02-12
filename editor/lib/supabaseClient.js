import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_API_KEY;
console.log("supabaseUrl", supabaseUrl);
export const supabase = createClient(supabaseUrl, supabaseAnonKey);