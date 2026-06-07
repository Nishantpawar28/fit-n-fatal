import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function createSupabaseClient(
  url: string,
  anonKey: string,
  options?: {
    storage?: {
      getItem: (key: string) => Promise<string | null>;
      setItem: (key: string, value: string) => Promise<void>;
      removeItem: (key: string) => Promise<void>;
    };
  }
) {
  client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: options?.storage,
    },
  });
  return client;
}

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    throw new Error('Supabase client not initialized. Call createSupabaseClient first.');
  }
  return client;
}
