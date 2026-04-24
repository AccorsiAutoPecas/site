import { redirect } from "next/navigation";

/**
 * Login do painel usa o mesmo fluxo da loja; esta rota apenas preserva URLs amigáveis
 * e encaminha para /login com retorno ao admin.
 */
export default function AdminLoginRedirectPage() {
  redirect("/login?next=%2Fadmin");
}
