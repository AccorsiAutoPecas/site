export const TIPOS_VEICULO_MODELO = ["carro", "moto", "caminhao"] as const;

export type TipoVeiculoModelo = (typeof TIPOS_VEICULO_MODELO)[number];

export const TIPO_VEICULO_MODELO_LABELS: Record<TipoVeiculoModelo, string> = {
  carro: "Carro",
  moto: "Moto",
  caminhao: "Caminhão",
};

export function parseTipoVeiculoModelo(raw: string): TipoVeiculoModelo | null {
  const v = raw.trim().toLowerCase();
  return (TIPOS_VEICULO_MODELO as readonly string[]).includes(v) ? (v as TipoVeiculoModelo) : null;
}

export function normalizeTipoVeiculoModeloFromDb(value: unknown): TipoVeiculoModelo {
  const parsed = parseTipoVeiculoModelo(String(value ?? ""));
  return parsed ?? "carro";
}
