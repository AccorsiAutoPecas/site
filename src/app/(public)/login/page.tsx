import { Suspense } from "react";

import { LoginForm } from "@/features/auth/components/LoginForm";
import { AuthPageShell } from "@/features/auth/components/AuthPageShell";

function LoginFallback() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-10 rounded-md bg-store-subtle" />
      <div className="h-10 rounded-md bg-store-subtle" />
      <div className="h-10 rounded-md bg-store-navy/20" />
    </div>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const errorRaw = sp.error;
  const nextRaw = sp.next;
  const initialErrorCode = typeof errorRaw === "string" ? errorRaw : null;
  const initialNext = typeof nextRaw === "string" ? nextRaw : null;

  return (
    <AuthPageShell title="Entrar" description="Acesse sua conta com e-mail e senha.">
      <Suspense fallback={<LoginFallback />}>
        <LoginForm initialErrorCode={initialErrorCode} initialNext={initialNext} />
      </Suspense>
    </AuthPageShell>
  );
}
