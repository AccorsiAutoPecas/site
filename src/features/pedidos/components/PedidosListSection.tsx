import Link from "next/link";

import { formatPedidoDate, formatPedidoMoney, formatPedidoStatus } from "@/features/pedidos/utils/pedidoDisplay";
import type { PedidoListRow } from "@/types/pedido";

function TrackingIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
      <path
        d="M3 8.5h11v8H3zm11 2h3l3 3v3h-6zm2 6a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm-9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

export function PedidosListSection({ pedidos }: { pedidos: PedidoListRow[] }) {
  if (pedidos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-store-line/90 bg-store-subtle/20 px-4 py-10 text-center">
        <p className="text-sm font-medium text-store-navy">Você ainda não tem pedidos</p>
        <p className="mt-2 text-sm text-store-navy-muted">
          Quando finalizar uma compra, ela aparecerá nesta lista.
        </p>
        <Link
          href="/produtos"
          className="mt-4 inline-flex text-sm font-semibold text-store-navy underline underline-offset-2"
        >
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-store-line/70 rounded-lg border border-store-line/80 bg-white">
      {pedidos.map((p) => (
        <li key={p.id}>
          <Link
            href={`/pedidos/${p.id}`}
            className="flex flex-col gap-3 px-4 py-4 transition hover:bg-store-subtle/40 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-store-navy-muted">
                Pedido
              </p>
              <p className="truncate font-mono text-sm text-store-navy">{p.id}</p>
              <p className="mt-1 text-sm text-store-navy-muted">{formatPedidoDate(p.created_at)}</p>
              {(p.rastreio_codigo || p.rastreio_url) ? (
                <div className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-900">
                  <TrackingIcon />
                  <span className="whitespace-nowrap">Rastreio</span>
                  <span className="truncate font-mono">
                    {p.rastreio_codigo ?? (p.rastreio_url ? "disponível" : "—")}
                  </span>
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusPillClass(p.status)}`}
              >
                {formatPedidoStatus(p.status)}
              </span>
              <span className="text-sm font-semibold tabular-nums text-store-navy">
                {formatPedidoMoney(p.total)}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
