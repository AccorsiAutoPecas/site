/** Retorna null se vazio; número se válido e >= 0; undefined se inválido (erro de validação). */
export function parseOptionalDimension(raw: string): number | null | undefined {
  const t = raw.trim();
  if (!t) return null;
  const n = Number.parseFloat(t.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}
