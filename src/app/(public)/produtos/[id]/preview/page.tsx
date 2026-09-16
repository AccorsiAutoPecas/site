import { notFound } from "next/navigation";

import { ProductStorefrontDetail } from "@/features/produtos/components/ProductStorefrontDetail";
import { getProductDetailPageData } from "@/features/produtos/services/getProductDetailPageData";
import { getKitsForProduct } from "@/features/kits/services/getKitsForProduct";
import { requireAdmin } from "@/lib/auth/requireAdmin";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const { produto } = await getProductDetailPageData(id, true);
  return {
    title: produto ? `Prévia | ${produto.titulo}` : "Prévia do produto",
    robots: { index: false, follow: false },
  };
}

export default async function ProdutoPreviewPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const [{ produto, relacionados }, kitsDoProduto] = await Promise.all([
    getProductDetailPageData(id, true),
    getKitsForProduct(id),
  ]);

  if (!produto) notFound();

  return (
    <ProductStorefrontDetail
      produto={produto}
      relacionados={relacionados}
      kits={kitsDoProduto}
      preview
    />
  );
}
