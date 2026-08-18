import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qozunzeqgabopccpsyna.supabase.co/rest/v1/";
const SUPABASE_KEY = "sb_publishable_7JjKEzbMEpf0qkrFbKbaQg_T54r9Jp0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
