import * as XLSX from "xlsx";

import {
  buildWegaProductDescription,
  buildWegaProductTitle,
  parseAnoRange,
  parseCarroModelo,
} from "@/features/produtos/utils/wegaText";

export type WegaKitRow = {
  /** 1-based spreadsheet row number (for reports). */
  sheetRow: number;
  codigo: string;
  montadora: string;
  carroModelo: string;
  combustivelVeiculo: string;
  cambio: string;
  motor: string;
  anoRaw: string;
  filtroAr: string;
  filtroOleo: string;
  filtroCombustivel: string;
  filtroCabine: string;
  titulo: string;
  descricao: string;
  anoInicio: number;
  anoFim: number;
  /** Null when the cell is empty or the number could not be parsed. */
  valor: number | null;
  prodAlturaCm: number | null;
  prodComprimentoCm: number | null;
  prodLarguraCm: number | null;
  prodPesoKg: number | null;
  categoriaNome: string;
};

export type ParseWegaKitsResult =
  | { ok: true; rows: WegaKitRow[]; warnings: string[] }
  | { ok: false; message: string };

function cellText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value).trim();
}

function normalizeHeader(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

type ColumnMap = {
  codigo: number;
  montadora: number;
  carroModelo: number;
  combustivelVeiculo: number;
  cambio: number;
  motor: number;
  ano: number;
  filtroAr: number;
  filtroOleo: number;
  filtroCombustivel: number;
  filtroCabine: number;
  altura: number;
  comprimento: number;
  largura: number;
  peso: number;
  preco: number;
  categoria: number;
};

function findCol(headers: string[], label: string, mode: "exact" | "includes"): number {
  if (mode === "exact") return headers.findIndex((h) => h === label);
  return headers.findIndex((h) => h === label || h.includes(label));
}

/** First match across the header row and the optional sub-header row. */
function findAcross(headerRows: string[][], label: string, mode: "exact" | "includes"): number {
  for (const headers of headerRows) {
    const index = findCol(headers, label, mode);
    if (index >= 0) return index;
  }
  return -1;
}

/**
 * Brazilian spreadsheet numbers: `189`, `189,00`, `1.189,50`, `R$ 189,00`, `0,400kg`.
 * Empty → null. Invalid → "invalid" (caller warns and keeps the row).
 */
function parseOptionalMeasure(raw: string): number | null | "invalid" {
  const stripped = raw
    .trim()
    .replace(/r\$/gi, "")
    .replace(/kg/gi, "")
    .replace(/cm/gi, "")
    .replace(/\s+/g, "");
  if (!stripped) return null;

  const normalized = stripped.includes(",")
    ? stripped.replace(/\./g, "").replace(",", ".")
    : stripped;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return "invalid";
  return value;
}

function findHeaderRow(matrix: unknown[][]): { headerRowIndex: number; map: ColumnMap } | null {
  const maxScan = Math.min(matrix.length, 12);
  for (let r = 0; r < maxScan; r++) {
    const row = matrix[r] ?? [];
    const headers = row.map((cell) => normalizeHeader(cellText(cell)));

    const findExact = (label: string): number => headers.findIndex((h) => h === label);
    const findIncludes = (label: string): number =>
      headers.findIndex((h) => h === label || h.includes(label));

    const codigo = findExact("codigo");
    const montadora = findExact("montadora");
    const carroModelo =
      findExact("carro modelo") >= 0
        ? findExact("carro modelo")
        : findIncludes("carro") >= 0
          ? findIncludes("carro")
          : findIncludes("modelo");

    if (montadora < 0 || carroModelo < 0) continue;

    const combustivelIndexes = headers
      .map((h, i) => (h === "combustivel" || h.includes("combustivel") ? i : -1))
      .filter((i) => i >= 0);

    const cambio = findExact("cambio") >= 0 ? findExact("cambio") : findIncludes("cambio");
    const motor = findExact("motor");
    const ano = findExact("ano");
    const filtroAr = findExact("ar");
    const filtroOleo = findExact("oleo") >= 0 ? findExact("oleo") : findIncludes("oleo");
    const filtroCabine =
      findExact("cabine") >= 0 ? findExact("cabine") : findIncludes("cabine");

    // Prefer a second header row for kit filter columns if current row lacks them.
    let ar = filtroAr;
    let oleo = filtroOleo;
    let cabine = filtroCabine;
    let filtroComb = combustivelIndexes.length > 1 ? combustivelIndexes[1]! : -1;

    if (ar < 0 || oleo < 0 || cabine < 0) {
      const next = matrix[r + 1] ?? [];
      const nextHeaders = next.map((cell) => normalizeHeader(cellText(cell)));
      if (ar < 0) ar = nextHeaders.findIndex((h) => h === "ar");
      if (oleo < 0) {
        oleo =
          nextHeaders.findIndex((h) => h === "oleo") >= 0
            ? nextHeaders.findIndex((h) => h === "oleo")
            : nextHeaders.findIndex((h) => h.includes("oleo"));
      }
      if (cabine < 0) {
        cabine =
          nextHeaders.findIndex((h) => h === "cabine") >= 0
            ? nextHeaders.findIndex((h) => h === "cabine")
            : nextHeaders.findIndex((h) => h.includes("cabine"));
      }
      if (filtroComb < 0) {
        const nextComb = nextHeaders
          .map((h, i) => (h === "combustivel" || h.includes("combustivel") ? i : -1))
          .filter((i) => i >= 0);
        if (nextComb.length > 0) filtroComb = nextComb[nextComb.length - 1]!;
      }
    }

    if (cambio < 0 || motor < 0 || ano < 0) continue;

    const next = matrix[r + 1] ?? [];
    const nextHeaders = next.map((cell) => normalizeHeader(cellText(cell)));
    const headerRows = [headers, nextHeaders];

    return {
      headerRowIndex: r,
      map: {
        codigo,
        montadora,
        carroModelo,
        combustivelVeiculo: combustivelIndexes[0] ?? -1,
        cambio,
        motor,
        ano,
        filtroAr: ar,
        filtroOleo: oleo,
        filtroCombustivel: filtroComb,
        filtroCabine: cabine,
        altura: findAcross(headerRows, "altura", "includes"),
        comprimento: findAcross(headerRows, "comprimento", "includes"),
        largura: findAcross(headerRows, "largura", "includes"),
        peso: findAcross(headerRows, "peso", "includes"),
        preco: findAcross(headerRows, "preco", "includes"),
        categoria: findAcross(headerRows, "categoria", "includes"),
      },
    };
  }
  return null;
}

function col(row: unknown[], index: number): string {
  if (index < 0) return "";
  return cellText(row[index]);
}

function readMeasure(
  row: unknown[],
  index: number,
  sheetRow: number,
  label: string,
  warnings: string[],
): number | null {
  if (index < 0) return null;
  const raw = col(row, index);
  if (!raw) return null;
  const parsed = parseOptionalMeasure(raw);
  if (parsed === "invalid") {
    warnings.push(`Linha ${sheetRow}: ${label} inválido "${raw}" — campo ignorado.`);
    return null;
  }
  return parsed;
}

/**
 * Parses a WEGA kits workbook buffer into product-ready rows (1 Excel row = 1 product).
 */
export function parseWegaKitsWorkbook(buffer: ArrayBuffer | Uint8Array): ParseWegaKitsResult {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "array", cellDates: false, raw: false });
  } catch (cause) {
    return {
      ok: false,
      message: cause instanceof Error ? cause.message : "Não foi possível ler o arquivo Excel.",
    };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { ok: false, message: "A planilha está vazia." };

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return { ok: false, message: "Aba da planilha não encontrada." };

  const matrix = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as unknown[][];

  if (matrix.length === 0) return { ok: false, message: "A planilha não tem linhas." };

  const header = findHeaderRow(matrix);
  if (!header) {
    return {
      ok: false,
      message:
        "Não foi possível identificar o cabeçalho. Esperado: MONTADORA, CARRO / MODELO, ANO, etc.",
    };
  }

  const { headerRowIndex, map } = header;
  const warnings: string[] = [];
  const rows: WegaKitRow[] = [];

  // Data may start on the next row; if the next row looks like a sub-header (AR/ÓLEO), skip it.
  let start = headerRowIndex + 1;
  const maybeSub = matrix[start] ?? [];
  const subNorm = maybeSub.map((c) => normalizeHeader(cellText(c)));
  if (subNorm.includes("ar") && (subNorm.includes("oleo") || subNorm.includes("cabine"))) {
    start += 1;
  }

  for (let i = start; i < matrix.length; i++) {
    const row = matrix[i] ?? [];
    const codigo = col(row, map.codigo);
    const montadora = col(row, map.montadora);
    const carroModelo = col(row, map.carroModelo);
    const anoRaw = col(row, map.ano);

    // Skip blank / separator rows
    if (!codigo && !montadora && !carroModelo) continue;

    const sheetRow = i + 1;
    if (!montadora || !carroModelo || !anoRaw) {
      warnings.push(`Linha ${sheetRow}: montadora, carro/modelo ou ano ausente — ignorada.`);
      continue;
    }

    const anos = parseAnoRange(anoRaw);
    if (!anos) {
      warnings.push(`Linha ${sheetRow}: ano inválido "${anoRaw}" — ignorada.`);
      continue;
    }

    const titulo = buildWegaProductTitle({ montadora, carroModelo, anoRaw });
    if (!titulo) {
      warnings.push(`Linha ${sheetRow}: não foi possível montar o título — ignorada.`);
      continue;
    }

    // Ensure parseCarroModelo ran for validation (title already uses it)
    parseCarroModelo(carroModelo);

    const filtroAr = col(row, map.filtroAr);
    const filtroOleo = col(row, map.filtroOleo);
    const filtroCombustivel = col(row, map.filtroCombustivel);
    const filtroCabine = col(row, map.filtroCabine);
    const motor = col(row, map.motor);
    const cambio = col(row, map.cambio);
    const combustivelVeiculo = col(row, map.combustivelVeiculo);

    rows.push({
      sheetRow,
      codigo,
      montadora,
      carroModelo,
      combustivelVeiculo,
      cambio,
      motor,
      anoRaw,
      filtroAr,
      filtroOleo,
      filtroCombustivel,
      filtroCabine,
      titulo,
      descricao: buildWegaProductDescription({
        codigo,
        filtroAr,
        filtroOleo,
        filtroCombustivel,
        filtroCabine,
        motor,
        cambio,
        combustivelVeiculo,
      }),
      anoInicio: anos.anoInicio,
      anoFim: anos.anoFim,
      valor: readMeasure(row, map.preco, sheetRow, "Preço", warnings),
      prodAlturaCm: readMeasure(row, map.altura, sheetRow, "Altura", warnings),
      prodComprimentoCm: readMeasure(row, map.comprimento, sheetRow, "Comprimento", warnings),
      prodLarguraCm: readMeasure(row, map.largura, sheetRow, "Largura", warnings),
      prodPesoKg: readMeasure(row, map.peso, sheetRow, "Peso", warnings),
      categoriaNome: col(row, map.categoria),
    });
  }

  if (rows.length === 0) {
    return {
      ok: false,
      message: warnings[0] ?? "Nenhuma linha válida encontrada na planilha.",
    };
  }

  return { ok: true, rows, warnings };
}
