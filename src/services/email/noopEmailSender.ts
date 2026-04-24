import type { EmailSender, EmailSendResult } from "@/services/email/types";

export const noopEmailSender: EmailSender = {
  async send(): Promise<EmailSendResult> {
    return { ok: true };
  },
};
