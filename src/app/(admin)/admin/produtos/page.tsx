import { Suspense } from "react";

import { AdminDashboardProductSearch } from "@/features/admin/components/AdminDashboardProductSearch";
import { ProductDestaqueStarForm } from "@/features/produtos/components/ProductDestaqueStarForm";
import { ProductRowActions } from "@/features/produtos/components/ProductRowActions";
import { ProductCreateModal } from "@/features/produtos/components/ProductCreateModal";
import { getProductFormOptions } from "@/features/produtos/services/getProductFormOptions";
import { normalizeProductSearchInput } from "@/features/produtos/services/productSearchMatchingIds";
import { createClient } from "@/services/supabase/server";

export const metadata = {
  title: "Produtos | Admin",
};

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

type ProdutoRow = {
  id: string;
  titulo: string;
  cod_produto: string;
  valor: number;
  quantidade_estoque: number;
  em_destaque: boolean;
};

type KpiRow = { valor: number; quantidade_estoque: number };

const PRODUTO_LIST_SELECT =
  "id, titulo, cod_produto, valor, quantidade_estoque, em_destaque" as const;

function mergeProdutosById(a: ProdutoRow[], b: ProdutoRow[]): ProdutoRow[] {
  const map = new Map<string, ProdutoRow>();
  for (const row of a) map.set(row.id, row);
  for (const row of b) map.set(row.id, row);
  return [...map.values()].sort((x, y) =>
    x.titulo.localeCompare(y.titulo, "pt-BR", { sensitivity: "base" })
  );
}

function computeKpiStats(rows: KpiRow[]) {
  const n = rows.length;
  const totalItens = rows.reduce((s, p) => s + Number(p.quantidade_estoque), 0);
  const valorEstoque = rows.reduce(
    (s, p) => s + Number(p.valor) * Number(p.quantidade_estoque),
    0
  );
  const esgotados = rows.filter((p) => Number(p.quantidade_estoque) <= 0).length;
  const ultimaUnidade = rows.filter((p) => Number(p.quantidade_estoque) === 1).length;
  return { n, totalItens, valorEstoque, esgotados, ultimaUnidade };
}

export default async function AdminProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const formOptions = await getProductFormOptions();
  let produtos: ProdutoRow[] = [];
  let loadError: string | null = null;

  const sp = await searchParams;
  const rawQ = typeof sp.q === "string" ? sp.q : Array.isArray(sp.q) ? sp.q[0] : "";
  const searchTerm = normalizeProductSearchInput(rawQ);

  let kpiRows: KpiRow[] = [];

  try {
    const supabase = await createClient();
    const mapProdutoRows = (rows: unknown): ProdutoRow[] =>
      (rows as ProdutoRow[]).map((row) => ({
        ...row,
        em_destaque: Boolean(row.em_destaque),
      }));

    if (!searchTerm) {
      const { data, error } = await supabase
        .from("produtos")
        .select(PRODUTO_LIST_SELECT)
        .order("titulo");

      if (error) {
        loadError = error.message;
      } else if (data) {
        produtos = mapProdutoRows(data);
        kpiRows = produtos.map((p) => ({
          valor: Number(p.valor),
          quantidade_estoque: Number(p.quantidade_estoque),
        }));
      }
    } else {
      const pattern = `%${searchTerm}%`;
      const [kpiRes, tituloRes, codRes] = await Promise.all([
        supabase.from("produtos").select("valor, quantidade_estoque"),
        supabase.from("produtos").select(PRODUTO_LIST_SELECT).ilike("titulo", pattern),
        supabase.from("produtos").select(PRODUTO_LIST_SELECT).ilike("cod_produto", pattern),
      ]);

      const err =
        kpiRes.error?.message ?? tituloRes.error?.message ?? codRes.error?.message ?? null;
      if (err) {
        loadError = err;
      } else {
        kpiRows = (kpiRes.data ?? []) as KpiRow[];
        produtos = mergeProdutosById(
          mapProdutoRows(tituloRes.data ?? []),
          mapProdutoRows(codRes.data ?? [])
        );
      }
    }
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Erro ao carregar produtos.";
  }

  const { n, totalItens, valorEstoque, esgotados, ultimaUnidade } = computeKpiStats(kpiRows);
  const disableCreateButton = Boolean(formOptions.configError || formOptions.loadError);

  return (
    <div className="space-y-6">
      {formOptions.configError && (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm"
          role="alert"
        >
          <p className="font-semibold">Configuração</p>
          <p className="mt-1">{formOptions.configError}</p>
        </div>
      )}

      {loadError && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950 shadow-sm"
          role="alert"
        >
          <p className="font-semibold">Erro ao carregar</p>
          <p className="mt-1">{loadError}</p>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Produtos</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">{n}</p>
        </article>
        <article className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Itens em estoque</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
            {totalItens.toLocaleString("pt-BR")}
          </p>
        </article>
        <article className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Valor em estoque</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">{money.format(valorEstoque)}</p>
        </article>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
          <div className="min-w-0 shrink">
            <h2 className="text-base font-semibold text-gray-900">Lista de produtos</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {searchTerm
                ? `Filtrando por nome ou código · ${produtos.length} resultado${produtos.length === 1 ? "" : "s"}`
                : "Pesquise, edite e gerencie o catálogo"}
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
            <Suspense
              fallback={
                <div
                  className="h-10 w-full max-w-md shrink-0 animate-pulse rounded-lg bg-gray-100 lg:mt-0.5"
                  aria-hidden
                />
              }
            >
              <AdminDashboardProductSearch />
            </Suspense>
            <ProductCreateModal
              modelos={formOptions.modelos}
              categorias={formOptions.categorias}
              embalagens={formOptions.embalagens}
              produtosRelacionadosOpcoes={formOptions.produtosRelacionadosOpcoes}
              disabled={disableCreateButton}
            />
          </div>
        </div>

        {formOptions.categoriasLoadError && (
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-950">
            Categorias não carregadas ({formOptions.categoriasLoadError}).
          </div>
        )}
        {formOptions.embalagensLoadError && (
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-950">
            Embalagens não carregadas ({formOptions.embalagensLoadError}).
          </div>
        )}

        {ultimaUnidade > 0 && (
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-950" role="status">
            <p className="font-semibold">Atenção: última unidade em estoque</p>
            <p className="mt-1 text-amber-900/95">
              {ultimaUnidade === 1
                ? "Há 1 produto com apenas uma unidade disponível. Reposição recomendada."
                : `Há ${ultimaUnidade} produtos com apenas uma unidade disponível. Reposição recomendada.`}
            </p>
          </div>
        )}
        {esgotados > 0 && (
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-3 text-sm text-gray-700">
            {esgotados} produto{esgotados > 1 ? "s" : ""} sem estoque.
          </div>
        )}

        {produtos.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-gray-500">
            {searchTerm ? "Nenhum produto encontrado para essa busca." : "Nenhum produto cadastrado ainda."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="w-14 px-2 py-3 text-center text-amber-500" scope="col">
                    <span className="sr-only">Destaque na home</span>
                    <span aria-hidden>★</span>
                  </th>
                  <th className="px-6 py-3">Produto</th>
                  <th className="px-6 py-3">Código</th>
                  <th className="px-6 py-3 text-right">Valor</th>
                  <th className="px-6 py-3 text-right">Estoque</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {produtos.map((p) => {
                  const q = Number(p.quantidade_estoque);
                  const inStock = q > 0;
                  const oneLeft = q === 1;
                  return (
                    <tr key={p.id} className="text-gray-900 transition hover:bg-gray-50/80">
                      <td className="px-2 py-4">
                        <ProductDestaqueStarForm productId={p.id} emDestaque={p.em_destaque} />
                      </td>
                      <td className="px-6 py-4 font-medium">{p.titulo}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-600">{p.cod_produto}</td>
                      <td className="px-6 py-4 text-right tabular-nums font-medium">
                        {money.format(Number(p.valor))}
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums text-gray-700">{q}</td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={[
                            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                            !inStock
                              ? "bg-gray-100 text-gray-600"
                              : oneLeft
                                ? "bg-amber-100 text-amber-900"
                                : "bg-[#1d63ed]/12 text-[#1d63ed]",
                          ].join(" ")}
                        >
                          {!inStock ? "Esgotado" : oneLeft ? "Última unidade" : "Em estoque"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ProductRowActions productId={p.id} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
