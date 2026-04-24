import { redirect } from "next/navigation";

import { createClient } from "@/services/supabase/server";

/**
 * Garante que a requisição atual é de um admin. Caso contrário, redireciona.
 * Chame no início de Server Actions e páginas admin (camada extra além do middleware).
 */
export async function requireAdmin(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=%2Fadmin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/");
  }
}
