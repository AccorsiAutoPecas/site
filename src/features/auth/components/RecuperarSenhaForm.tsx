"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";

import { createClient } from "@/services/supabase/client";

import { mapSupabaseAuthError } from "../utils/mapSupabaseAuthError";
import { validateRecuperarSenhaEmail } from "../utils/authValidation";

const inputClass =
  "mt-1 block w-full rounded-md border border-store-line bg-white px-3 py-2 text-sm text-store-navy shadow-sm outline-none transition placeholder:text-store-navy-muted/70 focus:border-store-navy focus:ring-1 focus:ring-store-navy";

export function RecuperarSenhaForm() {
  const searchParams = useSearchParams();
  const baseId = useId();
  const idEmail = `${baseId}-email`;

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const nextParam = searchParams.get("next");
  const loginHref =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? `/login?next=${encodeURIComponent(nextParam)}`
      : "/login";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const err = validateRecuperarSenhaEmail(email);
    setEmailError(err);
    if (err) {
      return;
    }

    setPending(true);
    const supabase = createClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/conta")}`;

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
    setPending(false);

    if (error) {
      setFormError(mapSupabaseAuthError(error));
      return;
    }

    setSuccessMessage(
      "Se existir uma conta para este e-mail, enviamos um link para redefinir a senha. Verifique a caixa de entrada e o spam."
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <p className="text-sm leading-relaxed text-store-navy-muted">
        Usamos seu e-mail apenas para enviar o link de recuperação, conforme nossa{" "}
        <Link href="/privacidade" className="font-semibold text-store-navy underline underline-offset-2">
          Política de Privacidade
        </Link>
        .
      </p>

      {formError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {formError}
        </p>
      ) : null}
      {successMessage ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
          {successMessage}
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
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? `${idEmail}-err` : undefined}
        />
        {emailError ? (
          <p id={`${idEmail}-err`} className="mt-1 text-xs text-red-700" role="alert">
            {emailError}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center rounded-md bg-store-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-store-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Enviar link"}
      </button>

      <p className="text-center text-sm text-store-navy-muted">
        <Link href={loginHref} className="font-semibold text-store-navy underline underline-offset-2">
          Voltar ao login
        </Link>
      </p>
    </form>
  );
}
