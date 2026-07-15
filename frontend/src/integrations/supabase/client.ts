import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: Platform.OS === 'web' ? localStorage : AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
