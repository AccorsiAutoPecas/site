"use server";

import { createClient } from "@/services/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Anos cadastrados para um modelo (mais novos primeiro). Usado no filtro veicular sob demanda. */
export async function getModeloAnos(modeloId: string): Promise<number[]> {
  const id = modeloId.trim();
  if (!id || !UUID_RE.test(id)) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("modelo_anos")
      .select("ano")
      .eq("modelo_id", id)
      .order("ano", { ascending: false });

    if (error || !data?.length) return [];
    const anos = data
      .map((r) => Number(r.ano))
      .filter((n) => Number.isFinite(n) && n >= 1900 && n <= 2100);
    return [...new Set(anos)].sort((a, b) => b - a);
  } catch {
    return [];
  }
}
