import type { ProfileEndereco } from "@/types/profileDelivery";

const EMAIL_RE =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const AUTH_PASSWORD_MIN_LENGTH = 8;
export const AUTH_NAME_MAX_LENGTH = 200;

export type CadastroFieldErrors = Partial<{
  nomeCompleto: string;
  email: string;
  password: string;
  termos: string;
  privacidade: string;
}>;

export function validateCadastro(input: {
  nomeCompleto: string;
  email: string;
  password: string;
  aceitouTermos: boolean;
  aceitouPrivacidade: boolean;
}): CadastroFieldErrors {
  const errors: CadastroFieldErrors = {};
  const nome = input.nomeCompleto.trim();
  if (!nome) {
    errors.nomeCompleto = "Informe seu nome completo.";
  } else if (nome.length > AUTH_NAME_MAX_LENGTH) {
    errors.nomeCompleto = `Use no máximo ${AUTH_NAME_MAX_LENGTH} caracteres.`;
  }

  const email = input.email.trim();
  if (!email) {
    errors.email = "Informe seu e-mail.";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "E-mail inválido.";
  }

  if (!input.password) {
    errors.password = "Informe uma senha.";
  } else if (input.password.length < AUTH_PASSWORD_MIN_LENGTH) {
    errors.password = `A senha deve ter pelo menos ${AUTH_PASSWORD_MIN_LENGTH} caracteres.`;
  }

  if (!input.aceitouTermos) {
    errors.termos = "Você precisa aceitar os Termos de uso.";
  }
  if (!input.aceitouPrivacidade) {
    errors.privacidade = "Você precisa aceitar a Política de Privacidade.";
  }

  return errors;
}

export type LoginFieldErrors = Partial<{
  email: string;
  password: string;
}>;

export function validateLogin(input: { email: string; password: string }): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  const email = input.email.trim();
  if (!email) {
    errors.email = "Informe seu e-mail.";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "E-mail inválido.";
  }
  if (!input.password) {
    errors.password = "Informe sua senha.";
  }
  return errors;
}

export function validateRecuperarSenhaEmail(email: string): string | undefined {
  const t = email.trim();
  if (!t) {
    return "Informe seu e-mail.";
  }
  if (!EMAIL_RE.test(t)) {
    return "E-mail inválido.";
  }
  return undefined;
}

/** Nome completo do perfil (cadastro / conta). */
export function validateNomeCompleto(raw: string): string | undefined {
  const nome = raw.trim();
  if (!nome) {
    return "Informe seu nome completo.";
  }
  if (nome.length > AUTH_NAME_MAX_LENGTH) {
    return `Use no máximo ${AUTH_NAME_MAX_LENGTH} caracteres.`;
  }
  return undefined;
}

const ADDR_MAX = 200;

/** CEP com ou sem máscara → só dígitos (até 8). */
export function parseCepDigits(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 8);
}

/** True quando todos os campos estão vazios — permite remover o endereço salvo. */
export function wantsClearProfileEndereco(input: ProfileEndereco): boolean {
  const cep = parseCepDigits(input.cep);
  const tel = input.telefone.replace(/\D/g, "");
  return (
    !tel &&
    !cep &&
    !input.logradouro.trim() &&
    !input.numero.trim() &&
    !input.complemento.trim() &&
    !input.bairro.trim() &&
    !input.cidade.trim() &&
    !input.uf.trim()
  );
}

/** Valida endereço completo para salvar no perfil. */
export function validateProfileEndereco(
  input: ProfileEndereco,
): Partial<Record<keyof ProfileEndereco, string>> {
  const errors: Partial<Record<keyof ProfileEndereco, string>> = {};
  const cepDigits = parseCepDigits(input.cep);
  const telDigits = input.telefone.replace(/\D/g, "");

  if (!input.telefone.trim()) {
    errors.telefone = "Informe o telefone.";
  } else if (telDigits.length < 10 || telDigits.length > 11) {
    errors.telefone = "Informe um telefone válido (DDD + número).";
  }

  if (!cepDigits) {
    errors.cep = "Informe o CEP.";
  } else if (cepDigits.length !== 8) {
    errors.cep = "CEP deve ter 8 dígitos.";
  }

  if (!input.logradouro.trim()) {
    errors.logradouro = "Informe o logradouro.";
  } else if (input.logradouro.length > ADDR_MAX) {
    errors.logradouro = `Use no máximo ${ADDR_MAX} caracteres.`;
  }

  if (!input.numero.trim()) {
    errors.numero = "Informe o número.";
  } else if (input.numero.length > 32) {
    errors.numero = "Número muito longo.";
  }

  if (input.complemento.length > ADDR_MAX) {
    errors.complemento = `Use no máximo ${ADDR_MAX} caracteres.`;
  }

  if (!input.bairro.trim()) {
    errors.bairro = "Informe o bairro.";
  } else if (input.bairro.length > ADDR_MAX) {
    errors.bairro = `Use no máximo ${ADDR_MAX} caracteres.`;
  }

  if (!input.cidade.trim()) {
    errors.cidade = "Informe a cidade.";
  } else if (input.cidade.length > ADDR_MAX) {
    errors.cidade = `Use no máximo ${ADDR_MAX} caracteres.`;
  }

  const uf = input.uf.trim().toUpperCase();
  if (!uf) {
    errors.uf = "Informe a UF.";
  } else if (!/^[A-Z]{2}$/.test(uf)) {
    errors.uf = "UF inválida.";
  }

  return errors;
}
