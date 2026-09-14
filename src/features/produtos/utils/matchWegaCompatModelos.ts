import {
  canonicalizeBrandKey,
  normalizeWegaText,
  parseCarroModelo,
} from "@/features/produtos/utils/wegaText";

export type WegaModeloCandidate = {
  id: string;
  nome: string;
  marca_id: string;
};

export type WegaMarcaCandidate = {
  id: string;
  nome: string;
};

function tokens(raw: string): string[] {
  return normalizeWegaText(raw).split(/\s+/).filter(Boolean);
}

/**
 * Version token match: short codes (GL) require exact token; longer names allow prefix (Excl/Exclusive).
 */
function versionMatchesModelo(version: string, modeloTokens: string[]): boolean {
  const v = normalizeWegaText(version);
  if (!v) return false;
  const vCompact = v.replace(/\s+/g, "");
  for (const token of modeloTokens) {
    if (token === vCompact) return true;
    if (vCompact.length >= 4 && (token.startsWith(vCompact) || vCompact.startsWith(token))) {
      return true;
    }
  }
  // Multi-word version: check contiguous token sequence
  const vTokens = v.split(/\s+/).filter(Boolean);
  if (vTokens.length > 1) {
    const joined = modeloTokens.join(" ");
    if (joined.includes(vTokens.join(" "))) return true;
  }
  return false;
}

/**
 * True when modelo name starts with the Excel base model (avoids C4 Picasso for C3 Picasso).
 */
function modeloStartsWithBase(modeloNome: string, base: string): boolean {
  const modeloNorm = normalizeWegaText(modeloNome);
  const baseNorm = normalizeWegaText(base);
  if (!modeloNorm || !baseNorm) return false;
  if (modeloNorm === baseNorm || modeloNorm.startsWith(`${baseNorm} `)) return true;

  // Strip leading brand words already in modelo FIPE names if base doesn't include them
  const baseTokens = baseNorm.split(/\s+/);
  const modeloToks = modeloNorm.split(/\s+/);
  if (baseTokens.length === 0 || modeloToks.length < baseTokens.length) return false;

  for (let offset = 0; offset <= Math.min(2, modeloToks.length - baseTokens.length); offset++) {
    let ok = true;
    for (let i = 0; i < baseTokens.length; i++) {
      if (modeloToks[offset + i] !== baseTokens[i]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

export function findMarcaId(
  montadora: string,
  marcas: WegaMarcaCandidate[],
): string | null {
  const key = canonicalizeBrandKey(montadora);
  if (!key) return null;

  for (const marca of marcas) {
    if (canonicalizeBrandKey(marca.nome) === key) return marca.id;
  }

  // Fallback: includes either way
  const montNorm = normalizeWegaText(montadora);
  for (const marca of marcas) {
    const nomeNorm = normalizeWegaText(marca.nome);
    if (nomeNorm === montNorm) return marca.id;
    if (nomeNorm.includes(montNorm) || montNorm.includes(nomeNorm)) return marca.id;
  }
  return null;
}

/**
 * Match Excel `CARRO / MODELO` against catalog modelos of one marca.
 * With parentheses versions → all modelos whose name matches base + at least one version.
 * Without versions → all modelos whose name starts with / contains the base tokens.
 */
export function matchWegaCompatModelos(input: {
  carroModelo: string;
  modelosDaMarca: WegaModeloCandidate[];
}): WegaModeloCandidate[] {
  const parsed = parseCarroModelo(input.carroModelo);
  if (!parsed.base) return [];

  const withBase = input.modelosDaMarca.filter((m) =>
    modeloStartsWithBase(m.nome, parsed.base),
  );

  if (parsed.versions.length === 0) return withBase;

  return withBase.filter((m) => {
    const modeloTokens = tokens(m.nome);
    return parsed.versions.some((version) => versionMatchesModelo(version, modeloTokens));
  });
}
