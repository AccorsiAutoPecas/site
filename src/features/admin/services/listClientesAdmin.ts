import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/services/supabase/admin";
import type { AdminClienteRow } from "@/types/clienteAdmin";
import type { PedidoStatus } from "@/types/pedido";

type PedidoAgg = {
  pedidos_count: number;
  ultimo_pedido_em: string | null;
};

function isCheckoutPedido(status: PedidoStatus): boolean {
  return status !== "rascunho";
}

async function fetchUserEmailsById(
  supabase: ReturnType<typeof createAdminClient>
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  let page = 1;
  const perPage = 1000;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error("listUsers:", error.message);
      throw new Error(error.message);
    }
    for (const u of data.users) {
      if (u.email) map.set(u.id, u.email);
    }
    if (data.users.length < perPage) break;
    page += 1;
  }
  return map;
}

/**
 * Clientes com conta na loja (perfil não admin), com totais de pedidos.
 * Exige `SUPABASE_SERVICE_ROLE_KEY` e permissões de Auth Admin.
 */
export async function listClientesAdmin(): Promise<AdminClienteRow[]> {
  await requireAdmin();
  const supabase = createAdminClient();

  const [profilesRes, pedidosRes, emails] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, nome_completo, telefone, created_at, role")
      .neq("role", "admin")
      .order("created_at", { ascending: false }),
    supabase.from("pedidos").select("user_id, created_at, status"),
    fetchUserEmailsById(supabase),
  ]);

  if (profilesRes.error) {
    console.error("listClientesAdmin profiles:", profilesRes.error.message);
    throw new Error(profilesRes.error.message);
  }
  if (pedidosRes.error) {
    console.error("listClientesAdmin pedidos:", pedidosRes.error.message);
    throw new Error(pedidosRes.error.message);
  }

  const agg = new Map<string, PedidoAgg>();
  for (const row of pedidosRes.data ?? []) {
    const uid = row.user_id as string;
    const status = row.status as PedidoStatus;
    const created = row.created_at as string;
    if (!isCheckoutPedido(status)) continue;

    const cur = agg.get(uid) ?? { pedidos_count: 0, ultimo_pedido_em: null };
    cur.pedidos_count += 1;
    if (!cur.ultimo_pedido_em || created > cur.ultimo_pedido_em) {
      cur.ultimo_pedido_em = created;
    }
    agg.set(uid, cur);
  }

  const rows: AdminClienteRow[] = (profilesRes.data ?? []).map((p) => {
    const id = p.id as string;
    const a = agg.get(id);
    return {
      user_id: id,
      nome_completo: (p.nome_completo as string) || "—",
      email: emails.get(id) ?? null,
      telefone: (p.telefone as string | null) ?? null,
      cadastro_em: p.created_at as string,
      pedidos_count: a?.pedidos_count ?? 0,
      ultimo_pedido_em: a?.ultimo_pedido_em ?? null,
    };
  });

  rows.sort((a, b) => {
    const ta = a.ultimo_pedido_em ? new Date(a.ultimo_pedido_em).getTime() : 0;
    const tb = b.ultimo_pedido_em ? new Date(b.ultimo_pedido_em).getTime() : 0;
    if (ta !== tb) return tb - ta;
    return new Date(b.cadastro_em).getTime() - new Date(a.cadastro_em).getTime();
  });

  return rows;
}
