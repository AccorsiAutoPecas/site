import type { EmailSender, EmailSendInput, EmailSendResult } from "@/services/email/types";

type ResendCreateEmailResponse = { id?: string };

/**
 * Envio via Resend (https://resend.com). Exige `RESEND_API_KEY` e `EMAIL_FROM` no ambiente.
 */
export function createResendEmailSender(): EmailSender {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) {
    throw new Error("Resend: defina RESEND_API_KEY e EMAIL_FROM.");
  }

  return {
    async send(input: EmailSendInput): Promise<EmailSendResult> {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [input.to],
          subject: input.subject,
          text: input.text,
        }),
      });

      const json = (await res.json().catch(() => ({}))) as ResendCreateEmailResponse & {
        message?: string;
      };

      if (!res.ok) {
        return {
          ok: false,
          providerMessageId: typeof json.message === "string" ? json.message : undefined,
        };
      }

      return { ok: true, providerMessageId: json.id };
    },
  };
}
