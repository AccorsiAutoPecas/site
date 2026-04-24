"use server";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/services/supabase/server";
import { revalidatePath } from "next/cache";
import { parseOptionalDimension } from "@/features/produtos/utils/parseOptionalDimension";

export type EmbalagemActionState = { ok: true; message: string } | { ok: false; message: string };

export async function createEmbalagem(
  _prev: EmbalagemActionState | null,
  formData: FormData
): Promise<EmbalagemActionState> {
  await requireAdmin();
  const nome = String(formData.get("nome") ?? "").trim();
  const c = parseOptionalDimension(String(formData.get("comprimento_cm") ?? ""));
  const l = parseOptionalDimension(String(formData.get("largura_cm") ?? ""));
  const a = parseOptionalDimension(String(formData.get("altura_cm") ?? ""));
  const p = parseOptionalDimension(String(formData.get("peso_embalagem_kg") ?? ""));

  if (!nome) return { ok: false, message: "Informe o nome da embalagem." };
  if (c === undefined || l === undefined || a === undefined || p === undefined) {
    return { ok: false, message: "Dimensões e peso da embalagem devem ser números válidos (≥ 0)." };
  }
  if (c === null || l === null || a === null || p === null) {
    return { ok: false, message: "Preencha comprimento, largura, altura e peso da embalagem." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("embalagens").insert({
    nome,
    comprimento_cm: c,
    largura_cm: l,
    altura_cm: a,
    peso_embalagem_kg: p,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/produtos/novo");
  return { ok: true, message: "Embalagem cadastrada." };
}

export async function deleteEmbalagem(formData: FormData): Promise<EmbalagemActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, message: "Embalagem não identificada." };

  const supabase = await createClient();
  const { error } = await supabase.from("embalagens").delete().eq("id", id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/produtos/novo");
  return { ok: true, message: "Embalagem removida." };
}
