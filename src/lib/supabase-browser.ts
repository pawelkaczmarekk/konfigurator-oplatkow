import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    if (!url || !key) {
      throw new Error('Supabase not configured');
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

export const supabase = typeof window !== 'undefined' ? getSupabaseBrowser() : null;