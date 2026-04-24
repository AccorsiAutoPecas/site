import Link from "next/link";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { storeShellContent, storeShellInset } from "@/config/storeShell";

type RetornoStatus = "success" | "pending" | "failure" | "unknown";

function normalizeStatus(raw: string | undefined): RetornoStatus {
  if (raw === "success" || raw === "pending" || raw === "failure") {
    return raw;
  }
  return "unknown";
}

const copy: Record<
  RetornoStatus,
  { title: string; body: string; tone: "ok" | "warn" | "err" | "neutral" }
> = {
  success: {
    title: "Pagamento em análise ou aprovado",
    body: "Obrigado pela compra. O status final do pedido é confirmado pelo Mercado Pago e pode levar alguns instantes. Você pode acompanhar em Minha conta quando os pedidos estiverem disponíveis.",
    tone: "ok",
  },
  pending: {
    title: "Pagamento pendente",
    body: "Seu pagamento ainda está sendo processado. Assim que houver confirmação, atualizaremos o status do pedido. Não é necessário tentar pagar novamente enquanto o status estiver pendente.",
    tone: "warn",
  },
  failure: {
    title: "Pagamento não concluído",
    body: "Não foi possível concluir o pagamento nesta tentativa. Você pode revisar o carrinho e tentar novamente, ou escolher outro meio de pagamento no checkout.",
    tone: "err",
  },
  unknown: {
    title: "Retorno do checkout",
    body: "Você voltou da página de pagamento. O estado final do pedido é atualizado automaticamente; se algo parecer incorreto, aguarde alguns minutos ou entre em contato com o suporte.",
    tone: "neutral",
  },
};

const toneBorder: Record<(typeof copy)[RetornoStatus]["tone"], string> = {
  ok: "border-emerald-200 bg-emerald-50/90",
  warn: "border-amber-200 bg-amber-50/90",
  err: "border-red-200 bg-red-50/90",
  neutral: "border-store-line/80 bg-white",
};

export default async function CheckoutRetornoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const statusRaw = sp.status;
  const statusParam = typeof statusRaw === "string" ? statusRaw : undefined;
  const status = normalizeStatus(statusParam);
  const { title, body, tone } = copy[status];

  return (
    <div className="flex min-h-dvh flex-col bg-store-cream font-sans text-store-navy">
      <main className={`flex flex-1 flex-col py-10 sm:py-14 ${storeShellInset}`}>
        <div className={storeShellContent}>
          <div
            className={`mx-auto w-full max-w-lg rounded-lg border p-6 shadow-sm sm:p-8 ${toneBorder[tone]}`}
          >
            <h1 className="text-xl font-bold tracking-tight text-black sm:text-2xl">{title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-store-navy">{body}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/carrinho"
                className="inline-flex flex-1 items-center justify-center rounded-md bg-store-navy px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-store-navy/90 sm:flex-none sm:min-w-[10rem]"
              >
                Ver carrinho
              </Link>
              <Link
                href="/conta"
                className="inline-flex flex-1 items-center justify-center rounded-md border border-store-line bg-white px-4 py-2.5 text-center text-sm font-semibold text-store-navy transition hover:bg-store-subtle sm:flex-none sm:min-w-[10rem]"
              >
                Minha conta
              </Link>
              <Link
                href="/produtos"
                className="inline-flex flex-1 items-center justify-center rounded-md border border-transparent px-4 py-2.5 text-center text-sm font-semibold text-store-navy underline-offset-4 hover:underline sm:flex-none"
              >
                Continuar comprando
              </Link>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
