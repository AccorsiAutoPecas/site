/** Alinhado à RPC `criar_pedido_checkout` (pix vs cartão). */
export type FormaPagamentoCheckout = "pix" | "cartao";

export function clampPercent(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

/** Preço unitário após desconto cadastrado no produto. */
export function unitPriceAfterPaymentDiscount(
  baseValor: number,
  forma: FormaPagamentoCheckout,
  descontoPixPercent: number,
  descontoCartaoPercent: number,
): number {
  const base = Number(baseValor);
  if (!Number.isFinite(base) || base < 0) return 0;
  const pct =
    forma === "pix" ? clampPercent(descontoPixPercent) : clampPercent(descontoCartaoPercent);
  return Math.round(base * (1 - pct / 100) * 100) / 100;
}
