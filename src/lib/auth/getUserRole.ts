import { createClient } from "@/services/supabase/server";
import type { ProfileRole } from "@/types/profileRole";

/**
 * Retorna o papel do usuário atual (sessão cookie) ou null se não autenticado.
 * Use em Server Components, Server Actions e Route Handlers.
 */
export async function getUserRole(): Promise<ProfileRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const r = profile?.role;
  if (r === "admin" || r === "user") return r;
  return "user";
}

export async function isAdmin(): Promise<boolean> {
  return (await getUserRole()) === "admin";
}
