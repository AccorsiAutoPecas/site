"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

type MarcaOpt = { id: string; nome: string };

/**
 * Filtros da listagem de modelos: navegação client-side com scroll preservado.
 * Um GET nativo recarrega a página e o Next.js rola para o topo por padrão.
 */
export function ModelosListagemFiltros({
  marcas,
  defaultMarcaId,
  defaultBusca,
}: {
  marcas: MarcaOpt[];
  defaultMarcaId: string;
  defaultBusca: string;
}) {
  const router = useRouter();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const marca = String(fd.get("marcaModelo") ?? "").trim();
    const busca = String(fd.get("buscaModelo") ?? "").trim();

    const sp = new URLSearchParams();
    if (marca) sp.set("marcaModelo", marca);
    if (busca) sp.set("buscaModelo", busca);
    const q = sp.toString();
    const url = q ? `/admin/marcas-e-modelos?${q}` : "/admin/marcas-e-modelos";
    router.push(url, { scroll: false });
  }

  const showLimpar = defaultBusca.length > 0 || defaultMarcaId.length > 0;

  return (
    <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Marca</span>
          <select
            name="marcaModelo"
            defaultValue={defaultMarcaId}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-admin-accent focus:ring-2 focus:ring-[#1d63ed]/20"
            aria-label="Filtrar modelos por marca"
          >
            <option value="">Todas as marcas</option>
            {marcas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Busca</span>
          <input
            type="search"
            name="buscaModelo"
            defaultValue={defaultBusca}
            placeholder="Modelo, marca ou tipo"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-admin-accent focus:ring-2 focus:ring-[#1d63ed]/20"
            aria-label="Buscar modelos cadastrados"
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="rounded-lg bg-admin-accent px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1857d1]"
        >
          Aplicar filtros
        </button>
        {showLimpar && (
          <Link
            href="/admin/marcas-e-modelos"
            scroll={false}
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Limpar filtros
          </Link>
        )}
      </div>
    </form>
  );
}
