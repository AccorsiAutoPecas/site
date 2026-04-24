/** Linha para listagem em /admin/clientes (service role + auth admin). */
export type AdminClienteRow = {
  user_id: string;
  nome_completo: string;
  email: string | null;
  telefone: string | null;
  cadastro_em: string;
  /** Pedidos com checkout (exclui apenas rascunho). */
  pedidos_count: number;
  /** Data do pedido mais recente (qualquer status exceto rascunho), ou null. */
  ultimo_pedido_em: string | null;
};
