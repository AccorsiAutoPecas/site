import type { PedidoStatus } from "@/types/pedido";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const statusLabels: Record<PedidoStatus, string> = {
  rascunho: "Rascunho",
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
  falha_pagamento: "Falha no pagamento",
};

export function formatPedidoMoney(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return brl.format(0);
  return brl.format(n);
}

export function formatPedidoStatus(status: string): string {
  if (status in statusLabels) return statusLabels[status as PedidoStatus];
  return status;
}

export function formatPedidoDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

/** Exibe CEP brasileiro quando possível (8 dígitos). */
export function formatCep(cep: string): string {
  const digits = cep.replace(/\D/g, "");
  if (digits.length === 8) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return cep.trim() || "—";
}

/** Formata código curto de pedido para UI admin (001, 002, ...). */
export function formatPedidoUiCode(seq: number | null | undefined): string {
  const n = Number(seq);
  if (!Number.isInteger(n) || n <= 0) return "—";
  return String(n).padStart(3, "0");
}
