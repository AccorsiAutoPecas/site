import { NextResponse } from "next/server";

import { createAdminClient } from "@/services/supabase/admin";
import { createClient } from "@/services/supabase/server";

const CONFIRMATION_PHRASE = "EXCLUIR";

type DeleteBody = {
  confirmation?: string;
};

export async function POST(request: Request) {
  let body: DeleteBody;
  try {
    body = (await request.json()) as DeleteBody;
  } catch {
    return NextResponse.json({ message: "Corpo da requisição inválido." }, { status: 400 });
  }

  const confirmation = String(body.confirmation ?? "").trim();
  if (confirmation !== CONFIRMATION_PHRASE) {
    return NextResponse.json(
      {
        message: `Para confirmar, digite exatamente ${CONFIRMATION_PHRASE}.`,
      },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ message: "Sessão necessária para excluir a conta." }, { status: 401 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Configuração do servidor incompleta.";
    return NextResponse.json({ message: msg }, { status: 503 });
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return NextResponse.json(
      { message: `Não foi possível excluir a conta: ${deleteError.message}` },
      { status: 500 }
    );
  }

  await supabase.auth.signOut().catch(() => undefined);

  return NextResponse.json({ ok: true as const }, { status: 200 });
}
