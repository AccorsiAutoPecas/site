"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { executarFluxoEtiquetaMelhorEnvioAutomatico } from "@/features/pedidos-admin/services/fluxoEtiquetaMelhorEnvioAutomatico";

export type FluxoEtiquetaMelhorEnvioActionState = {
  ok?: boolean;
  error?: string;
  info?: string;
  etiquetaUrl?: string;
};

function getPedidoId(formData: FormData): string {
  return String(formData.get("pedido_id") ?? "").trim();
}

export async function fluxoEtiquetaMelhorEnvioAutomaticoAction(
  _prev: FluxoEtiquetaMelhorEnvioActionState | null,
  formData: FormData,
): Promise<FluxoEtiquetaMelhorEnvioActionState> {
  await requireAdmin();
  const pedidoId = getPedidoId(formData);
  if (!pedidoId) {
    return { error: "Pedido inválido." };
  }

  const result = await executarFluxoEtiquetaMelhorEnvioAutomatico(pedidoId);
  if (!result.ok) {
    return { error: result.message };
  }

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${pedidoId}`);
  return {
    ok: true,
    info: result.message,
    etiquetaUrl: result.etiquetaUrl,
  };
}
