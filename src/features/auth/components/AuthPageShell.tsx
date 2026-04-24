import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { storeShellContent, storeShellInset } from "@/config/storeShell";

type AuthPageShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
  /** Largura máxima do card (ex.: layout da conta). Padrão: max-w-md */
  cardMaxWidthClassName?: string;
};

export function AuthPageShell({
  title,
  description,
  children,
  cardMaxWidthClassName = "max-w-md",
}: AuthPageShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-store-cream font-sans text-store-navy">
      <main className={`flex flex-1 flex-col py-10 sm:py-14 ${storeShellInset}`}>
        <div className={storeShellContent}>
          <div
            className={`mx-auto w-full rounded-lg border border-store-line/80 bg-white p-6 shadow-sm sm:p-8 ${cardMaxWidthClassName}`}
          >
            <h1 className="text-xl font-bold tracking-tight text-store-navy sm:text-2xl">{title}</h1>
            {description ? (
              <p className="mt-2 text-sm text-store-navy-muted">{description}</p>
            ) : null}
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
