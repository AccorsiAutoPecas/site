import type { SupabaseClient } from "@supabase/supabase-js";

export async function resolveEmbalagemId(
  supabase: SupabaseClient,
  raw: string
): Promise<string | null> {
  const id = raw.trim();
  if (!id) return null;
  const { data } = await supabase.from("embalagens").select("id").eq("id", id).maybeSingle();
  return data?.id ?? null;
}
