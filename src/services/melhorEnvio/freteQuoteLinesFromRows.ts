import type { MelhorEnvioQuoteLine } from "@/services/melhorEnvio/types";

export type ProdutoFreteRow = {
  id: string;
  valor: unknown;
  quantidade_estoque: unknown;
  prod_comprimento_cm: unknown;
  prod_largura_cm: unknown;
  prod_altura_cm: unknown;
  prod_peso_kg: unknown;
  embalagem_id: string | null;
};

export type EmbalagemRow = {
  id: string;
  comprimento_cm: unknown;
  largura_cm: unknown;
  altura_cm: unknown;
  peso_embalagem_kg: unknown;
};

function positiveNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined) {
    return null;
  }
  const n = typeof raw === "number" ? raw : Number(String(raw).replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }
  return n;
}

function nonNegNumber(raw: unknown): number {
  if (raw === null || raw === undefined) {
    return 0;
  }
  const n = typeof raw === "number" ? raw : Number(String(raw).replace(",", "."));
  if (!Number.isFinite(n) || n < 0) {
    return 0;
  }
  return n;
}

export function rowToQuoteLine(
  row: ProdutoFreteRow,
  embalagens: Map<string, EmbalagemRow>,
  quantidade: number,
): { ok: true; line: MelhorEnvioQuoteLine } | { ok: false; message: string } {
  const valorUnit = nonNegNumber(row.valor);
  const valorDeclaradoCentavos = Math.round(valorUnit * 100) * quantidade;

  if (row.embalagem_id != null) {
    const emb = embalagens.get(row.embalagem_id);
    if (!emb) {
      return {
        ok: false,
        message: "Embalagem vinculada ao produto não foi encontrada.",
      };
    }
    const L = positiveNumber(emb.comprimento_cm);
    const W = positiveNumber(emb.largura_cm);
    const H = positiveNumber(emb.altura_cm);
    const embWeight = nonNegNumber(emb.peso_embalagem_kg);
    const prodWeightUnit = positiveNumber(row.prod_peso_kg);
    if (!L || !W || !H) {
      return {
        ok: false,
        message:
          "Embalagem do produto sem dimensões válidas. Complete o cadastro ou escolha outra embalagem.",
      };
    }
    if (!prodWeightUnit) {
      return {
        ok: false,
        message: "Peso do produto ausente ou inválido para cotação de frete.",
      };
    }
    const pesoKg = prodWeightUnit * quantidade + embWeight;
    return {
      ok: true,
      line: {
        produtoId: row.id,
        quantidade,
        dimensoes: {
          comprimentoCm: L,
          larguraCm: W,
          alturaCm: H,
          pesoKg,
        },
        valorDeclaradoCentavos,
      },
    };
  }

  const L = positiveNumber(row.prod_comprimento_cm);
  const W = positiveNumber(row.prod_largura_cm);
  const H = positiveNumber(row.prod_altura_cm);
  const prodWeightUnit = positiveNumber(row.prod_peso_kg);
  if (!L || !W || !H || !prodWeightUnit) {
    return {
      ok: false,
      message:
        "Produto sem dimensões e peso completos para cotação (ou sem embalagem cadastrada).",
    };
  }
  const pesoKg = prodWeightUnit * quantidade;
  return {
    ok: true,
    line: {
      produtoId: row.id,
      quantidade,
      dimensoes: {
        comprimentoCm: L,
        larguraCm: W,
        alturaCm: H,
        pesoKg,
      },
      valorDeclaradoCentavos,
    },
  };
}
