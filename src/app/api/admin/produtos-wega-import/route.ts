import { NextResponse } from "next/server";

import { importWegaKitsProducts } from "@/features/produtos/services/importWegaKitsProducts";
import { requireAdminApi } from "@/lib/auth/requireAdminApi";

export const dynamic = "force-dynamic";

const MAX_BYTES = 15 * 1024 * 1024;

/**
 * Admin: import WEGA kits Excel (1 row = 1 draft product + compat matches).
 * multipart: file (.xlsx), dryRun ("1" | "0", default "1")
 */
export async function POST(request: Request) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ message: "Formulário inválido." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Envie o arquivo Excel no campo file." }, { status: 400 });
  }

  if (file.size <= 0) {
    return NextResponse.json({ message: "Arquivo vazio." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ message: "Arquivo maior que 15 MB." }, { status: 400 });
  }

  const name = (file.name || "").toLowerCase();
  if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
    return NextResponse.json(
      { message: "Envie um arquivo .xlsx (planilha Kits WEGA)." },
      { status: 400 },
    );
  }

  const dryRaw = String(form.get("dryRun") ?? "1").trim();
  const dryRun = dryRaw !== "0" && dryRaw.toLowerCase() !== "false";

  const buffer = new Uint8Array(await file.arrayBuffer());
  const result = await importWegaKitsProducts(gate.ctx.supabase, buffer, { dryRun });

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 400 });
  }

  return NextResponse.json(result);
}
