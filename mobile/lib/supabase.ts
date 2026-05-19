import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://slwpqjkurtmuutafldtx.supabase.co';
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsd3Bxamt1cnRtdXV0YWZsZHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMjg3MjEsImV4cCI6MjA5NDYwNDcyMX0.-VxAdBWFxg7EDb5o7tA_qsd4W1Kz10BsOW1lJaN5CtA';

export const supabase = createClient(url, key, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
