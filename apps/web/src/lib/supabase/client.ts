import { createBrowserClient } from '@supabase/ssr';
import { createSupabaseClient } from '@fit-n-fatal/db';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  createSupabaseClient(url, key);
  return createBrowserClient(url, key);
}
