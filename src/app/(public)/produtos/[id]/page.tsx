import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { storeShellContent, storeShellInset } from "@/config/storeShell";
import { ProductMercadoPagoInstallments } from "@/features/produtos/components/ProductMercadoPagoInstallments";
import { ProductDetailAddToCart } from "@/features/produtos/components/ProductDetailAddToCart";
import { ProductsGrid } from "@/features/produtos/components/ProductsGrid";
import { getProductDetailPageData } from "@/features/produtos/services/getProductDetailPageData";
import { unitPriceAfterPaymentDiscount } from "@/features/produtos/utils/paymentDiscount";

type PageProps = { params: Promise<{ id: string }> };

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function ProductPhoto({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="mx-auto flex aspect-square w-full max-w-[220px] items-center justify-center bg-transparent text-sm text-store-navy-muted sm:max-w-[260px]">
        Sem foto
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- URL pode vir de storage externo sem remotePatterns fixos
    <img
      src={src}
      alt={alt}
      className="mx-auto aspect-square w-full max-w-[220px] object-contain sm:max-w-[260px]"
    />
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
          <section className="grid grid-cols-1 gap-6 border-b border-store-line pb-8 lg:grid-cols-12 lg:gap-8">
            <div className="flex justify-center lg:col-span-5">
              <ProductPhoto src={produto.imageUrl} alt={produto.titulo} />
            </div>

            <div className="space-y-4 lg:col-span-7">
              <p className="text-sm text-store-navy-muted">{produto.cod_produto}</p>
              <h1 className="text-2xl font-bold leading-tight text-black sm:text-3xl">{produto.titulo}</h1>

              <div className="space-y-2">
                <p className="text-3xl font-bold text-[#1d63ed] sm:text-4xl">{money.format(precoCartao)}</p>
                {pixDestaque ? (
                  <p className="text-base font-semibold text-emerald-800">
                    PIX: {money.format(precoPix)} ({produto.desconto_pix_percent}% off)
                  </p>
                ) : null}
                <p className={`text-sm font-semibold ${outOfStock ? "text-red-700" : "text-emerald-700"}`}>
                  {stockText}
                </p>
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

              <div className="space-y-2 border-t border-store-line pt-3">
                <h2 className="text-sm font-semibold text-store-navy">Descrição</h2>
                <div className="text-sm leading-relaxed text-store-navy">
                  {produto.descricao || "Sem descrição cadastrada para este produto."}
                </div>
              </div>

              <div className="space-y-2">
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
