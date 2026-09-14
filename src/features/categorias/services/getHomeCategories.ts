import { cache } from "react";
import { unstable_cache } from "next/cache";

import { CATALOG_CACHE_TAGS } from "@/features/produtos/utils/catalogCacheTags";
import { createPublicClient } from "@/services/supabase/public";
import type { CategoryListItem } from "@/types/category";

async function fetchHomeCategories(): Promise<CategoryListItem[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.from("categorias").select("id, nome, icone").order("nome");
    if (error || !data) return [];
    return data as CategoryListItem[];
  } catch {
    return [];
  }
}

const getCachedHomeCategories = unstable_cache(fetchHomeCategories, ["home-categories"], {
  tags: [CATALOG_CACHE_TAGS.categories],
  revalidate: 120,
});

export const getHomeCategories = cache(async function getHomeCategories(): Promise<CategoryListItem[]> {
  return getCachedHomeCategories();
});
