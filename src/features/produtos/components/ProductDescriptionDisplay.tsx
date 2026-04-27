import {
  isHtmlDescriptionEmpty,
  isStoredProductDescriptionHtml,
  sanitizeProductDescriptionHtml,
} from "@/features/produtos/utils/sanitizeProductDescription";

const htmlShell =
  "product-description-html text-sm leading-relaxed text-store-navy [&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:font-bold [&_b]:font-bold";

type Props = {
  descricao: string;
  emptyMessage?: string;
};

export function ProductDescriptionDisplay({
  descricao,
  emptyMessage = "Sem descrição cadastrada para este produto.",
}: Props) {
  const raw = descricao.trim();
  if (!raw) {
    return <p className="text-sm text-store-navy-muted">{emptyMessage}</p>;
  }

  if (isStoredProductDescriptionHtml(raw)) {
    const safe = sanitizeProductDescriptionHtml(raw);
    if (!safe || isHtmlDescriptionEmpty(safe)) {
      return <p className="text-sm text-store-navy-muted">{emptyMessage}</p>;
    }
    return <div className={htmlShell} dangerouslySetInnerHTML={{ __html: safe }} />;
  }

  return <div className="whitespace-pre-wrap text-sm leading-relaxed text-store-navy">{raw}</div>;
}
