import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente anon sem cookies — seguro para `unstable_cache` (leituras públicas / RLS).
 * Não use para operações que dependem da sessão do usuário.
 */
export function createPublicClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env ou .env.local"
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
