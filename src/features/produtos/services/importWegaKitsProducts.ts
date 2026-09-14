import type { SupabaseClient } from "@supabase/supabase-js";

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

async function fetchAllTitulosDraftish(
  supabase: SupabaseClient,
): Promise<{ titles: Set<string>; error: string | null }> {
  const titles = new Set<string>();
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("produtos")
      .select("titulo")
      .not("titulo", "is", null)
      .range(from, from + PAGE - 1);
    if (error) return { titles, error: error.message };
    const rows = data ?? [];
    for (const row of rows) {
      const t = typeof row.titulo === "string" ? row.titulo.trim() : "";
      if (t) titles.add(t);
    }
    if (rows.length < PAGE) break;
    from += PAGE;
  }
  return { titles, error: null };
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
};

function planRows(
  rows: WegaKitRow[],
  existingTitles: Set<string>,
  marcas: WegaMarcaCandidate[],
  modelosByMarca: Map<string, WegaModeloCandidate[]>,
): {
  toCreate: PlannedProduct[];
  skipped: number;
  unmatchedCompat: WegaImportUnmatched[];
  sampleTitles: string[];
} {
  const toCreate: PlannedProduct[] = [];
  const unmatchedCompat: WegaImportUnmatched[] = [];
  let skipped = 0;
  const seenInBatch = new Set<string>();

  for (const row of rows) {
    if (existingTitles.has(row.titulo) || seenInBatch.has(row.titulo)) {
      skipped += 1;
      continue;
    }
    seenInBatch.add(row.titulo);

    const marcaId = findMarcaId(row.montadora, marcas);
    if (!marcaId) {
      toCreate.push({
        row,
        modeloIds: [],
        unmatchedReason: `Marca não encontrada: ${row.montadora}`,
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
    });
  }

  return {
    toCreate,
    skipped,
    unmatchedCompat,
    sampleTitles: toCreate.slice(0, 20).map((p) => p.row.titulo),
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

  const titlesRes = await fetchAllTitulosDraftish(supabase);
  if (titlesRes.error) return { ok: false, message: titlesRes.error };

  const catalog = await fetchMarcasModelos(supabase);
  if (!catalog.ok) return catalog;

  const planned = planRows(
    parsed.rows,
    titlesRes.titles,
    catalog.marcas,
    catalog.modelosByMarca,
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
  let created = 0;
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
      skipped: planned.skipped,
      compatLinks,
      unmatchedCompat: planned.unmatchedCompat,
      suggestedModelos,
      warnings: parsed.warnings,
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
      valor: null,
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
    }

    if (compatRows.length > 0) {
      const { error: cErr } = await supabase.from("produto_compatibilidades").insert(compatRows);
      if (cErr) {
        errors.push(`Compatibilidades: ${cErr.message}`);
      } else {
        compatLinks += compatRows.length;
      }
    }
  }

  return {
    ok: true,
    dryRun: false,
    totalRows: parsed.rows.length,
    created,
    skipped: planned.skipped,
    compatLinks,
    unmatchedCompat: planned.unmatchedCompat,
    suggestedModelos,
    warnings: parsed.warnings,
    errors,
    sampleTitles: planned.sampleTitles,
  };
}
