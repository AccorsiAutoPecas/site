import {
  ensureMelhorEnvioAccessToken,
  MelhorEnvioCredentialsMissingError,
  quoteShipment,
} from "@/services/melhorEnvio";
import type { MelhorEnvioQuoteLine } from "@/services/melhorEnvio/types";
import { createClient } from "@/services/supabase/server";

export const dynamic = "force-dynamic";

const MAX_ITENS = 40;
const MAX_QTY_PER_ITEM = 999;

function normalizeCep(raw: unknown): string | null {
  if (typeof raw !== "string") {
    return null;
  }
  const digits = raw.replace(/\D/g, "");
  return digits.length === 8 ? digits : null;
}

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

type ProdutoFreteRow = {
  id: string;
  valor: unknown;
  quantidade_estoque: unknown;
  prod_comprimento_cm: unknown;
  prod_largura_cm: unknown;
  prod_altura_cm: unknown;
  prod_peso_kg: unknown;
  embalagem_id: string | null;
};

type EmbalagemRow = {
  id: string;
  comprimento_cm: unknown;
  largura_cm: unknown;
  altura_cm: unknown;
  peso_embalagem_kg: unknown;
};

function rowToQuoteLine(
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

type BodyItem = { produto_id?: unknown; quantidade?: unknown };

function parseBodyItems(body: unknown): Map<string, number> | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "JSON inválido." };
  }
  const o = body as Record<string, unknown>;
  const itens = o.itens;
  if (!Array.isArray(itens) || itens.length === 0) {
    return { error: "Envie `itens` com ao menos um produto." };
  }
  if (itens.length > MAX_ITENS) {
    return { error: `Limite de ${MAX_ITENS} itens por cotação.` };
  }

  const merged = new Map<string, number>();
  for (const raw of itens) {
    if (!raw || typeof raw !== "object") {
      return { error: "Item do carrinho inválido." };
    }
    const item = raw as BodyItem;
    const pid = item.produto_id;
    if (typeof pid !== "string" || !pid.trim()) {
      return { error: "Cada item precisa de `produto_id` (string)." };
    }
    const q = item.quantidade;
    if (typeof q !== "number" || !Number.isInteger(q) || q < 1) {
      return { error: "Quantidade inválida em um dos itens." };
    }
    if (q > MAX_QTY_PER_ITEM) {
      return { error: `Quantidade máxima por item: ${MAX_QTY_PER_ITEM}.` };
    }
    const id = pid.trim();
    merged.set(id, (merged.get(id) ?? 0) + q);
  }
  return merged;
}

export async function POST(request: Request) {
  const cepOrigemRaw = process.env.MELHOR_ENVIO_CEP_ORIGEM?.trim();
  const cepOrigem = cepOrigemRaw ? normalizeCep(cepOrigemRaw) : null;
  if (!cepOrigem) {
    return Response.json(
      {
        error:
          "CEP de origem não configurado. Defina MELHOR_ENVIO_CEP_ORIGEM no servidor.",
      },
      { status: 503 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const o = json && typeof json === "object" ? (json as Record<string, unknown>) : null;
  const cepDestino = o ? normalizeCep(o.cep_destino ?? o.cep) : null;
  if (!cepDestino) {
    return Response.json(
      { error: "Informe `cep_destino` (ou `cep`) com 8 dígitos." },
      { status: 400 },
    );
  }

  const parsedItems = parseBodyItems(json);
  if ("error" in parsedItems) {
    return Response.json({ error: parsedItems.error }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Faça login para calcular o frete." }, { status: 401 });
  }

  const ids = [...parsedItems.keys()];
  const { data: prodRows, error: prodErr } = await supabase
    .from("produtos")
    .select(
      "id, valor, quantidade_estoque, prod_comprimento_cm, prod_largura_cm, prod_altura_cm, prod_peso_kg, embalagem_id",
    )
    .in("id", ids);

  if (prodErr) {
    return Response.json(
      { error: "Não foi possível carregar os produtos. Tente novamente." },
      { status: 502 },
    );
  }

  const rows = (prodRows ?? []) as ProdutoFreteRow[];
  if (rows.length !== ids.length) {
    return Response.json(
      { error: "Um ou mais produtos não foram encontrados." },
      { status: 400 },
    );
  }

  const embIds = [
    ...new Set(rows.map((r) => r.embalagem_id).filter((id): id is string => Boolean(id))),
  ];
  const embalagens = new Map<string, EmbalagemRow>();
  if (embIds.length > 0) {
    const { data: embData, error: embErr } = await supabase
      .from("embalagens")
      .select("id, comprimento_cm, largura_cm, altura_cm, peso_embalagem_kg")
      .in("id", embIds);
    if (embErr) {
      return Response.json(
        { error: "Não foi possível carregar embalagens. Tente novamente." },
        { status: 502 },
      );
    }
    for (const e of (embData ?? []) as EmbalagemRow[]) {
      embalagens.set(e.id, e);
    }
  }

  const linhas: MelhorEnvioQuoteLine[] = [];
  for (const row of rows) {
    const quantidade = parsedItems.get(row.id);
    if (quantidade === undefined) {
      continue;
    }
    const estoqueRaw = row.quantidade_estoque;
    const estoque =
      typeof estoqueRaw === "number"
        ? estoqueRaw
        : Number.parseInt(String(estoqueRaw ?? "0"), 10);
    if (Number.isFinite(estoque) && estoque >= 0 && quantidade > estoque) {
      return Response.json(
        { error: "Estoque insuficiente para um ou mais itens." },
        { status: 400 },
      );
    }
    const built = rowToQuoteLine(row, embalagens, quantidade);
    if (!built.ok) {
      return Response.json({ error: built.message }, { status: 400 });
    }
    linhas.push(built.line);
  }

  if (linhas.length === 0) {
    return Response.json({ error: "Nenhum item válido para cotação." }, { status: 400 });
  }

  let token: string;
  try {
    token = await ensureMelhorEnvioAccessToken();
  } catch (err) {
    if (err instanceof MelhorEnvioCredentialsMissingError) {
      return Response.json(
        { error: "Integração de frete não configurada na loja." },
        { status: 503 },
      );
    }
    console.error("[frete/calcular] falha ao obter token Melhor Envio.");
    return Response.json(
      { error: "Não foi possível preparar a cotação de frete. Tente mais tarde." },
      { status: 503 },
    );
  }

  const result = await quoteShipment(
    {
      cepOrigem,
      cepDestino,
      linhas,
    },
    { token },
  );

  if (!result.ok) {
    const status =
      result.code === "invalid_input"
        ? 400
        : result.code === "integration_disabled"
          ? 503
          : result.code === "network_error" || result.code === "api_error"
            ? 502
            : 502;
    return Response.json({ error: result.message }, { status });
  }

  return Response.json({ opcoes: result.opcoes });
}
