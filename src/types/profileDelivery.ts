/** Endereço de entrega salvo em `profiles` (pré-preenchimento do checkout). */
export type ProfileEndereco = {
  telefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
};

export const emptyProfileEndereco = (): ProfileEndereco => ({
  telefone: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
});

/** Exibe CEP salvo (8 dígitos) com máscara; repassa entrada parcial sem máscara. */
export function formatCepDisplay(stored: string | null | undefined): string {
  const d = String(stored ?? "")
    .replace(/\D/g, "")
    .slice(0, 8);
  if (d.length !== 8) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

/** Converte linha `profiles` (ou null) em valores para formulários. */
export function profileRowToEndereco(
  row: {
    telefone?: string | null;
    cep?: string | null;
    logradouro?: string | null;
    numero?: string | null;
    complemento?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    uf?: string | null;
  } | null,
): ProfileEndereco {
  if (!row) return emptyProfileEndereco();
  return {
    telefone: row.telefone ?? "",
    cep: formatCepDisplay(row.cep),
    logradouro: row.logradouro ?? "",
    numero: row.numero ?? "",
    complemento: row.complemento ?? "",
    bairro: row.bairro ?? "",
    cidade: row.cidade ?? "",
    uf: row.uf ?? "",
  };
}
