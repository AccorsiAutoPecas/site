import { createClient } from "@/services/supabase/server";
import type { PedidoListRow } from "@/types/pedido";

/**
 * Lista pedidos do usuário autenticado. RLS restringe às linhas com `user_id = auth.uid()`.
 */
export async function listMyPedidos(): Promise<PedidoListRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pedidos")
    .select("id, status, total, created_at, rastreio_codigo, rastreio_url")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as PedidoListRow[];
}
