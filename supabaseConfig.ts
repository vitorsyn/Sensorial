import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qozunzeqgabopccpsyna.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvenVuemVxZ2Fib3BjY3BzeW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwMTA5MjMsImV4cCI6MjEwMjU4NjkyM30.hqN2LzrOzj9yvTo_NN--DcjCjdLCvduemepwvgXLa04";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
