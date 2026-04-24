import type { EmailSender, EmailSendInput, EmailSendResult } from "@/services/email/types";

function formatLogPayload(input: EmailSendInput) {
  return {
    channel: "email",
    provider: "console",
    to: input.to,
    subject: input.subject,
    body: input.text,
  };
}

/**
 * Implementação padrão em desenvolvimento: registra assunto e corpo sem falhar o fluxo.
 */
export const consoleEmailSender: EmailSender = {
  async send(input: EmailSendInput): Promise<EmailSendResult> {
    console.info("[email:console]", JSON.stringify(formatLogPayload(input)));
    return { ok: true, providerMessageId: "console" };
  },
};
