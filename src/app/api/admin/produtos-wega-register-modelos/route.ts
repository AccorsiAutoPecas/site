import { NextResponse } from "next/server";

import { registerWegaSuggestedModelos } from "@/features/produtos/services/registerWegaSuggestedModelos";
import type { WegaModeloSuggestion } from "@/features/produtos/utils/buildWegaModeloSuggestions";
import { requireAdminApi } from "@/lib/auth/requireAdminApi";

export const dynamic = "force-dynamic";

/**
 * Admin: cadastra marcas/modelos/anos sugeridos a partir da prévia WEGA.
 * Body JSON: { suggestions: WegaModeloSuggestion[] }
 */
export async function POST(request: Request) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "JSON inválido." }, { status: 400 });
  }

  const suggestions = (body as { suggestions?: unknown })?.suggestions;
  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    return NextResponse.json(
      { message: "Envie a lista suggestions com ao menos um modelo." },
      { status: 400 },
    );
  }

  const normalized: WegaModeloSuggestion[] = [];
  for (const raw of suggestions) {
    if (!raw || typeof raw !== "object") continue;
    const s = raw as Record<string, unknown>;
    const montadora = String(s.montadora ?? "").trim();
    const nomeModelo = String(s.nomeModelo ?? "").trim();
    const key = String(s.key ?? `${montadora}::${nomeModelo}`).trim();
    const anoInicio = Number(s.anoInicio);
    const anoFim = Number(s.anoFim);
    if (!montadora || !nomeModelo || !Number.isFinite(anoInicio) || !Number.isFinite(anoFim)) {
      continue;
    }
    normalized.push({
      key,
      montadora,
      nomeModelo,
      anoInicio,
      anoFim,
      marcaId: typeof s.marcaId === "string" && s.marcaId ? s.marcaId : null,
      needsMarca: Boolean(s.needsMarca),
      sheetRows: Array.isArray(s.sheetRows)
        ? s.sheetRows.map((n) => Number(n)).filter((n) => Number.isFinite(n))
        : [],
    });
  }

  if (normalized.length === 0) {
    return NextResponse.json({ message: "Nenhuma sugestão válida." }, { status: 400 });
  }

  const result = await registerWegaSuggestedModelos(gate.ctx.supabase, normalized);
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 400 });
  }

  return NextResponse.json(result);
}
