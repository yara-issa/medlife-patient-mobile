import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = "https://fcoozffkzennorscauej.supabase.co";
const supabaseKey = "sb_publishable_nlcaUGJAtWi9-lxihmhZRg_3PdJ1huQ";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
