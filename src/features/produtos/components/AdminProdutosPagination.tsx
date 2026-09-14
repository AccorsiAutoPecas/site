import Link from "next/link";

type AdminProdutosPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  q: string;
  status: string;
};

function hrefForPage(page: number, q: string, status: string): string {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (status && status !== "all") p.set("status", status);
  if (page > 1) p.set("page", String(page));
  const s = p.toString();
  return s ? `/admin/produtos?${s}` : "/admin/produtos";
}

export function AdminProdutosPagination({
  page,
  totalPages,
  total,
  pageSize,
  q,
  status,
}: AdminProdutosPaginationProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-6 py-4 text-sm text-gray-600"
      aria-label="Paginação de produtos"
    >
      <p className="tabular-nums">
        {from}–{to} de {total}
      </p>
      <div className="flex items-center gap-2">
        {prev != null ? (
          <Link
            href={hrefForPage(prev, q, status)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-medium text-gray-800 hover:bg-gray-50"
          >
            Anterior
          </Link>
        ) : (
          <span className="rounded-lg px-3 py-1.5 text-gray-400">Anterior</span>
        )}
        <span className="tabular-nums text-gray-500">
          {page}/{totalPages}
        </span>
        {next != null ? (
          <Link
            href={hrefForPage(next, q, status)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-medium text-gray-800 hover:bg-gray-50"
          >
            Próxima
          </Link>
        ) : (
          <span className="rounded-lg px-3 py-1.5 text-gray-400">Próxima</span>
        )}
      </div>
    </nav>
  );
}
