const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseProductFormPercent(raw: unknown): number {
  const n = Number.parseFloat(String(raw ?? "").replace(",", "."));
  if (Number.isNaN(n) || n < 0) return 0;
  return Math.min(100, Math.round(n * 100) / 100);
}

/** IDs de produtos marcados como relacionados (checkboxes `relacionado_id`). */
export function parseRelacionadoIdsFromForm(formData: FormData, selfId?: string): string[] {
  const raw = formData.getAll("relacionado_id").map((v) => String(v).trim());
  const set = new Set<string>();
  for (const id of raw) {
    if (!UUID_RE.test(id)) continue;
    if (selfId && id === selfId) continue;
    set.add(id);
  }
  return [...set];
}
