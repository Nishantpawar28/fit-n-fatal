import { createBrowserClient } from '@supabase/ssr';
import { setSupabaseClient } from '@fit-n-fatal/db';

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!browserClient) {
    browserClient = createBrowserClient(url, key);
    setSupabaseClient(browserClient);
  }

  return browserClient;
}
