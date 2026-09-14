import type { SupabaseClient } from "@supabase/supabase-js";

import { slugify } from "@/utils/slugify";
import { normalizeWegaText, titleCaseWords } from "@/features/produtos/utils/wegaText";
import type { WegaModeloSuggestion } from "@/features/produtos/utils/buildWegaModeloSuggestions";

export type RegisterWegaModelosResult =
  | {
      ok: true;
      marcasCreated: number;
      modelosCreated: number;
      anosCreated: number;
      skipped: number;
      errors: string[];
    }
  | { ok: false; message: string };

const ANO_MIN = 1900;
const ANO_MAX = 2100;
const INTERVALO_MAX = 100;

async function allocateMarcaSlug(
  supabase: SupabaseClient,
  baseRaw: string,
): Promise<string> {
  const base = slugify(baseRaw);
  let candidate = base;
  let n = 2;
  for (;;) {
    const { data } = await supabase.from("marcas").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${n}`;
    n += 1;
    if (n > 200) return `${base}-${Date.now()}`;
  }
}

async function allocateModeloSlug(
  supabase: SupabaseClient,
  marcaId: string,
  baseRaw: string,
): Promise<string> {
  const base = slugify(baseRaw);
  let candidate = base;
  let n = 2;
  for (;;) {
    const { data } = await supabase
      .from("modelos")
      .select("id")
      .eq("marca_id", marcaId)
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${n}`;
    n += 1;
    if (n > 200) return `${base}-${Date.now()}`;
  }
}

function clampYearRange(anoInicio: number, anoFim: number): { ini: number; fim: number } | null {
  let ini = Math.trunc(anoInicio);
  let fim = Math.trunc(anoFim);
  if (!Number.isFinite(ini) || !Number.isFinite(fim)) return null;
  // Open-ended Excel → 2099: keep catalog years practical
  const currentPlus = new Date().getFullYear() + 1;
  if (fim > currentPlus + 5) fim = Math.max(ini, currentPlus);
  if (ini < ANO_MIN || ini > ANO_MAX || fim < ANO_MIN || fim > ANO_MAX) return null;
  if (fim < ini) return null;
  if (fim - ini > INTERVALO_MAX) fim = ini + INTERVALO_MAX;
  return { ini, fim };
}

/**
 * Creates missing marcas/modelos/modelo_anos from WEGA import suggestions.
 */
export async function registerWegaSuggestedModelos(
  supabase: SupabaseClient,
  suggestions: WegaModeloSuggestion[],
): Promise<RegisterWegaModelosResult> {
  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    return { ok: false, message: "Nenhum modelo sugerido para cadastrar." };
  }

  const errors: string[] = [];
  let marcasCreated = 0;
  let modelosCreated = 0;
  let anosCreated = 0;
  let skipped = 0;

  const marcaIdCache = new Map<string, string>();

  async function resolveMarcaId(montadora: string, knownId: string | null): Promise<string | null> {
    const key = normalizeWegaText(montadora);
    if (knownId) {
      marcaIdCache.set(key, knownId);
      return knownId;
    }
    const cached = marcaIdCache.get(key);
    if (cached) return cached;

    const nome = titleCaseWords(montadora);
    const { data: existing } = await supabase
      .from("marcas")
      .select("id, nome")
      .ilike("nome", nome)
      .maybeSingle();
    if (existing?.id) {
      marcaIdCache.set(key, existing.id);
      return existing.id;
    }

    // Broader scan by normalized name among recent brands is expensive; try exact list fetch by slug
    const slugGuess = slugify(nome);
    const { data: bySlug } = await supabase
      .from("marcas")
      .select("id")
      .eq("slug", slugGuess)
      .maybeSingle();
    if (bySlug?.id) {
      marcaIdCache.set(key, bySlug.id);
      return bySlug.id;
    }

    const slug = await allocateMarcaSlug(supabase, nome);
    const { data: inserted, error } = await supabase
      .from("marcas")
      .insert({ nome, slug })
      .select("id")
      .single();
    if (error || !inserted?.id) {
      errors.push(`Marca "${nome}": ${error?.message ?? "falha ao criar"}`);
      return null;
    }
    marcasCreated += 1;
    marcaIdCache.set(key, inserted.id);
    return inserted.id;
  }

  for (const suggestion of suggestions) {
    const montadora = String(suggestion.montadora ?? "").trim();
    const nomeModelo = String(suggestion.nomeModelo ?? "").trim();
    if (!montadora || !nomeModelo) {
      skipped += 1;
      continue;
    }

    const marcaId = await resolveMarcaId(montadora, suggestion.marcaId ?? null);
    if (!marcaId) {
      skipped += 1;
      continue;
    }

    // Skip if same name already exists for brand (case-insensitive-ish via normalize)
    const { data: modelosExistentes } = await supabase
      .from("modelos")
      .select("id, nome")
      .eq("marca_id", marcaId);

    const nomeNorm = normalizeWegaText(nomeModelo);
    const already = (modelosExistentes ?? []).find(
      (m) => normalizeWegaText(String(m.nome ?? "")) === nomeNorm,
    );
    let modeloId = already?.id ? String(already.id) : null;

    if (!modeloId) {
      const slug = await allocateModeloSlug(supabase, marcaId, nomeModelo);
      const { data: inserted, error } = await supabase
        .from("modelos")
        .insert({
          marca_id: marcaId,
          nome: nomeModelo,
          slug,
          tipo_veiculo: "carro",
        })
        .select("id")
        .single();
      if (error || !inserted?.id) {
        if (error?.code === "23505") {
          skipped += 1;
          continue;
        }
        errors.push(`Modelo "${montadora} ${nomeModelo}": ${error?.message ?? "falha"}`);
        skipped += 1;
        continue;
      }
      modeloId = inserted.id;
      modelosCreated += 1;
    } else {
      skipped += 1;
    }

    const range = clampYearRange(Number(suggestion.anoInicio), Number(suggestion.anoFim));
    if (!range || !modeloId) continue;

    const { data: anosExistentes } = await supabase
      .from("modelo_anos")
      .select("ano")
      .eq("modelo_id", modeloId);
    const have = new Set((anosExistentes ?? []).map((r) => Number(r.ano)));

    const toInsert: Array<{ modelo_id: string; ano: number }> = [];
    for (let y = range.ini; y <= range.fim; y++) {
      if (!have.has(y)) toInsert.push({ modelo_id: modeloId, ano: y });
    }
    if (toInsert.length === 0) continue;

    const { error: anosErr } = await supabase.from("modelo_anos").insert(toInsert);
    if (anosErr) {
      errors.push(`Anos de "${nomeModelo}": ${anosErr.message}`);
    } else {
      anosCreated += toInsert.length;
    }
  }

  return {
    ok: true,
    marcasCreated,
    modelosCreated,
    anosCreated,
    skipped,
    errors,
  };
}
