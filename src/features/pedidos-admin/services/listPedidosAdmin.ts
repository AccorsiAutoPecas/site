import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/services/supabase/admin";
import type { AdminPedidoListRow } from "@/types/pedido";

/**
 * Lista todos os pedidos (painel admin). Exige `SUPABASE_SERVICE_ROLE_KEY`.
 */
export async function listPedidosAdmin(): Promise<AdminPedidoListRow[]> {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("pedidos")
    .select(
      "id, user_id, status, total, created_at, destinatario_nome, logistica_status, rastreio_codigo"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listPedidosAdmin:", error.message);
    throw new Error(error.message);
  }
  return (data ?? []) as AdminPedidoListRow[];
}
