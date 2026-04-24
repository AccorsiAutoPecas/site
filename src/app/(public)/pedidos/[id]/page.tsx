import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { PedidoDetailSection } from "@/features/pedidos/components/PedidoDetailSection";
import { getMyPedidoByIdWithItens } from "@/features/pedidos/services/getMyPedidoByIdWithItens";
import { isUuid } from "@/features/pedidos/utils/isUuid";
import { createClient } from "@/services/supabase/server";
import { storeShellContent, storeShellInset } from "@/config/storeShell";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  if (!isUuid(id)) {
    return { title: "Pedido" };
  }
  const pedido = await getMyPedidoByIdWithItens(id);
  if (!pedido) {
    return { title: "Pedido" };
  }
  return {
    title: `Pedido · ${pedido.id.slice(0, 8)}…`,
    robots: { index: false, follow: false },
  };
}

export default async function PedidoDetailPage({ params }: PageProps) {
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/pedidos/${encodeURIComponent(id)}`);
  }

  const pedido = await getMyPedidoByIdWithItens(id);
  if (!pedido) {
    notFound();
  }

  return (
    <div className="flex min-h-dvh flex-col bg-store-cream font-sans text-store-navy">
      <main className={`flex flex-1 flex-col py-10 sm:py-14 ${storeShellInset}`}>
        <div className={storeShellContent}>
          <div className="mx-auto w-full max-w-3xl rounded-lg border border-store-line/80 bg-white p-6 shadow-sm sm:p-8">
            <h1 className="text-xl font-bold tracking-tight text-store-navy sm:text-2xl">Detalhe do pedido</h1>
            <div className="mt-6">
              <PedidoDetailSection pedido={pedido} />
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
