export type CepLookupAddress = {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
};

function cepDigits(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 8);
}

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

export async function lookupCep(rawCep: string, signal?: AbortSignal): Promise<CepLookupAddress | null> {
  const cep = cepDigits(rawCep);
  if (cep.length !== 8) {
    return null;
  }

  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal });
  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as ViaCepResponse;
  if (data.erro) {
    return null;
  }

  return {
    cep,
    logradouro: (data.logradouro ?? "").trim(),
    bairro: (data.bairro ?? "").trim(),
    cidade: (data.localidade ?? "").trim(),
    uf: (data.uf ?? "").trim().toUpperCase(),
  };
}
