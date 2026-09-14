import {
  normalizeWegaText,
  parseCarroModelo,
  titleCaseWords,
} from "@/features/produtos/utils/wegaText";

type UnmatchedCompatInput = {
  sheetRow: number;
  montadora: string;
  carroModelo: string;
};

export type WegaModeloSuggestion = {
  /** Stable key for UI checkboxes. */
  key: string;
  montadora: string;
  /** Nome sugerido para cadastrar em `modelos`. */
  nomeModelo: string;
  anoInicio: number;
  anoFim: number;
  marcaId: string | null;
  needsMarca: boolean;
  /** Excel rows that motivated this suggestion. */
  sheetRows: number[];
};

function suggestionKey(montadora: string, nomeModelo: string): string {
  return `${normalizeWegaText(montadora)}::${normalizeWegaText(nomeModelo)}`;
}

function expandSuggestedNomes(carroModelo: string): string[] {
  const parsed = parseCarroModelo(carroModelo);
  if (!parsed.base) return [];
  const baseTitle = titleCaseWords(parsed.base);
  if (parsed.versions.length === 0) return [baseTitle];
  return parsed.versions.map((version) => {
    const v = version.trim();
    // Keep short trim codes uppercase (GL, GLX); title-case longer words
    const versionLabel =
      v.length <= 4 && /^[A-Za-z0-9]+$/.test(v) ? v.toUpperCase() : titleCaseWords(v);
    return `${baseTitle} ${versionLabel}`.trim();
  });
}

/**
 * From unmatched Excel rows, build unique modelo suggestions to create in the catalog.
 * Years are merged (min inicio / max fim) when the same suggestion appears on several rows.
 */
export function buildWegaModeloSuggestions(
  unmatched: UnmatchedCompatInput[],
  marcaIdByMontadora: Map<string, string | null>,
  yearBySheetRow: Map<number, { anoInicio: number; anoFim: number }>,
): WegaModeloSuggestion[] {
  const byKey = new Map<string, WegaModeloSuggestion>();

  for (const row of unmatched) {
    const nomes = expandSuggestedNomes(row.carroModelo);
    const years = yearBySheetRow.get(row.sheetRow) ?? { anoInicio: 2000, anoFim: 2000 };
    const marcaId = marcaIdByMontadora.get(normalizeWegaText(row.montadora)) ?? null;
    const montadoraDisplay = titleCaseWords(row.montadora);

    for (const nomeModelo of nomes) {
      const key = suggestionKey(row.montadora, nomeModelo);
      const existing = byKey.get(key);
      if (existing) {
        existing.anoInicio = Math.min(existing.anoInicio, years.anoInicio);
        existing.anoFim = Math.max(existing.anoFim, years.anoFim);
        if (!existing.sheetRows.includes(row.sheetRow)) {
          existing.sheetRows.push(row.sheetRow);
        }
        continue;
      }
      byKey.set(key, {
        key,
        montadora: montadoraDisplay,
        nomeModelo,
        anoInicio: years.anoInicio,
        anoFim: years.anoFim,
        marcaId,
        needsMarca: !marcaId,
        sheetRows: [row.sheetRow],
      });
    }
  }

  return [...byKey.values()].sort(
    (a, b) =>
      a.montadora.localeCompare(b.montadora, "pt-BR") ||
      a.nomeModelo.localeCompare(b.nomeModelo, "pt-BR"),
  );
}
