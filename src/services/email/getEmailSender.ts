import { consoleEmailSender } from "@/services/email/consoleEmailSender";
import { noopEmailSender } from "@/services/email/noopEmailSender";
import { createResendEmailSender } from "@/services/email/resendEmailSender";
import type { EmailSender } from "@/services/email/types";

/**
 * Escolhe o provedor por `EMAIL_PROVIDER`: `console` (padrão), `none`, `resend`.
 * `resend` exige `RESEND_API_KEY` e `EMAIL_FROM` válidos no ambiente.
 */
export function getEmailSender(): EmailSender {
  const raw = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  const provider = raw === "" || raw === undefined ? "console" : raw;

  switch (provider) {
    case "none":
      return noopEmailSender;
    case "resend":
      return createResendEmailSender();
    case "console":
      return consoleEmailSender;
    default: {
      console.warn(`[email] EMAIL_PROVIDER desconhecido (${provider}); usando console.`);
      return consoleEmailSender;
    }
  }
}
