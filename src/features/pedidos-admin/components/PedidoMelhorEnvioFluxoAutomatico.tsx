"use client";

import { useActionState } from "react";

import {
  fluxoEtiquetaMelhorEnvioAutomaticoAction,
  type FluxoEtiquetaMelhorEnvioActionState,
} from "@/features/pedidos-admin/services/fluxoEtiquetaMelhorEnvioAction";

const btnPrimary =
  "rounded-lg bg-admin-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#1857d1] disabled:opacity-60";

export function PedidoMelhorEnvioFluxoAutomatico({
  pedidoId,
  retiradaLoja,
}: {
  pedidoId: string;
  retiradaLoja: boolean;
}) {
  const [state, formAction, pending] = useActionState<
    FluxoEtiquetaMelhorEnvioActionState | null,
    FormData
  >(fluxoEtiquetaMelhorEnvioAutomaticoAction, null);

  if (retiradaLoja) {
    return null;
  }

  return (
    <div className="mb-6 rounded-lg border border-emerald-100 bg-emerald-50/50 px-4 py-4">
      <h3 className="text-sm font-semibold text-gray-900">Etiqueta Melhor Envio (automático)</h3>
      <p className="mt-1 text-xs text-gray-600">
        Cota de novo com os dados do pedido, cria o envio no carrinho da API, compra com seu saldo Melhor
        Carteira e gera a etiqueta — sem abrir o site do Melhor Envio. Exige{" "}
        <strong className="font-medium">CPF ou CNPJ do destinatário</strong> salvo no checkout, variáveis{" "}
        <code className="rounded bg-white/80 px-0.5">MELHOR_ENVIO_FROM_*</code> no servidor e OAuth com
        permissões de carrinho e checkout (reautorize o app após atualizar escopos).
      </p>
      <form action={formAction} className="mt-3">
        <input type="hidden" name="pedido_id" value={pedidoId} />
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? "Processando…" : "Cotar, comprar e gerar etiqueta"}
        </button>
      </form>
      {state?.error ? (
        <p className="mt-2 text-xs text-red-800" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.info ? <p className="mt-2 text-xs text-emerald-900">{state.info}</p> : null}
      {state?.etiquetaUrl ? (
        <p className="mt-2 text-xs">
          <a
            href={state.etiquetaUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-admin-accent hover:underline"
          >
            Abrir etiqueta
          </a>
        </p>
      ) : null}
    </div>
  );
}
