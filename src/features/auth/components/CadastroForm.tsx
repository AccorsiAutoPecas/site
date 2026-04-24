"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { LEGAL_PRIVACY_VERSION, LEGAL_TERMS_VERSION } from "@/config/legalDocuments";
import { createClient } from "@/services/supabase/client";

import { mapSupabaseAuthError } from "../utils/mapSupabaseAuthError";
import {
  AUTH_NAME_MAX_LENGTH,
  AUTH_PASSWORD_MIN_LENGTH,
  validateCadastro,
} from "../utils/authValidation";

const inputClass =
  "mt-1 block w-full rounded-md border border-store-line bg-white px-3 py-2 text-sm text-store-navy shadow-sm outline-none transition placeholder:text-store-navy-muted/70 focus:border-store-navy focus:ring-1 focus:ring-store-navy";

export function CadastroForm() {
  const router = useRouter();
  const baseId = useId();
  const idNome = `${baseId}-nome`;
  const idEmail = `${baseId}-email`;
  const idSenha = `${baseId}-senha`;
  const idTermos = `${baseId}-termos`;
  const idPriv = `${baseId}-priv`;

  const [nomeCompleto, setNomeCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [aceitouPrivacidade, setAceitouPrivacidade] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<ReturnType<typeof validateCadastro>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const errors = validateCadastro({
      nomeCompleto,
      email,
      password,
      aceitouTermos,
      aceitouPrivacidade,
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setPending(true);
    const supabase = createClient();
    const nome = nomeCompleto.trim();
    const em = email.trim();
    const nowIso = new Date().toISOString();

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/conta")}`;

    const { data, error } = await supabase.auth.signUp({
      email: em,
      password,
      options: {
        emailRedirectTo,
        data: {
          nome_completo: nome,
          termos_aceitos_em: nowIso,
          privacidade_aceita_em: nowIso,
          versao_termos: LEGAL_TERMS_VERSION,
          versao_privacidade: LEGAL_PRIVACY_VERSION,
        },
      },
    });

    setPending(false);

    if (error) {
      setFormError(mapSupabaseAuthError(error));
      return;
    }

    if (data.user && data.session) {
      router.push("/conta");
      router.refresh();
      return;
    }

    setSuccessMessage(
      "Cadastro recebido. Se a confirmação por e-mail estiver ativa, abra o link que enviamos para ativar sua conta."
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
        <label htmlFor={idNome} className="text-sm font-medium text-store-navy">
          Nome completo
        </label>
        <input
          id={idNome}
          name="nomeCompleto"
          type="text"
          autoComplete="name"
          maxLength={AUTH_NAME_MAX_LENGTH}
          value={nomeCompleto}
          onChange={(e) => setNomeCompleto(e.target.value)}
          className={inputClass}
          aria-invalid={Boolean(fieldErrors.nomeCompleto)}
          aria-describedby={fieldErrors.nomeCompleto ? `${idNome}-err` : undefined}
        />
        {fieldErrors.nomeCompleto ? (
          <p id={`${idNome}-err`} className="mt-1 text-xs text-red-700" role="alert">
            {fieldErrors.nomeCompleto}
          </p>
        ) : null}
      </div>

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
        <label htmlFor={idSenha} className="text-sm font-medium text-store-navy">
          Senha
        </label>
        <input
          id={idSenha}
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={`${idSenha}-hint ${fieldErrors.password ? `${idSenha}-err` : ""}`}
        />
        <p id={`${idSenha}-hint`} className="mt-1 text-xs text-store-navy-muted">
          Mínimo de {AUTH_PASSWORD_MIN_LENGTH} caracteres.
        </p>
        {fieldErrors.password ? (
          <p id={`${idSenha}-err`} className="mt-1 text-xs text-red-700" role="alert">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>

      <div className="space-y-3 rounded-md border border-store-line/80 bg-store-subtle/50 p-3">
        <label className="flex cursor-pointer gap-3 text-sm leading-snug">
          <input
            id={idTermos}
            name="termos"
            type="checkbox"
            checked={aceitouTermos}
            onChange={(e) => setAceitouTermos(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-store-line text-store-navy focus:ring-store-navy"
            aria-invalid={Boolean(fieldErrors.termos)}
            aria-describedby={fieldErrors.termos ? `${idTermos}-err` : undefined}
          />
          <span>
            Li e aceito os{" "}
            <Link href="/termos" className="font-semibold text-store-navy underline underline-offset-2">
              Termos de uso
            </Link>{" "}
            (versão {LEGAL_TERMS_VERSION}).
          </span>
        </label>
        {fieldErrors.termos ? (
          <p id={`${idTermos}-err`} className="text-xs text-red-700" role="alert">
            {fieldErrors.termos}
          </p>
        ) : null}

        <label className="flex cursor-pointer gap-3 text-sm leading-snug">
          <input
            id={idPriv}
            name="privacidade"
            type="checkbox"
            checked={aceitouPrivacidade}
            onChange={(e) => setAceitouPrivacidade(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-store-line text-store-navy focus:ring-store-navy"
            aria-invalid={Boolean(fieldErrors.privacidade)}
            aria-describedby={fieldErrors.privacidade ? `${idPriv}-err` : undefined}
          />
          <span>
            Li e aceito a{" "}
            <Link href="/privacidade" className="font-semibold text-store-navy underline underline-offset-2">
              Política de Privacidade
            </Link>{" "}
            (versão {LEGAL_PRIVACY_VERSION}).
          </span>
        </label>
        {fieldErrors.privacidade ? (
          <p id={`${idPriv}-err`} className="text-xs text-red-700" role="alert">
            {fieldErrors.privacidade}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center rounded-md bg-store-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-store-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Cadastrando…" : "Criar conta"}
      </button>

      <p className="text-center text-sm text-store-navy-muted">
        Já tem conta?{" "}
        <Link href="/login" className="font-semibold text-store-navy underline underline-offset-2">
          Entrar
        </Link>
      </p>
    </form>
  );
}
