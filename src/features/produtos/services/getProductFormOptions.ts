import { normalizeTipoVeiculoModeloFromDb } from "@/features/compatibilidade/constants/tipoVeiculoModelo";
import type { CategoriaOption } from "@/features/produtos/components/ProductCategoriasFieldset";
import type { EmbalagemOption } from "@/features/produtos/components/ProductEmbalagemFieldset";
import type {
  ModeloOption,
  ProdutoRelacionadoOption,
} from "@/features/produtos/components/ProductForm";
import { createClient } from "@/services/supabase/server";

export type ProductFormOptionsResult = {
  modelos: ModeloOption[];
  categorias: CategoriaOption[];
  embalagens: EmbalagemOption[];
  produtosRelacionadosOpcoes: ProdutoRelacionadoOption[];
  configError: string | null;
  loadError: string | null;
  categoriasLoadError: string | null;
  embalagensLoadError: string | null;
};

function marcaNomeFromRow(marcas: unknown): string {
  if (marcas == null) return "?";
  const row = Array.isArray(marcas) ? marcas[0] : marcas;
  if (row && typeof row === "object" && "nome" in row) {
    return String((row as { nome: string }).nome);
  }
  return "?";
}

function sortedUniqueInts(nums: number[]): number[] {
  return [...new Set(nums)].sort((a, b) => a - b);
}

export async function getProductFormOptions(): Promise<ProductFormOptionsResult> {
  let modelos: ModeloOption[] = [];
  let categorias: CategoriaOption[] = [];
  let embalagens: EmbalagemOption[] = [];
  let produtosRelacionadosOpcoes: ProdutoRelacionadoOption[] = [];
  let configError: string | null = null;
  let loadError: string | null = null;
  let categoriasLoadError: string | null = null;
  let embalagensLoadError: string | null = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("modelos")
      .select("id, nome, tipo_veiculo, marcas ( nome )")
      .order("nome");

    if (error) {
      loadError = error.message;
    } else if (data) {
      const { data: anosData, error: anosError } = await supabase
        .from("modelo_anos")
        .select("modelo_id, ano");

      const anosByModeloId = new Map<string, number[]>();
      if (!anosError && anosData) {
        for (const ar of anosData as { modelo_id: string; ano: number }[]) {
          const list = anosByModeloId.get(ar.modelo_id) ?? [];
          list.push(Number(ar.ano));
          anosByModeloId.set(ar.modelo_id, list);
        }
      }

      modelos = data.map((row) => ({
        id: row.id,
        nome: row.nome,
        marca_nome: marcaNomeFromRow(row.marcas),
        tipo_veiculo: normalizeTipoVeiculoModeloFromDb(
          (row as { tipo_veiculo?: string | null }).tipo_veiculo
        ),
        anos_referencia: sortedUniqueInts(anosByModeloId.get(row.id) ?? []),
      }));
    }

    const { data: catData, error: catError } = await supabase
      .from("categorias")
      .select("id, nome, icone")
      .order("nome");

    if (catError) {
      categoriasLoadError = catError.message;
    } else if (catData) {
      categorias = catData as CategoriaOption[];
    }

    const { data: embData, error: embError } = await supabase
      .from("embalagens")
      .select("id, nome, comprimento_cm, largura_cm, altura_cm, peso_embalagem_kg")
      .order("nome");

    if (embError) {
      embalagensLoadError = embError.message;
    } else if (embData) {
      embalagens = embData.map((row) => ({
        id: row.id,
        nome: row.nome,
        comprimento_cm: Number(row.comprimento_cm),
        largura_cm: Number(row.largura_cm),
        altura_cm: Number(row.altura_cm),
        peso_embalagem_kg: Number(row.peso_embalagem_kg),
      }));
    }

    const { data: relProdData, error: relProdError } = await supabase
      .from("produtos")
      .select("id, titulo, cod_produto")
      .order("titulo");
    if (!relProdError && relProdData) {
      produtosRelacionadosOpcoes = relProdData as ProdutoRelacionadoOption[];
    }
  } catch (e) {
    configError = e instanceof Error ? e.message : "Erro ao carregar configuração.";
  }

  return {
    modelos,
    categorias,
    embalagens,
    produtosRelacionadosOpcoes,
    configError,
    loadError,
    categoriasLoadError,
    embalagensLoadError,
  };
}
