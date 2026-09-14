import Link from "next/link";

type CatalogPaginationProps = {
  page: number;
  totalPages: number;
  /** Query string já com filtros; sem `?` inicial. `page` será ajustado. */
  baseQuery: string;
};

function hrefForPage(baseQuery: string, page: number): string {
  const p = new URLSearchParams(baseQuery);
  if (page <= 1) p.delete("page");
  else p.set("page", String(page));
  const s = p.toString();
  return s ? `/produtos?${s}` : "/produtos";
}

export function CatalogPagination({ page, totalPages, baseQuery }: CatalogPaginationProps) {
  if (totalPages <= 1) return null;

  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;

  return (
    <nav
      className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-store-navy"
      aria-label="Paginação do catálogo"
    >
      {prev != null ? (
        <Link
          href={hrefForPage(baseQuery, prev)}
          className="rounded-sm border border-store-line/80 bg-white px-3 py-1.5 font-semibold hover:bg-store-subtle"
        >
          Anterior
        </Link>
      ) : (
        <span className="rounded-sm border border-transparent px-3 py-1.5 text-store-navy-muted">Anterior</span>
      )}
      <span className="tabular-nums text-store-navy-muted">
        Página {page} de {totalPages}
      </span>
      {next != null ? (
        <Link
          href={hrefForPage(baseQuery, next)}
          className="rounded-sm border border-store-line/80 bg-white px-3 py-1.5 font-semibold hover:bg-store-subtle"
        >
          Próxima
        </Link>
      ) : (
        <span className="rounded-sm border border-transparent px-3 py-1.5 text-store-navy-muted">Próxima</span>
      )}
    </nav>
  );
}
