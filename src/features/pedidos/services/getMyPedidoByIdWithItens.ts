import { cache } from "react";

import { createClient } from "@/services/supabase/server";
import type { PedidoDetailWithItens } from "@/types/pedido";

/**
 * Detalhe de um pedido + itens, apenas se pertencer ao usuário (RLS).
 * Retorna `null` quando não existe ou não é visível.
 * Memoizado por requisição (ex.: `generateMetadata` + página no mesmo request).
 */
export const getMyPedidoByIdWithItens = cache(async function getMyPedidoByIdWithItens(
  pedidoId: string
): Promise<PedidoDetailWithItens | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pedidos")
    .select(
      `
      id,
      status,
      subtotal,
      frete,
      retirada_loja,
      total,
      created_at,
      destinatario_nome,
      telefone,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      uf,
      mercadopago_status,
      mercadopago_payment_id,
      rastreio_codigo,
      rastreio_url,
      pedido_itens (
        id,
        produto_id,
        quantidade,
        preco_unitario,
        titulo_snapshot,
        cod_produto_snapshot
      )
    `
    )
    .eq("id", pedidoId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as PedidoDetailWithItens;
  const itens = Array.isArray(row.pedido_itens) ? row.pedido_itens : [];
  const sorted = [...itens].sort((a, b) =>
    a.titulo_snapshot.localeCompare(b.titulo_snapshot, "pt-BR", { sensitivity: "base" })
  );
  return { ...row, pedido_itens: sorted };
});
