import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/auth/requireAdminApi";

/**
 * Exemplo de rota só para administradores (middleware + verificação no handler).
 */
export async function GET() {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;
  return NextResponse.json({ ok: true, userId: gate.ctx.user.id });
}
