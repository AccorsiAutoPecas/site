"use client";

import { useId, useState } from "react";

const inputClass =
  "mt-1 block w-full rounded-md border border-store-line bg-white px-3 py-2 text-sm text-store-navy shadow-sm outline-none transition placeholder:text-store-navy-muted/70 focus:border-store-navy focus:ring-1 focus:ring-store-navy";

const CONFIRM = "EXCLUIR";

export function DeleteAccountSection() {
  const baseId = useId();
  const idConfirm = `${baseId}-confirm`;
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/conta/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ confirmation: value.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };

      if (!res.ok) {
        setError(data.message ?? "Não foi possível excluir a conta. Tente de novo.");
        return;
      }

      window.location.assign("/");
    } catch {
      setError("Erro de rede. Verifique sua conexão e tente de novo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-lg border border-red-200/80 bg-red-50/40 p-4">
      <p className="text-sm font-medium text-store-navy">Excluir conta</p>
      <p className="mt-2 text-sm text-store-navy-muted">
        Esta ação é permanente: seu cadastro e dados de perfil vinculados a esta conta serão apagados,
        conforme o direito ao esquecimento (LGPD). Pedidos e histórico futuros poderão ser tratados em
        políticas específicas quando existirem.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}
        <div>
          <label htmlFor={idConfirm} className="text-sm font-medium text-store-navy">
            Digite {CONFIRM} para confirmar
          </label>
          <input
            id={idConfirm}
            name="confirmation"
            type="text"
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={inputClass}
            aria-invalid={Boolean(error)}
            aria-describedby={`${idConfirm}-hint`}
            disabled={pending}
          />
          <p id={`${idConfirm}-hint`} className="mt-1 text-xs text-store-navy-muted">
            O texto deve ser exatamente <span className="font-mono">{CONFIRM}</span>, em maiúsculas.
          </p>
        </div>
        <button
          type="submit"
          disabled={pending || value.trim() !== CONFIRM}
          className="rounded-md border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-900 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Excluindo…" : "Excluir minha conta permanentemente"}
        </button>
      </form>
    </div>
  );
}
