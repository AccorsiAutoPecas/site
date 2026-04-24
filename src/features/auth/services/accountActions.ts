"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  parseCepDigits,
  validateNomeCompleto,
  validateProfileEndereco,
  wantsClearProfileEndereco,
} from "@/features/auth/utils/authValidation";
import { createClient } from "@/services/supabase/server";
import type { ProfileEndereco } from "@/types/profileDelivery";

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export type UpdateProfileNomeState =
  | null
  | { ok: true }
  | { ok: false; message: string; fieldError?: string };

export async function updateProfileNome(
  _prev: UpdateProfileNomeState,
  formData: FormData
): Promise<UpdateProfileNomeState> {
  const nomeCompletoRaw = String(formData.get("nome_completo") ?? "");
  const fieldError = validateNomeCompleto(nomeCompletoRaw);
  if (fieldError) {
    return { ok: false, message: fieldError, fieldError };
  }

  const nomeCompleto = nomeCompletoRaw.trim();
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "Sessão expirada ou inválida. Faça login novamente." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ nome_completo: nomeCompleto })
    .eq("id", user.id);

  if (error) {
    return {
      ok: false,
      message: `Não foi possível salvar: ${error.message}. Tente de novo.`,
    };
  }

  revalidatePath("/conta");
  return { ok: true };
}

export type UpdateProfileEnderecoState =
  | null
  | { ok: true; cleared?: boolean }
  | {
      ok: false;
      message: string;
      fieldErrors?: Partial<Record<keyof ProfileEndereco, string>>;
    };

function readEnderecoFromForm(formData: FormData): ProfileEndereco {
  return {
    telefone: String(formData.get("telefone") ?? ""),
    cep: String(formData.get("cep") ?? ""),
    logradouro: String(formData.get("logradouro") ?? ""),
    numero: String(formData.get("numero") ?? ""),
    complemento: String(formData.get("complemento") ?? ""),
    bairro: String(formData.get("bairro") ?? ""),
    cidade: String(formData.get("cidade") ?? ""),
    uf: String(formData.get("uf") ?? ""),
  };
}

export async function updateProfileEndereco(
  _prev: UpdateProfileEnderecoState,
  formData: FormData,
): Promise<UpdateProfileEnderecoState> {
  const input = readEnderecoFromForm(formData);
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "Sessão expirada ou inválida. Faça login novamente." };
  }

  if (wantsClearProfileEndereco(input)) {
    const { error } = await supabase
      .from("profiles")
      .update({
        telefone: null,
        cep: null,
        logradouro: null,
        numero: null,
        complemento: null,
        bairro: null,
        cidade: null,
        uf: null,
      })
      .eq("id", user.id);

    if (error) {
      return {
        ok: false,
        message: `Não foi possível atualizar: ${error.message}. Tente de novo.`,
      };
    }

    revalidatePath("/conta");
    revalidatePath("/checkout");
    return { ok: true, cleared: true };
  }

  const fieldErrors = validateProfileEndereco(input);
  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      message: "Corrija os campos destacados.",
      fieldErrors,
    };
  }

  const cepDigits = parseCepDigits(input.cep);
  const uf = input.uf.trim().toUpperCase().slice(0, 2);

  const { error } = await supabase
    .from("profiles")
    .update({
      telefone: input.telefone.trim(),
      cep: cepDigits,
      logradouro: input.logradouro.trim(),
      numero: input.numero.trim(),
      complemento: input.complemento.trim() || null,
      bairro: input.bairro.trim(),
      cidade: input.cidade.trim(),
      uf: uf,
    })
    .eq("id", user.id);

  if (error) {
    return {
      ok: false,
      message: `Não foi possível salvar: ${error.message}. Tente de novo.`,
    };
  }

  revalidatePath("/conta");
  revalidatePath("/checkout");
  return { ok: true };
}
