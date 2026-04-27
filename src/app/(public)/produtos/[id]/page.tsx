import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { storeShellContent, storeShellInset } from "@/config/storeShell";
import { ProductMercadoPagoInstallments } from "@/features/produtos/components/ProductMercadoPagoInstallments";
import { ProductDetailAddToCart } from "@/features/produtos/components/ProductDetailAddToCart";
import { ProductsGrid } from "@/features/produtos/components/ProductsGrid";
import { ProductDescriptionDisplay } from "@/features/produtos/components/ProductDescriptionDisplay";
import { getProductDetailPageData } from "@/features/produtos/services/getProductDetailPageData";
import { unitPriceAfterPaymentDiscount } from "@/features/produtos/utils/paymentDiscount";

type PageProps = { params: Promise<{ id: string }> };

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Quadrado da foto: no `lg` o tamanho fica limitado pela altura da linha (até a quantidade na coluna ao lado). */
function ProductPhoto({ src, alt }: { src: string | null; alt: string }) {
  const shell =
    "flex aspect-square w-full max-w-[min(100%,22rem)] items-center justify-center rounded-lg border border-store-line/80 bg-white p-3 shadow-sm sm:max-w-[26rem] " +
    "lg:max-h-full lg:max-w-full lg:min-h-0 lg:min-w-0 lg:shadow-none";
  if (!src) {
    return (
      <div className={`text-center text-sm text-store-navy-muted ${shell}`}>
        Sem foto
      </div>
    );
  }
  return (
    <div className={shell}>
      {/* eslint-disable-next-line @next/next/no-img-element -- URL pode vir de storage externo sem remotePatterns fixos */}
      <img src={src} alt={alt} className="max-h-full max-w-full object-contain object-center" />
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const { produto } = await getProductDetailPageData(id);
  return { title: produto ? `${produto.titulo} | Produto` : "Produto não encontrado" };
}

export default async function ProdutoDetalhePage({ params }: PageProps) {
  const { id } = await params;
  const { produto, relacionados } = await getProductDetailPageData(id);

  if (!produto) notFound();

  const outOfStock = produto.quantidade_estoque <= 0;
  const stockText = outOfStock ? "Indisponível no momento" : "Em estoque";

  const precoCartao = unitPriceAfterPaymentDiscount(
    produto.valor,
    "cartao",
    produto.desconto_pix_percent,
    produto.desconto_cartao_percent,
  );
  const precoPix = unitPriceAfterPaymentDiscount(
    produto.valor,
    "pix",
    produto.desconto_pix_percent,
    produto.desconto_cartao_percent,
  );
  const pixDestaque = produto.desconto_pix_percent > 0;

  return (
    <div className="flex min-h-dvh flex-col bg-store-cream font-sans text-store-navy">
      <main className={`flex-1 py-8 sm:py-10 ${storeShellInset}`}>
        <div className={`${storeShellContent} space-y-10`}>
          <section className="grid grid-cols-1 gap-6 border-b border-store-line pb-8 lg:grid-cols-12 lg:items-stretch lg:gap-8">
            {/* Ordem no mobile: foto → descrição → compra → compat. No desktop: foto e compra na linha 1; descrição e compat na linha 2. */}
            <div className="flex w-full justify-center lg:col-span-5 lg:row-start-1 lg:h-full lg:min-h-0 lg:flex-col lg:items-stretch">
              <div className="flex min-h-[12rem] w-full min-w-0 flex-1 items-center justify-center lg:min-h-0">
                <ProductPhoto src={produto.imageUrl} alt={produto.titulo} />
              </div>
            </div>

            <div className="space-y-2 border-t border-store-line pt-4 lg:col-span-5 lg:row-start-2 lg:border-t-0 lg:pt-0">
              <h2 className="text-sm font-semibold text-store-navy">Descrição</h2>
              <ProductDescriptionDisplay descricao={produto.descricao} />
            </div>

            <div className="space-y-4 lg:col-span-7 lg:col-start-6 lg:row-start-1">
              <h1 className="text-2xl font-bold leading-tight text-black sm:text-3xl">{produto.titulo}</h1>

              <div className="space-y-2">
                <p className="text-3xl font-bold text-[#1d63ed] sm:text-4xl">{money.format(precoCartao)}</p>
                <p className={`text-sm font-semibold ${outOfStock ? "text-red-700" : "text-emerald-700"}`}>
                  {stockText}
                </p>
              </div>

              <div className="space-y-1 rounded-xl bg-store-subtle/90 p-4 shadow-md sm:p-5">
                <h2 className="text-2xl font-bold uppercase tracking-wide text-store-accent sm:text-3xl">
                  PIX
                </h2>
                {pixDestaque ? (
                  <p className="text-base text-store-navy sm:text-lg">
                    <span className="font-bold text-black">{money.format(precoPix)}</span>
                    <span className="text-store-navy-muted"> · </span>
                    <span className="font-semibold text-store-accent">
                      desconto de {produto.desconto_pix_percent}% no PIX
                    </span>
                  </p>
                ) : (
                  <p className="text-base font-medium text-store-accent sm:text-lg">
                    Pague com PIX no checkout.
                  </p>
                )}
              </div>

              <ProductMercadoPagoInstallments amountBrl={precoCartao} />

              <div className="space-y-1 pt-1">
                <label htmlFor="cep" className="block text-xs font-semibold text-store-navy">
                  Consultar CEP
                </label>
                <input
                  id="cep"
                  name="cep"
                  placeholder="Digite seu CEP aqui"
                  className="w-full rounded-full bg-store-subtle/60 px-4 py-2.5 text-sm text-store-navy outline-none ring-0 transition placeholder:text-store-navy-muted focus:bg-white focus:ring-2 focus:ring-store-accent"
                />
              </div>

              <ProductDetailAddToCart product={produto} />
            </div>

            <div className="space-y-2 border-t border-store-line pt-4 lg:col-span-7 lg:col-start-6 lg:row-start-2">
              <h2 className="text-sm font-semibold text-store-navy">Compatibilidade</h2>
              {produto.compatibilidades.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {produto.compatibilidades.map((item) => (
                    <li
                      key={item}
                      className="rounded-full border border-store-line bg-store-accent/80 px-3 py-1 text-xs font-semibold text-black"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-store-navy-muted">Compatibilidade ainda não informada.</p>
              )}
            </div>
          </section>

          <section aria-labelledby="produtos-relacionados-heading" className="space-y-5">
            <header>
              <h2
                id="produtos-relacionados-heading"
                className="text-2xl font-bold tracking-tight text-black sm:text-3xl"
              >
                Produtos relacionados
              </h2>
              <div className="mt-2 h-1 w-14 rounded-[1px] bg-store-navy sm:w-16" aria-hidden />
            </header>
            <ProductsGrid
              variant="catalog"
              produtos={relacionados}
              emptyMessage="Ainda não encontramos produtos relacionados para este item."
            />
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
