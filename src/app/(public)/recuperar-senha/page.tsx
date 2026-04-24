import { Suspense } from "react";

import { RecuperarSenhaForm } from "@/features/auth/components/RecuperarSenhaForm";
import { AuthPageShell } from "@/features/auth/components/AuthPageShell";

function RecuperarFallback() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-16 rounded-md bg-store-subtle" />
      <div className="h-10 rounded-md bg-store-subtle" />
      <div className="h-10 rounded-md bg-store-navy/20" />
    </div>
  );
}

export default function RecuperarSenhaPage() {
  return (
    <AuthPageShell
      title="Recuperar senha"
      description="Informe o e-mail da sua conta. Enviaremos um link para redefinir a senha."
    >
      <Suspense fallback={<RecuperarFallback />}>
        <RecuperarSenhaForm />
      </Suspense>
    </AuthPageShell>
  );
}
