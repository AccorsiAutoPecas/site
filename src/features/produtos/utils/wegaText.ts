/** Shared text helpers for WEGA kit Excel import. */

export function normalizeWegaText(raw: string | null | undefined): string {
  return (raw ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function titleCaseWords(raw: string): string {
  return raw
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (/^[A-Z0-9]+$/.test(word) && word.length <= 4) return word;
      const lower = word.toLocaleLowerCase("pt-BR");
      return lower.charAt(0).toLocaleUpperCase("pt-BR") + lower.slice(1);
    })
    .join(" ");
}

const BRAND_SYNONYMS: Record<string, string[]> = {
  volkswagen: ["vw", "volks", "volks wagen"],
  chevrolet: ["gm", "chevy"],
  mercedes: ["mercedes benz", "mercedes-benz", "mb"],
  mitsubishi: ["mit"],
  landrover: ["land rover"],
  citroen: ["citroën"],
  peugeot: ["peugeot-citroen", "psa"],
  bmw: ["b.m.w"],
};

export function canonicalizeBrandKey(raw: string | null | undefined): string {
  const base = normalizeWegaText(raw).replace(/\s+/g, "");
  if (!base) return "";
  for (const [canonical, aliases] of Object.entries(BRAND_SYNONYMS)) {
    if (base === canonical) return canonical;
    if (aliases.some((alias) => normalizeWegaText(alias).replace(/\s+/g, "") === base)) {
      return canonical;
    }
  }
  return base;
}

export type ParsedCarroModelo = {
  base: string;
  versions: string[];
  /** Display fragment for title: base + versions without outer parentheses. */
  displayModel: string;
};

/**
 * `C3 PICASSO (EXCLUSIVE / GL / GLX)` → base + versions.
 */
export function parseCarroModelo(raw: string): ParsedCarroModelo {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (!trimmed) return { base: "", versions: [], displayModel: "" };

  const paren = trimmed.match(/^(.+?)\s*\((.+)\)\s*$/);
  if (!paren) {
    return { base: trimmed, versions: [], displayModel: titleCaseWords(trimmed) };
  }

  const base = paren[1].trim();
  const versions = paren[2]
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
  const versionsDisplay = versions.join(" / ");
  return {
    base,
    versions,
    displayModel: `${titleCaseWords(base)} ${versionsDisplay}`.trim(),
  };
}

export type ParsedAnoRange = {
  anoInicio: number;
  anoFim: number;
  /** Human fragment for product title. */
  titleSuffix: string;
  openEnded: boolean;
};

/** Sentinel stored when the spreadsheet year range is open-ended. Not a real model year. */
export const OPEN_END_YEAR = 2099;

/** Display label for a stored year range. `2099` stays in the database and reads as "em diante". */
export function formatAnoRangeLabel(anoInicio: number, anoFim: number): string {
  if (!Number.isFinite(anoInicio) || !Number.isFinite(anoFim)) return "";
  if (anoFim === OPEN_END_YEAR) return `${anoInicio} em diante`;
  if (anoInicio === anoFim) return String(anoInicio);
  return `${anoInicio}-${anoFim}`;
}

/**
 * Accepts `2010 -- 2012`, `2010 - 2012`, `2023 -->`, `2023→`.
 */
export function parseAnoRange(raw: string): ParsedAnoRange | null {
  const text = (raw ?? "").trim();
  if (!text) return null;

  const open = text.match(/^(\d{4})\s*(?:-->|→|->|\+)\s*$/);
  if (open) {
    const anoInicio = Number(open[1]);
    if (!Number.isFinite(anoInicio)) return null;
    return {
      anoInicio,
      anoFim: OPEN_END_YEAR,
      titleSuffix: `${anoInicio} em diante`,
      openEnded: true,
    };
  }

  const range = text.match(/^(\d{4})\s*(?:--|—|–|-)\s*(\d{4})\s*$/);
  if (range) {
    const anoInicio = Number(range[1]);
    const anoFim = Number(range[2]);
    if (!Number.isFinite(anoInicio) || !Number.isFinite(anoFim) || anoInicio > anoFim) {
      return null;
    }
    return {
      anoInicio,
      anoFim,
      titleSuffix: `${anoInicio} até ${anoFim}`,
      openEnded: false,
    };
  }

  const single = text.match(/^(\d{4})$/);
  if (single) {
    const year = Number(single[1]);
    return {
      anoInicio: year,
      anoFim: year,
      titleSuffix: `${year} até ${year}`,
      openEnded: false,
    };
  }

  return null;
}

export function buildWegaProductTitle(input: {
  montadora: string;
  carroModelo: string;
  anoRaw: string;
}): string | null {
  const montadora = titleCaseWords(input.montadora);
  const parsedCarro = parseCarroModelo(input.carroModelo);
  const anos = parseAnoRange(input.anoRaw);
  if (!montadora || !parsedCarro.displayModel || !anos) return null;
  return `Kit filtros WEGA ${montadora} ${parsedCarro.displayModel} ${anos.titleSuffix}`.replace(
    /\s+/g,
    " ",
  );
}

export function buildWegaProductDescription(input: {
  codigo: string;
  filtroAr: string;
  filtroOleo: string;
  filtroCombustivel: string;
  filtroCabine: string;
  motor: string;
  cambio: string;
  combustivelVeiculo: string;
}): string {
  const lines = [
    input.codigo ? `Kit WEGA ${input.codigo}` : "Kit WEGA",
    `Filtros: Ar ${input.filtroAr || "—"} · Óleo ${input.filtroOleo || "—"} · Combustível ${input.filtroCombustivel || "—"} · Cabine ${input.filtroCabine || "—"}`,
    `Motor: ${input.motor || "—"} | Câmbio: ${input.cambio || "—"} | Combustível: ${input.combustivelVeiculo || "—"}`,
  ];
  return lines.join("\n");
}
