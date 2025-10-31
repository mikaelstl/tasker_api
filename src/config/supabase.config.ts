import { createClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "./env.config";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);