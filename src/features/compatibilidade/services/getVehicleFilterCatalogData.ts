import { cache } from "react";
import { unstable_cache } from "next/cache";

import { normalizeTipoVeiculoModeloFromDb } from "@/features/compatibilidade/constants/tipoVeiculoModelo";
import type { TipoVeiculoModelo } from "@/features/compatibilidade/constants/tipoVeiculoModelo";
import { CATALOG_CACHE_TAGS } from "@/features/produtos/utils/catalogCacheTags";
import { createPublicClient } from "@/services/supabase/public";

export type VehicleFilterMarca = { id: string; nome: string };

export type VehicleFilterModelo = {
  id: string;
  nome: string;
  marca_id: string;
  tipo_veiculo: TipoVeiculoModelo;
};

/** Anos cadastrados por modelo (`modelo_anos`), ordenados do mais novo ao mais antigo. */
export type VehicleFilterAnosByModelo = Record<string, number[]>;

export type VehicleFilterCatalogData = {
  marcas: VehicleFilterMarca[];
  modelos: VehicleFilterModelo[];
  /** Parcial: só modelos já hidratados (ex.: da URL). Demais anos vêm sob demanda. */
  anosByModeloId: VehicleFilterAnosByModelo;
};

async function fetchMarcasModelos(): Promise<{
  marcas: VehicleFilterMarca[];
  modelos: VehicleFilterModelo[];
}> {
  try {
    const supabase = createPublicClient();
    const [marcasRes, modelosRes] = await Promise.all([
      supabase.from("marcas").select("id, nome").order("nome"),
      supabase.from("modelos").select("id, nome, marca_id, tipo_veiculo").order("nome"),
    ]);

    if (process.env.NODE_ENV === "development") {
      if (marcasRes.error) console.error("[getVehicleFilterCatalogData] marcas", marcasRes.error);
      if (modelosRes.error) console.error("[getVehicleFilterCatalogData] modelos", modelosRes.error);
    }

    const marcas = (marcasRes.data ?? []) as VehicleFilterMarca[];
    const modelos: VehicleFilterModelo[] = (modelosRes.data ?? []).map((row) => ({
      id: row.id as string,
      nome: row.nome as string,
      marca_id: row.marca_id as string,
      tipo_veiculo: normalizeTipoVeiculoModeloFromDb((row as { tipo_veiculo?: unknown }).tipo_veiculo),
    }));

    return { marcas, modelos };
  } catch {
    return { marcas: [], modelos: [] };
  }
}

const getCachedMarcasModelos = unstable_cache(fetchMarcasModelos, ["vehicle-filter-marcas-modelos"], {
  tags: [CATALOG_CACHE_TAGS.vehicleFilter],
  revalidate: 120,
});

async function fetchAnosForModelo(modeloId: string): Promise<number[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("modelo_anos")
      .select("ano")
      .eq("modelo_id", modeloId)
      .order("ano", { ascending: false });
    if (error || !data?.length) return [];
    return [
      ...new Set(
        data
          .map((r) => Number(r.ano))
          .filter((n) => Number.isFinite(n) && n >= 1900 && n <= 2100)
      ),
    ].sort((a, b) => b - a);
  } catch {
    return [];
  }
}

/**
 * Catálogo do filtro por veículo: marcas + modelos (cacheados).
 * Anos só para `modeloIdForAnos` (URL já aplicada); demais sob demanda no client.
 */
export const getVehicleFilterCatalogData = cache(async function getVehicleFilterCatalogData(opts?: {
  modeloIdForAnos?: string | null;
}): Promise<VehicleFilterCatalogData> {
  const { marcas, modelos } = await getCachedMarcasModelos();
  const anosByModeloId: VehicleFilterAnosByModelo = {};
  const modeloId = opts?.modeloIdForAnos?.trim() || null;
  if (modeloId) {
    anosByModeloId[modeloId] = await fetchAnosForModelo(modeloId);
  }
  return { marcas, modelos, anosByModeloId };
});
