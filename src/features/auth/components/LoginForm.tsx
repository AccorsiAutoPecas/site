"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { createClient } from "@/services/supabase/client";

import { mapSupabaseAuthError } from "../utils/mapSupabaseAuthError";
import { validateLogin } from "../utils/authValidation";

const inputClass =
  "mt-1 block w-full rounded-md border border-store-line bg-white px-3 py-2 text-sm text-store-navy shadow-sm outline-none transition placeholder:text-store-navy-muted/70 focus:border-store-navy focus:ring-1 focus:ring-store-navy";

function callbackErrorMessage(code: string | null): string | null {
  if (!code) return null;
  if (code === "missing_code") {
    return "O link de acesso é inválido ou expirou. Solicite um novo e-mail ou entre com e-mail e senha.";
  }
  if (code === "auth_callback") {
    return "Não foi possível concluir o login pelo link. Tente novamente ou use e-mail e senha.";
  }
  return null;
}

type LoginFormProps = {
  initialErrorCode?: string | null;
  initialNext?: string | null;
};

export function LoginForm({ initialErrorCode, initialNext }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const baseId = useId();
  const idEmail = `${baseId}-email`;
  const idSenha = `${baseId}-senha`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ReturnType<typeof validateLogin>>({});
  const [formError, setFormError] = useState<string | null>(() => callbackErrorMessage(initialErrorCode ?? null));
  const [pending, setPending] = useState(false);

  const nextFromUrl = searchParams.get("next") ?? initialNext ?? null;

  useEffect(() => {
    const err = searchParams.get("error");
    const msg = callbackErrorMessage(err);
    if (msg) {
      setFormError(msg);
    }
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const errors = validateLogin({ email, password });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setPending(false);

    if (error) {
      setFormError(mapSupabaseAuthError(error));
      return;
    }

    const next =
      nextFromUrl && nextFromUrl.startsWith("/") && !nextFromUrl.startsWith("//") ? nextFromUrl : "/conta";
    router.push(next);
    router.refresh();
  }

  const recuperarHref =
    nextFromUrl && nextFromUrl.startsWith("/")
      ? `/recuperar-senha?next=${encodeURIComponent(nextFromUrl)}`
      : "/recuperar-senha";

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {formError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {formError}
        </p>
      ) : null}

      <div>
        <label htmlFor={idEmail} className="text-sm font-medium text-store-navy">
          E-mail
        </label>
        <input
          id={idEmail}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? `${idEmail}-err` : undefined}
        />
        {fieldErrors.email ? (
          <p id={`${idEmail}-err`} className="mt-1 text-xs text-red-700" role="alert">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor={idSenha} className="text-sm font-medium text-store-navy">
            Senha
          </label>
          <Link
            href={recuperarHref}
            className="text-xs font-semibold text-store-navy underline underline-offset-2"
          >
            Esqueci minha senha
          </Link>
        </div>
        <input
          id={idSenha}
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={fieldErrors.password ? `${idSenha}-err` : undefined}
        />
        {fieldErrors.password ? (
          <p id={`${idSenha}-err`} className="mt-1 text-xs text-red-700" role="alert">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center rounded-md bg-store-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-store-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>

      <p className="text-center text-sm text-store-navy-muted">
        Não tem conta?{" "}
        <Link
          href={nextFromUrl ? `/cadastro?next=${encodeURIComponent(nextFromUrl)}` : "/cadastro"}
          className="font-semibold text-store-navy underline underline-offset-2"
        >
          Cadastre-se
        </Link>
      </p>
    </form>
  );
}
