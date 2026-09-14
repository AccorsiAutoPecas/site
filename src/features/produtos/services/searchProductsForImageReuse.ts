"use server";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { normalizeProductSearchInput } from "@/features/produtos/services/productSearchMatchingIds";
import { resolveProductImagePublicUrl } from "@/features/produtos/utils/resolveProductImagePublicUrl";
import { createClient } from "@/services/supabase/server";

const SEARCH_LIMIT = 30;

export type ProductImageReuseSearchItem = {
  id: string;
  titulo: string;
  cod_produto: string;
  foto: string | null;
  imageUrl: string | null;
};

export type SearchProductsForImageReuseResult =
  | { ok: true; items: ProductImageReuseSearchItem[] }
  | { ok: false; message: string };

/**
 * Busca produtos por nome ou código/SKU para escolher a origem da imagem a reutilizar.
 */
export async function searchProductsForImageReuse(
  rawQuery: string
): Promise<SearchProductsForImageReuseResult> {
  await requireAdmin();

  const term = normalizeProductSearchInput(rawQuery);
  if (!term) {
    return { ok: true, items: [] };
  }

  const supabase = await createClient();
  const pattern = `%${term}%`;
  const select = "id, titulo, cod_produto, foto" as const;

  const [byTitulo, byCod] = await Promise.all([
    supabase.from("produtos").select(select).ilike("titulo", pattern).limit(SEARCH_LIMIT),
    supabase.from("produtos").select(select).ilike("cod_produto", pattern).limit(SEARCH_LIMIT),
  ]);

  if (byTitulo.error || byCod.error) {
    return {
      ok: false,
      message: byTitulo.error?.message ?? byCod.error?.message ?? "Falha ao buscar produtos.",
    };
  }

  const map = new Map<string, ProductImageReuseSearchItem>();
  for (const row of [...(byTitulo.data ?? []), ...(byCod.data ?? [])]) {
    const id = String(row.id ?? "").trim();
    if (!id || map.has(id)) continue;
    const foto = row.foto != null ? String(row.foto).trim() || null : null;
    map.set(id, {
      id,
      titulo: String(row.titulo ?? "").trim() || "Sem título",
      cod_produto: String(row.cod_produto ?? "").trim() || "—",
      foto,
      imageUrl: resolveProductImagePublicUrl(foto),
    });
  }

  const items = [...map.values()]
    .sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR", { sensitivity: "base" }))
    .slice(0, SEARCH_LIMIT);

  return { ok: true, items };
}
