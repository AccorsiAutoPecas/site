import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

import {
  findMarcaId,
  matchWegaCompatModelos,
  type WegaMarcaCandidate,
  type WegaModeloCandidate,
} from "@/features/produtos/utils/matchWegaCompatModelos";
import {
  buildWegaModeloSuggestions,
  type WegaModeloSuggestion,
} from "@/features/produtos/utils/buildWegaModeloSuggestions";
import { PRODUCT_STATUS_DRAFT } from "@/features/produtos/utils/productStatus";
import { revalidateStoreCatalogCache } from "@/features/produtos/utils/catalogCacheTags";
import { normalizeWegaText } from "@/features/produtos/utils/wegaText";
import {
  parseWegaKitsWorkbook,
  type WegaKitRow,
} from "@/features/produtos/services/parseWegaKitsWorkbook";

export type WegaImportUnmatched = {
  sheetRow: number;
  titulo: string;
  montadora: string;
  carroModelo: string;
  reason: string;
};

export type WegaImportResult = {
  ok: true;
  dryRun: boolean;
  totalRows: number;
  created: number;
  /** Produtos já existentes que receberam preço, dimensões ou categoria em campo vazio. */
  updated: number;
  skipped: number;
  compatLinks: number;
  unmatchedCompat: WegaImportUnmatched[];
  /** Modelos sugeridos para cadastrar quando o match falhou. */
  suggestedModelos: WegaModeloSuggestion[];
  warnings: string[];
  errors: string[];
  /** Sample of titles that would be / were created (max 20). */
  sampleTitles: string[];
};

export type WegaImportFailure = { ok: false; message: string };

const PAGE = 1000;

type ExistingProduct = {
  id: string;
  valor: number | null;
  prod_comprimento_cm: number | null;
  prod_largura_cm: number | null;
  prod_altura_cm: number | null;
  prod_peso_kg: number | null;
  hasCategoria: boolean;
};

type ProductBlankPatch = {
  valor?: number;
  prod_comprimento_cm?: number;
  prod_largura_cm?: number;
  prod_altura_cm?: number;
  prod_peso_kg?: number;
};

function toNumberOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

async function fetchExistingByTitle(supabase: SupabaseClient): Promise<
  | { ok: true; byTitle: Map<string, ExistingProduct> }
  | { ok: false; message: string }
> {
  const byTitle = new Map<string, ExistingProduct>();
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("produtos")
      .select("id, titulo, valor, prod_comprimento_cm, prod_largura_cm, prod_altura_cm, prod_peso_kg")
      .not("titulo", "is", null)
      .range(from, from + PAGE - 1);
    if (error) return { ok: false, message: error.message };
    const rows = data ?? [];
    for (const row of rows) {
      const titulo = typeof row.titulo === "string" ? row.titulo.trim() : "";
      const id = typeof row.id === "string" ? row.id : "";
      if (!titulo || !id || byTitle.has(titulo)) continue;
      byTitle.set(titulo, {
        id,
        valor: toNumberOrNull(row.valor),
        prod_comprimento_cm: toNumberOrNull(row.prod_comprimento_cm),
        prod_largura_cm: toNumberOrNull(row.prod_largura_cm),
        prod_altura_cm: toNumberOrNull(row.prod_altura_cm),
        prod_peso_kg: toNumberOrNull(row.prod_peso_kg),
        hasCategoria: false,
      });
    }
    if (rows.length < PAGE) break;
    from += PAGE;
  }

  from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("produto_categorias")
      .select("produto_id")
      .range(from, from + PAGE - 1);
    if (error) return { ok: false, message: error.message };
    const rows = data ?? [];
    const withCategoria = new Set(
      rows.map((row) => (typeof row.produto_id === "string" ? row.produto_id : "")).filter(Boolean),
    );
    for (const product of byTitle.values()) {
      if (withCategoria.has(product.id)) product.hasCategoria = true;
    }
    if (rows.length < PAGE) break;
    from += PAGE;
  }

  return { ok: true, byTitle };
}

async function fetchCategoriaByNome(supabase: SupabaseClient): Promise<
  | { ok: true; byNome: Map<string, string> }
  | { ok: false; message: string }
> {
  const byNome = new Map<string, string>();
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("categorias")
      .select("id, nome")
      .range(from, from + PAGE - 1);
    if (error) return { ok: false, message: error.message };
    const rows = data ?? [];
    for (const row of rows) {
      const nome = typeof row.nome === "string" ? row.nome : "";
      const id = typeof row.id === "string" ? row.id : "";
      const key = normalizeWegaText(nome);
      if (!key || !id || byNome.has(key)) continue;
      byNome.set(key, id);
    }
    if (rows.length < PAGE) break;
    from += PAGE;
  }
  return { ok: true, byNome };
}

async function fetchMarcasModelos(supabase: SupabaseClient): Promise<
  | { ok: true; marcas: WegaMarcaCandidate[]; modelosByMarca: Map<string, WegaModeloCandidate[]> }
  | { ok: false; message: string }
> {
  const marcas: WegaMarcaCandidate[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("marcas")
      .select("id, nome")
      .range(from, from + PAGE - 1);
    if (error) return { ok: false, message: error.message };
    const rows = (data ?? []) as WegaMarcaCandidate[];
    marcas.push(...rows);
    if (rows.length < PAGE) break;
    from += PAGE;
  }

  const modelosByMarca = new Map<string, WegaModeloCandidate[]>();
  from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("modelos")
      .select("id, nome, marca_id")
      .range(from, from + PAGE - 1);
    if (error) return { ok: false, message: error.message };
    const rows = (data ?? []) as WegaModeloCandidate[];
    for (const modelo of rows) {
      const list = modelosByMarca.get(modelo.marca_id) ?? [];
      list.push(modelo);
      modelosByMarca.set(modelo.marca_id, list);
    }
    if (rows.length < PAGE) break;
    from += PAGE;
  }

  return { ok: true, marcas, modelosByMarca };
}

type PlannedProduct = {
  row: WegaKitRow;
  modeloIds: string[];
  unmatchedReason: string | null;
  categoriaId: string | null;
};

type PlannedUpdate = {
  row: WegaKitRow;
  productId: string;
  patch: ProductBlankPatch;
  categoriaId: string | null;
};

function blankFillPatch(existing: ExistingProduct, row: WegaKitRow): ProductBlankPatch {
  const patch: ProductBlankPatch = {};
  if (existing.valor == null && row.valor != null) patch.valor = row.valor;
  if (existing.prod_comprimento_cm == null && row.prodComprimentoCm != null) {
    patch.prod_comprimento_cm = row.prodComprimentoCm;
  }
  if (existing.prod_largura_cm == null && row.prodLarguraCm != null) {
    patch.prod_largura_cm = row.prodLarguraCm;
  }
  if (existing.prod_altura_cm == null && row.prodAlturaCm != null) {
    patch.prod_altura_cm = row.prodAlturaCm;
  }
  if (existing.prod_peso_kg == null && row.prodPesoKg != null) {
    patch.prod_peso_kg = row.prodPesoKg;
  }
  return patch;
}

function resolveCategoriaId(
  nome: string,
  byNome: Map<string, string>,
  missing: Set<string>,
): string | null {
  const trimmed = nome.trim();
  if (!trimmed) return null;
  const id = byNome.get(normalizeWegaText(trimmed));
  if (!id) missing.add(trimmed);
  return id ?? null;
}

function planRows(
  rows: WegaKitRow[],
  existingByTitle: Map<string, ExistingProduct>,
  marcas: WegaMarcaCandidate[],
  modelosByMarca: Map<string, WegaModeloCandidate[]>,
  categoriaByNome: Map<string, string>,
): {
  toCreate: PlannedProduct[];
  toUpdate: PlannedUpdate[];
  skipped: number;
  unmatchedCompat: WegaImportUnmatched[];
  sampleTitles: string[];
  categoryWarnings: string[];
} {
  const toCreate: PlannedProduct[] = [];
  const toUpdate: PlannedUpdate[] = [];
  const unmatchedCompat: WegaImportUnmatched[] = [];
  let skipped = 0;
  const seenInBatch = new Set<string>();
  const missingCategorias = new Set<string>();

  for (const row of rows) {
    if (seenInBatch.has(row.titulo)) {
      skipped += 1;
      continue;
    }
    seenInBatch.add(row.titulo);

    const existing = existingByTitle.get(row.titulo);
    if (existing) {
      const patch = blankFillPatch(existing, row);
      const categoriaId = existing.hasCategoria
        ? null
        : resolveCategoriaId(row.categoriaNome, categoriaByNome, missingCategorias);
      if (Object.keys(patch).length === 0 && !categoriaId) {
        skipped += 1;
        continue;
      }
      toUpdate.push({ row, productId: existing.id, patch, categoriaId });
      continue;
    }

    const categoriaId = resolveCategoriaId(row.categoriaNome, categoriaByNome, missingCategorias);
    const marcaId = findMarcaId(row.montadora, marcas);
    if (!marcaId) {
      toCreate.push({
        row,
        modeloIds: [],
        unmatchedReason: `Marca não encontrada: ${row.montadora}`,
        categoriaId,
      });
      unmatchedCompat.push({
        sheetRow: row.sheetRow,
        titulo: row.titulo,
        montadora: row.montadora,
        carroModelo: row.carroModelo,
        reason: `Marca não encontrada: ${row.montadora}`,
      });
      continue;
    }

    const modelos = modelosByMarca.get(marcaId) ?? [];
    const matched = matchWegaCompatModelos({
      carroModelo: row.carroModelo,
      modelosDaMarca: modelos,
    });

    if (matched.length === 0) {
      toCreate.push({
        row,
        modeloIds: [],
        unmatchedReason: `Nenhum modelo parecido para: ${row.carroModelo}`,
        categoriaId,
      });
      unmatchedCompat.push({
        sheetRow: row.sheetRow,
        titulo: row.titulo,
        montadora: row.montadora,
        carroModelo: row.carroModelo,
        reason: `Nenhum modelo parecido para: ${row.carroModelo}`,
      });
      continue;
    }

    toCreate.push({
      row,
      modeloIds: matched.map((m) => m.id),
      unmatchedReason: null,
      categoriaId,
    });
  }

  return {
    toCreate,
    toUpdate,
    skipped,
    unmatchedCompat,
    sampleTitles: [...toCreate, ...toUpdate].slice(0, 20).map((p) => p.row.titulo),
    categoryWarnings: [...missingCategorias].map((nome) => `Categoria não encontrada: ${nome}`),
  };
}

/**
 * Import WEGA kit spreadsheet: 1 Excel row → 1 draft product + compat matches.
 */
export async function importWegaKitsProducts(
  supabase: SupabaseClient,
  buffer: ArrayBuffer | Uint8Array,
  options: { dryRun: boolean },
): Promise<WegaImportResult | WegaImportFailure> {
  const parsed = parseWegaKitsWorkbook(buffer);
  if (!parsed.ok) return parsed;

  const [existingRes, catalog, categoriasRes] = await Promise.all([
    fetchExistingByTitle(supabase),
    fetchMarcasModelos(supabase),
    fetchCategoriaByNome(supabase),
  ]);
  if (!existingRes.ok) return existingRes;
  if (!catalog.ok) return catalog;
  if (!categoriasRes.ok) return categoriasRes;

  const planned = planRows(
    parsed.rows,
    existingRes.byTitle,
    catalog.marcas,
    catalog.modelosByMarca,
    categoriasRes.byNome,
  );

  const marcaIdByMontadora = new Map<string, string | null>();
  const yearBySheetRow = new Map<number, { anoInicio: number; anoFim: number }>();
  for (const row of parsed.rows) {
    yearBySheetRow.set(row.sheetRow, { anoInicio: row.anoInicio, anoFim: row.anoFim });
    const key = normalizeWegaText(row.montadora);
    if (!marcaIdByMontadora.has(key)) {
      marcaIdByMontadora.set(key, findMarcaId(row.montadora, catalog.marcas));
    }
  }
  const suggestedModelos = buildWegaModeloSuggestions(
    planned.unmatchedCompat,
    marcaIdByMontadora,
    yearBySheetRow,
  );

  const errors: string[] = [];
  const warnings = [...parsed.warnings, ...planned.categoryWarnings];
  let created = 0;
  let updated = 0;
  let compatLinks = 0;

  if (options.dryRun) {
    for (const item of planned.toCreate) {
      created += 1;
      compatLinks += item.modeloIds.length;
    }
    return {
      ok: true,
      dryRun: true,
      totalRows: parsed.rows.length,
      created,
      updated: planned.toUpdate.length,
      skipped: planned.skipped,
      compatLinks,
      unmatchedCompat: planned.unmatchedCompat,
      suggestedModelos,
      warnings,
      errors,
      sampleTitles: planned.sampleTitles,
    };
  }

  // Commit in chunks to avoid huge payloads
  const CHUNK = 40;
  for (let i = 0; i < planned.toCreate.length; i += CHUNK) {
    const chunk = planned.toCreate.slice(i, i + CHUNK);
    const payload = chunk.map((item) => ({
      titulo: item.row.titulo,
      descricao: item.row.descricao,
      cod_produto: null,
      valor: item.row.valor,
      prod_comprimento_cm: item.row.prodComprimentoCm,
      prod_largura_cm: item.row.prodLarguraCm,
      prod_altura_cm: item.row.prodAlturaCm,
      prod_peso_kg: item.row.prodPesoKg,
      quantidade_estoque: 0,
      status: PRODUCT_STATUS_DRAFT,
      compat_todos_modelos: false,
    }));

    const { data: inserted, error: insErr } = await supabase
      .from("produtos")
      .insert(payload)
      .select("id, titulo");

    if (insErr || !inserted) {
      errors.push(insErr?.message ?? `Falha ao inserir lote a partir da linha Excel ~${chunk[0]?.row.sheetRow}`);
      break;
    }

    created += inserted.length;

    const byTitle = new Map<string, string>();
    for (const prod of inserted) {
      if (prod.titulo && prod.id) byTitle.set(String(prod.titulo), String(prod.id));
    }

    const compatRows: Array<{
      produto_id: string;
      modelo_id: string;
      ano_inicio: number;
      ano_fim: number;
    }> = [];
    const categoriaRows: Array<{ produto_id: string; categoria_id: string }> = [];

    for (const item of chunk) {
      const produtoId = byTitle.get(item.row.titulo);
      if (!produtoId) continue;
      for (const modeloId of item.modeloIds) {
        compatRows.push({
          produto_id: produtoId,
          modelo_id: modeloId,
          ano_inicio: item.row.anoInicio,
          ano_fim: item.row.anoFim,
        });
      }
      if (item.categoriaId) {
        categoriaRows.push({ produto_id: produtoId, categoria_id: item.categoriaId });
      }
    }

    if (compatRows.length > 0) {
      const { error: cErr } = await supabase.from("produto_compatibilidades").insert(compatRows);
      if (cErr) {
        errors.push(`Compatibilidades: ${cErr.message}`);
      } else {
        compatLinks += compatRows.length;
      }
    }

    if (categoriaRows.length > 0) {
      const { error: catErr } = await supabase.from("produto_categorias").insert(categoriaRows);
      if (catErr) errors.push(`Categorias: ${catErr.message}`);
    }
  }

  for (let i = 0; i < planned.toUpdate.length; i += CHUNK) {
    const chunk = planned.toUpdate.slice(i, i + CHUNK);
    const results = await Promise.all(
      chunk.map(async (item) => {
        if (Object.keys(item.patch).length > 0) {
          const { error } = await supabase.from("produtos").update(item.patch).eq("id", item.productId);
          if (error) return error.message;
        }
        if (item.categoriaId) {
          const { error } = await supabase.from("produto_categorias").insert({
            produto_id: item.productId,
            categoria_id: item.categoriaId,
          });
          if (error) return `Categorias: ${error.message}`;
        }
        return null;
      }),
    );
    for (const message of results) {
      if (message) errors.push(message);
      else updated += 1;
    }
  }

  if (created > 0 || updated > 0) {
    revalidatePath("/admin/produtos");
    revalidatePath("/produtos");
    revalidatePath("/");
    revalidateStoreCatalogCache();
  }

  return {
    ok: true,
    dryRun: false,
    totalRows: parsed.rows.length,
    created,
    updated,
    skipped: planned.skipped,
    compatLinks,
    unmatchedCompat: planned.unmatchedCompat,
    suggestedModelos,
    warnings,
    errors,
    sampleTitles: planned.sampleTitles,
  };
}
