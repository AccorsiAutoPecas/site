import { ProductForm } from "@/features/produtos/components/ProductForm";
import { getProductFormOptions } from "@/features/produtos/services/getProductFormOptions";

export const metadata = {
  title: "Novo produto | Admin",
};

export default async function NovoProdutoPage() {
  const {
    modelos,
    categorias,
    embalagens,
    produtosRelacionadosOpcoes,
    configError,
    loadError,
    categoriasLoadError,
    embalagensLoadError,
  } = await getProductFormOptions();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {configError && (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm"
          role="alert"
        >
          <p className="font-semibold">Configuração</p>
          <p className="mt-1">{configError}</p>
          <p className="mt-2 text-xs text-amber-800/80">
            Crie <code className="rounded bg-black/5 px-1">.env</code> ou{" "}
            <code className="rounded bg-black/5 px-1">.env.local</code> com NEXT_PUBLIC_SUPABASE_URL e
            NEXT_PUBLIC_SUPABASE_ANON_KEY.
          </p>
        </div>
      )}

      {loadError && !configError && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950 shadow-sm"
          role="alert"
        >
          Não foi possível carregar modelos: {loadError}
        </div>
      )}

      {categoriasLoadError && !configError && (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm"
          role="alert"
        >
          Categorias não carregadas ({categoriasLoadError}). Você ainda pode cadastrar o produto; rode o SQL em{" "}
          <code className="rounded bg-black/5 px-1">supabase/migrations/20260411120000_categorias.sql</code> se
          necessário.
        </div>
      )}

      {embalagensLoadError && !configError && (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm"
          role="alert"
        >
          Embalagens não carregadas ({embalagensLoadError}). Aplique{" "}
          <code className="rounded bg-black/5 px-1">supabase/migrations/20260413220000_produto_dimensoes_embalagens.sql</code>{" "}
          no Supabase para habilitar dimensões e embalagem.
        </div>
      )}

      {!configError && (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
          <ProductForm
            modelos={modelos}
            categorias={categorias}
            embalagens={embalagens}
            produtosRelacionadosOpcoes={produtosRelacionadosOpcoes}
          />
        </div>
      )}
    </div>
  );
}
