import sanitizeHtml from "sanitize-html";

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "strong", "b", "em", "i"],
  allowedAttributes: {
    p: ["style"],
  },
  allowedStyles: {
    "*": {
      "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
    },
  },
};

/** HTML seguro para gravar no banco ou exibir na vitrine. */
export function sanitizeProductDescriptionHtml(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return sanitizeHtml(trimmed, SANITIZE_OPTIONS).trim();
}

/** True se o conteúdo parece HTML vindo do editor (vs. texto legado). */
export function isStoredProductDescriptionHtml(raw: string): boolean {
  return /<\s*(p|div|strong|b|br|em)\b/i.test(raw);
}

/** Remove tags e normaliza entidades básicas para checar se há texto. */
export function isHtmlDescriptionEmpty(html: string): boolean {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length === 0;
}
