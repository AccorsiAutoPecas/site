/**
 * Dados do remetente para POST /api/v2/me/cart (Melhor Envio).
 * Preencha no .env.local — obrigatório para gerar etiquetas pelo admin sem ir ao site ME.
 */

export type MelhorEnvioRemetenteFromEnv = {
  name: string;
  email: string;
  phone: string;
  document: string;
  company_document: string;
  state_register: string;
  economic_activity_code: string;
  address: string;
  complement: string;
  number: string;
  district: string;
  city: string;
  postal_code: string;
  state_abbr: string;
  country_id: string;
};

function req(key: string): string {
  return process.env[key]?.trim() ?? "";
}

/** Apenas dígitos (CEP, CPF, CNPJ, telefone). */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Lê MELHOR_ENVIO_FROM_* do ambiente. Retorna erro legível se faltar campo obrigatório.
 */
export function getMelhorEnvioRemetenteFromEnv():
  | { ok: true; from: MelhorEnvioRemetenteFromEnv }
  | { ok: false; message: string } {
  const name = req("MELHOR_ENVIO_FROM_NAME");
  const phone = onlyDigits(req("MELHOR_ENVIO_FROM_PHONE"));
  const email = req("MELHOR_ENVIO_FROM_EMAIL");
  const document = onlyDigits(req("MELHOR_ENVIO_FROM_DOCUMENT"));
  const company_document = onlyDigits(req("MELHOR_ENVIO_FROM_COMPANY_DOCUMENT"));
  const state_register = req("MELHOR_ENVIO_FROM_STATE_REGISTER");
  const economic_activity_code = req("MELHOR_ENVIO_FROM_ECONOMIC_ACTIVITY_CODE");
  const address = req("MELHOR_ENVIO_FROM_ADDRESS");
  const complement = req("MELHOR_ENVIO_FROM_COMPLEMENT");
  const number = req("MELHOR_ENVIO_FROM_NUMBER");
  const district = req("MELHOR_ENVIO_FROM_DISTRICT");
  const city = req("MELHOR_ENVIO_FROM_CITY");
  const postal_code = onlyDigits(req("MELHOR_ENVIO_FROM_POSTAL_CODE"));
  const state_abbr = req("MELHOR_ENVIO_FROM_STATE_ABBR").toUpperCase().slice(0, 2);
  const country_id = (req("MELHOR_ENVIO_FROM_COUNTRY_ID") || "BR").toUpperCase().slice(0, 2);

  const missing: string[] = [];
  if (!name) missing.push("MELHOR_ENVIO_FROM_NAME");
  if (!phone || phone.length < 10) missing.push("MELHOR_ENVIO_FROM_PHONE");
  if (!address) missing.push("MELHOR_ENVIO_FROM_ADDRESS");
  if (!number) missing.push("MELHOR_ENVIO_FROM_NUMBER");
  if (!district) missing.push("MELHOR_ENVIO_FROM_DISTRICT");
  if (!city) missing.push("MELHOR_ENVIO_FROM_CITY");
  if (postal_code.length !== 8) missing.push("MELHOR_ENVIO_FROM_POSTAL_CODE (8 dígitos)");
  if (state_abbr.length !== 2) missing.push("MELHOR_ENVIO_FROM_STATE_ABBR");

  const isPj = company_document.length >= 14;
  if (isPj) {
    /* CNPJ já validado por length >= 14 */
  } else if (document.length !== 11) {
    missing.push("MELHOR_ENVIO_FROM_DOCUMENT (CPF 11 dígitos) ou MELHOR_ENVIO_FROM_COMPANY_DOCUMENT (CNPJ)");
  }

  if (missing.length) {
    return {
      ok: false,
      message: `Configure o remetente Melhor Envio no servidor: ${missing.join(", ")}.`,
    };
  }

  const from: MelhorEnvioRemetenteFromEnv = {
    name,
    email: email || "nao-informado@remetente.local",
    phone,
    document: isPj ? "" : document,
    company_document: isPj ? company_document : "",
    state_register: state_register || (isPj ? "" : ""),
    economic_activity_code,
    address,
    complement,
    number,
    district,
    city,
    postal_code,
    state_abbr,
    country_id,
  };

  return { ok: true, from };
}
