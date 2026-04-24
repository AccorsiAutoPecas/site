import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { storeShellContent, storeShellInset } from "@/config/storeShell";

type LegalDocumentLayoutProps = {
  title: string;
  version: string;
  publishedAt: string;
  children: ReactNode;
};

function formatPublishedDate(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) {
    return isoDate;
  }
  return d.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function LegalDocumentLayout({ title, version, publishedAt, children }: LegalDocumentLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-store-cream font-sans text-store-navy">
      <article className={`flex-1 py-10 sm:py-14 ${storeShellInset}`}>
        <div className={storeShellContent}>
          <header className="border-b border-store-line/80 pb-8">
            <p className="text-sm font-medium text-store-navy-muted">Accorsi Auto Peças</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-store-navy sm:text-3xl">{title}</h1>
            <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-store-navy-muted">
              <div>
                <dt className="inline font-medium text-store-navy/80">Versão: </dt>
                <dd className="inline">{version}</dd>
              </div>
              <div>
                <dt className="inline font-medium text-store-navy/80">Publicado em: </dt>
                <dd className="inline">{formatPublishedDate(publishedAt)}</dd>
              </div>
            </dl>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-store-navy-muted">
              Este texto tem caráter informativo. Revise com assessoria jurídica antes de uso em produção.
            </p>
          </header>
          <div className="mt-10 max-w-3xl space-y-8 text-sm leading-relaxed text-store-navy sm:text-[15px] [&_h2]:scroll-mt-24 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-store-navy [&_p]:text-store-navy/95 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_a]:font-medium [&_a]:text-store-navy [&_a]:underline [&_a]:underline-offset-2">
            {children}
          </div>
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}
