import { createClient } from "@/services/supabase/server";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminApiContext = {
  user: User;
  supabase: SupabaseClient;
};

/**
 * Para Route Handlers: retorna 401/403 JSON se não for admin.
 */
export async function requireAdminApi(): Promise<
  { ok: true; ctx: AdminApiContext } | { ok: false; response: Response }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      response: Response.json({ error: "Não autenticado." }, { status: 401 }),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return {
      ok: false,
      response: Response.json({ error: "Acesso negado." }, { status: 403 }),
    };
  }

  return { ok: true, ctx: { user, supabase } };
}
