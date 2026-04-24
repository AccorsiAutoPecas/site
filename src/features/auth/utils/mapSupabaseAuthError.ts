import type { AuthError } from "@supabase/supabase-js";

/** Mensagens amigáveis para erros comuns do GoTrue (mensagens em inglês no cliente). */
export function mapSupabaseAuthError(error: AuthError | null): string {
  if (!error) {
    return "Não foi possível concluir a operação. Tente novamente.";
  }
  const msg = (error.message || "").toLowerCase();

  if (msg.includes("invalid login credentials") || msg.includes("invalid credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (msg.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar. Verifique a caixa de entrada e o spam.";
  }
  if (msg.includes("user already registered") || msg.includes("already been registered")) {
    return "Este e-mail já está cadastrado. Faça login ou use outro e-mail.";
  }
  if (msg.includes("password") && msg.includes("least")) {
    return "A senha não atende às regras definidas pelo sistema. Tente uma senha mais forte.";
  }
  if (msg.includes("rate limit") || msg.includes("too many")) {
    return "Muitas tentativas. Aguarde um momento e tente de novo.";
  }

  return error.message || "Não foi possível concluir a operação. Tente novamente.";
}
