import Link from "next/link";

import {
  formatCep,
  formatPedidoDate,
  formatPedidoMoney,
  formatPedidoStatus,
} from "@/features/pedidos/utils/pedidoDisplay";
import type { PedidoDetailWithItens } from "@/types/pedido";

function statusPillClass(status: string): string {
  switch (status) {
    case "pago":
      return "bg-emerald-50 text-emerald-900 ring-emerald-200";
    case "aguardando_pagamento":
      return "bg-amber-50 text-amber-950 ring-amber-200";
    case "cancelado":
    case "reembolsado":
    case "falha_pagamento":
      return "bg-red-50 text-red-900 ring-red-200";
    default:
      return "bg-store-subtle text-store-navy ring-store-line/80";
  }
}

export function PedidoDetailSection({ pedido }: { pedido: PedidoDetailWithItens }) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 border-b border-store-line/70 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-store-navy-muted">Pedido</p>
          <p className="mt-1 break-all font-mono text-sm text-store-navy">{pedido.id}</p>
          <p className="mt-2 text-sm text-store-navy-muted">{formatPedidoDate(pedido.created_at)}</p>
        </div>
        <span
          className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusPillClass(pedido.status)}`}
        >
          {formatPedidoStatus(pedido.status)}
        </span>
      </div>

      <section aria-labelledby="pedido-itens-heading">
        <h2 id="pedido-itens-heading" className="text-base font-semibold text-store-navy">
          Itens
        </h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-store-line/80">
          <table className="min-w-full divide-y divide-store-line/70 text-sm">
            <caption className="sr-only">Produtos neste pedido</caption>
            <thead className="bg-store-subtle/50 text-left text-xs font-semibold uppercase tracking-wide text-store-navy-muted">
              <tr>
                <th scope="col" className="px-3 py-2.5">
                  Produto
                </th>
                <th scope="col" className="px-3 py-2.5">
                  Código
                </th>
                <th scope="col" className="px-3 py-2.5 text-right">
                  Qtd.
                </th>
                <th scope="col" className="px-3 py-2.5 text-right">
                  Preço unit.
                </th>
                <th scope="col" className="px-3 py-2.5 text-right">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-store-line/60 bg-white">
              {pedido.pedido_itens.map((item) => {
                const unit = Number(item.preco_unitario);
                const sub = Number.isFinite(unit) ? unit * item.quantidade : 0;
                return (
                  <tr key={item.id}>
                    <td className="px-3 py-3 text-store-navy">{item.titulo_snapshot}</td>
                    <td className="px-3 py-3 font-mono text-xs text-store-navy-muted">
                      {item.cod_produto_snapshot}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-store-navy">{item.quantidade}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-store-navy-muted">
                      {formatPedidoMoney(item.preco_unitario)}
                    </td>
                    <td className="px-3 py-3 text-right font-medium tabular-nums text-store-navy">
                      {formatPedidoMoney(sub)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="pedido-totais-heading" className="rounded-lg border border-store-line/80 bg-store-subtle/25 p-4 sm:p-5">
        <h2 id="pedido-totais-heading" className="text-base font-semibold text-store-navy">
          Totais
        </h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-store-navy-muted">Subtotal</dt>
            <dd className="font-medium tabular-nums text-store-navy">{formatPedidoMoney(pedido.subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-store-navy-muted">Frete</dt>
            <dd className="font-medium tabular-nums text-store-navy">
              {pedido.retirada_loja ? "Retirada na loja" : formatPedidoMoney(pedido.frete)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-store-line/60 pt-2 text-base">
            <dt className="font-semibold text-store-navy">Total</dt>
            <dd className="font-bold tabular-nums text-store-navy">{formatPedidoMoney(pedido.total)}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="pedido-entrega-heading">
        <h2 id="pedido-entrega-heading" className="text-base font-semibold text-store-navy">
          {pedido.retirada_loja ? "Retirada na loja" : "Entrega"}
        </h2>
        <div className="mt-3 rounded-lg border border-store-line/80 bg-white p-4 text-sm leading-relaxed text-store-navy">
          <p className="font-medium">{pedido.destinatario_nome}</p>
          <p className="mt-1 text-store-navy-muted">{pedido.telefone}</p>
          {pedido.retirada_loja ? (
            <p className="mt-3 text-store-navy-muted">
              Pedido para retirada no balcão, no endereço abaixo (sem envio pelos Correios).
            </p>
          ) : null}
          <p className="mt-3">
            {pedido.logradouro}, {pedido.numero}
            {pedido.complemento ? ` — ${pedido.complemento}` : ""}
            <br />
            {pedido.bairro} — {pedido.cidade}/{pedido.uf}
            <br />
            CEP {formatCep(pedido.cep)}
          </p>
        </div>
      </section>

      {(pedido.rastreio_codigo || pedido.rastreio_url) && (
        <section
          aria-labelledby="pedido-rastreio-heading"
          className="rounded-lg border border-store-line/70 bg-white p-4 text-sm"
        >
          <h2 id="pedido-rastreio-heading" className="font-semibold text-store-navy">
            Rastreio do envio
          </h2>
          {pedido.rastreio_codigo ? (
            <p className="mt-2 text-store-navy-muted">
              Código: <span className="font-mono text-xs text-store-navy">{pedido.rastreio_codigo}</span>
            </p>
          ) : null}
          {pedido.rastreio_url ? (
            <p className="mt-2">
              <a
                href={pedido.rastreio_url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-store-navy underline underline-offset-2"
              >
                Acompanhar entrega
              </a>
            </p>
          ) : null}
        </section>
      )}

      {(pedido.mercadopago_payment_id || pedido.mercadopago_status) && (
        <section aria-labelledby="pedido-mp-heading" className="rounded-lg border border-store-line/70 bg-white p-4 text-sm">
          <h2 id="pedido-mp-heading" className="font-semibold text-store-navy">
            Pagamento (Mercado Pago)
          </h2>
          {pedido.mercadopago_status ? (
            <p className="mt-2 text-store-navy-muted">
              Status informado: <span className="font-medium text-store-navy">{pedido.mercadopago_status}</span>
            </p>
          ) : null}
          {pedido.mercadopago_payment_id ? (
            <p className="mt-1 font-mono text-xs text-store-navy-muted">
              ID do pagamento: {pedido.mercadopago_payment_id}
            </p>
          ) : null}
        </section>
      )}

      <p className="text-xs text-store-navy-muted">
        O status do pagamento pode ser atualizado automaticamente após a confirmação do Mercado Pago.
      </p>

      <Link
        href="/pedidos"
        className="inline-flex text-sm font-semibold text-store-navy underline underline-offset-2"
      >
        ← Voltar aos pedidos
      </Link>
    </div>
  );
}
