"use server";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { slugify } from "@/utils/slugify";
import { createClient } from "@/services/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseTipoVeiculoModelo } from "@/features/compatibilidade/constants/tipoVeiculoModelo";

export type CreateModeloState = { ok: false; message: string } | null;

/** Slug único entre os modelos da mesma marca. */
async function allocateModeloSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  marcaId: string,
  baseRaw: string
): Promise<string> {
  const base = slugify(baseRaw);
  let candidate = base;
  let n = 2;
  for (;;) {
    const { data: rows } = await supabase
      .from("modelos")
      .select("id")
      .eq("marca_id", marcaId)
      .eq("slug", candidate);
    const list = rows ?? [];
    if (list.length === 0) return candidate;
    candidate = `${base}-${n}`;
    n += 1;
    if (n > 200) return `${base}-${Date.now()}`;
  }
}

export async function createModelo(
  _prev: CreateModeloState,
  formData: FormData
): Promise<CreateModeloState> {
  await requireAdmin();
  const marcaId = String(formData.get("marca_id") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();
  const tipoVeiculo = parseTipoVeiculoModelo(String(formData.get("tipo_veiculo") ?? ""));

  if (!marcaId) {
    return { ok: false, message: "Escolha a marca do veículo." };
  }
  if (!nome) {
    return { ok: false, message: "Informe o nome do modelo (ex.: Civic, Gol)." };
  }
  if (!tipoVeiculo) {
    return { ok: false, message: "Escolha se o modelo é de carro ou caminhão." };
  }

  const supabase = await createClient();
  const slug = await allocateModeloSlug(supabase, marcaId, nome);

  const { error } = await supabase.from("modelos").insert({
    marca_id: marcaId,
    nome,
    slug,
    tipo_veiculo: tipoVeiculo,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        message: "Já existe um modelo com esse nome para esta marca. Ajuste o nome ou escolha outra marca.",
      };
    }
    if (error.message.includes("tipo_veiculo") || error.message.includes("modelos_tipo_veiculo")) {
      return {
        ok: false,
        message:
          "Coluna tipo_veiculo ausente ou inválida no banco. Execute a migration supabase/migrations/20260413210000_modelos_tipo_veiculo.sql no Supabase e tente de novo.",
      };
    }
    return {
      ok: false,
      message: `Não foi possível salvar: ${error.message}. Tente de novo.`,
    };
  }

  revalidatePath("/admin/marcas-e-modelos");
  revalidatePath("/admin/marcas");
  revalidatePath("/admin/modelos");
  revalidatePath("/admin/produtos/novo");
  revalidatePath("/admin");
  redirect("/admin/marcas-e-modelos?cadastrado=modelo");
}

export type ModeloAnoState = { ok: false; message: string } | null;

export async function addModeloAno(
  _prev: ModeloAnoState,
  formData: FormData
): Promise<ModeloAnoState> {
  await requireAdmin();
  const modeloId = String(formData.get("modelo_id") ?? "").trim();
  const anoRaw = String(formData.get("ano") ?? "").trim();

  if (!modeloId) {
    return { ok: false, message: "Modelo inválido." };
  }

  const ano = Number.parseInt(anoRaw, 10);
  if (Number.isNaN(ano) || ano < 1900 || ano > 2100) {
    return { ok: false, message: "Informe um ano entre 1900 e 2100." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("modelo_anos").insert({
    modelo_id: modeloId,
    ano,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "Este ano já está cadastrado para este modelo." };
    }
    if (error.code === "42P01" || error.message.includes("modelo_anos")) {
      return {
        ok: false,
        message:
          "Tabela modelo_anos não encontrada. Execute a migration em supabase/migrations no painel SQL do Supabase.",
      };
    }
    return { ok: false, message: `Não foi possível salvar: ${error.message}` };
  }

  revalidatePath("/admin/marcas-e-modelos");
  revalidatePath("/admin/modelos");
  return null;
}

export async function removeModeloAno(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("modelo_anos").delete().eq("id", id);
  revalidatePath("/admin/marcas-e-modelos");
  revalidatePath("/admin/modelos");
}

export type DeleteModeloResult = { ok: true } | { ok: false; message: string };

export async function deleteModelo(modeloId: string): Promise<DeleteModeloResult> {
  await requireAdmin();
  const id = modeloId.trim();
  if (!id) {
    return { ok: false, message: "Modelo inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("modelos").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return {
        ok: false,
        message:
          "Não é possível excluir: ainda há dados vinculados a este modelo que impedem a remoção. Verifique o banco ou entre em contato com o suporte.",
      };
    }
    return { ok: false, message: `Não foi possível excluir: ${error.message}.` };
  }

  revalidatePath("/admin/marcas-e-modelos");
  revalidatePath("/admin/marcas");
  revalidatePath("/admin/modelos");
  revalidatePath("/admin/produtos");
  revalidatePath("/admin/produtos/novo");
  revalidatePath("/produtos");
  revalidatePath("/admin");
  return { ok: true };
}
