export type {
  EmailSendInput,
  EmailSendResult,
  EmailSender,
  TransactionalEmailKind,
  TransactionalEmailPayload,
} from "@/services/email/types";

export { buildPedidoTransactionalContent } from "@/services/email/buildPedidoEmail";
export { consoleEmailSender } from "@/services/email/consoleEmailSender";
export { getEmailSender } from "@/services/email/getEmailSender";
export { noopEmailSender } from "@/services/email/noopEmailSender";
export { createResendEmailSender } from "@/services/email/resendEmailSender";
export { buildPedidoAbsoluteUrl, resolvePublicAppBaseUrl } from "@/services/email/publicAppUrl";
export { sendPedidoTransactionalEmail } from "@/services/email/transactionalPedidoEmail";
