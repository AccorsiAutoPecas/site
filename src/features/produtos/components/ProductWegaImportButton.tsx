"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { LoadingDots } from "@/features/produtos/components/LoadingDots";
import { formatAnoRangeLabel } from "@/features/produtos/utils/wegaText";

type SuggestedModelo = {
  key: string;
  montadora: string;
  nomeModelo: string;
  anoInicio: number;
  anoFim: number;
  marcaId: string | null;
  needsMarca: boolean;
  sheetRows: number[];
};

type ImportOk = {
  ok: true;
  dryRun: boolean;
  totalRows: number;
  created: number;
  updated: number;
  skipped: number;
  compatLinks: number;
  unmatchedCompat: Array<{
    sheetRow: number;
    titulo: string;
    montadora: string;
    carroModelo: string;
    reason: string;
  }>;
  suggestedModelos: SuggestedModelo[];
  warnings: string[];
  errors: string[];
  sampleTitles: string[];
};

type ImportErr = { message?: string; error?: string };

type RegisterOk = {
  ok: true;
  marcasCreated: number;
  modelosCreated: number;
  anosCreated: number;
  skipped: number;
  errors: string[];
};

function confirmLabel(created: number, updated: number): string {
  const parts: string[] = [];
  if (created > 0) parts.push(`${created} produto(s)`);
  if (updated > 0) parts.push(`${updated} atualização(ões)`);
  return parts.length > 0 ? `Confirmar ${parts.join(" e ")}` : "Nada a confirmar";
}

export function ProductWegaImportButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingFile = useRef<File | null>(null);
  const [pending, setPending] = useState(false);
  const [pendingLabel, setPendingLabel] = useState("Processando");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportOk | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [registerNote, setRegisterNote] = useState<string | null>(null);

  const suggestions = preview?.suggestedModelos ?? [];

  useEffect(() => {
    if (!preview?.dryRun) return;
    setSelectedKeys(new Set((preview.suggestedModelos ?? []).map((s) => s.key)));
    setRegisterNote(null);
  }, [preview]);

  const selectedSuggestions = useMemo(
    () => suggestions.filter((s) => selectedKeys.has(s.key)),
    [suggestions, selectedKeys],
  );

  async function postFile(file: File, dryRun: boolean): Promise<ImportOk> {
    const body = new FormData();
    body.set("file", file);
    body.set("dryRun", dryRun ? "1" : "0");
    const response = await fetch("/api/admin/produtos-wega-import", {
      method: "POST",
      body,
    });
    const json = (await response.json().catch(() => null)) as ImportOk | ImportErr | null;
    if (!response.ok || !json || !("ok" in json) || !json.ok) {
      const msg =
        json && "message" in json
          ? json.message
          : json && "error" in json
            ? json.error
            : "Falha na importação.";
      throw new Error(msg ?? "Falha na importação.");
    }
    return {
      ...json,
      updated: typeof json.updated === "number" ? json.updated : 0,
      suggestedModelos: Array.isArray(json.suggestedModelos) ? json.suggestedModelos : [],
    };
  }

  async function handleFileChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setPending(true);
    setPendingLabel("Lendo planilha");
    setError(null);
    setPreview(null);
    setRegisterNote(null);
    pendingFile.current = file;
    try {
      const result = await postFile(file, true);
      setPreview(result);
    } catch (cause) {
      pendingFile.current = null;
      setError(cause instanceof Error ? cause.message : "Falha na prévia.");
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function confirmImport() {
    const file = pendingFile.current;
    if (!file) {
      setError("Selecione o arquivo novamente.");
      setPreview(null);
      return;
    }
    setPending(true);
    setPendingLabel("Importando planilha");
    setError(null);
    try {
      const result = await postFile(file, false);
      setPreview(result);
      pendingFile.current = null;
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao importar.");
    } finally {
      setPending(false);
    }
  }

  async function registerSelectedModelos() {
    if (selectedSuggestions.length === 0) {
      setError("Selecione ao menos um modelo sugerido.");
      return;
    }
    setPending(true);
    setPendingLabel("Cadastrando modelos");
    setError(null);
    setRegisterNote(null);
    try {
      const response = await fetch("/api/admin/produtos-wega-register-modelos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestions: selectedSuggestions }),
      });
      const json = (await response.json().catch(() => null)) as RegisterOk | ImportErr | null;
      if (!response.ok || !json || !("ok" in json) || !json.ok) {
        throw new Error(
          (json && "message" in json && json.message) ||
            (json && "error" in json && json.error) ||
            "Falha ao cadastrar modelos.",
        );
      }
      setRegisterNote(
        `Cadastro: ${json.marcasCreated} marca(s), ${json.modelosCreated} modelo(s), ${json.anosCreated} ano(s).` +
          (json.errors.length ? ` Avisos: ${json.errors.slice(0, 3).join(" · ")}` : ""),
      );

      const file = pendingFile.current;
      if (file) {
        const refreshed = await postFile(file, true);
        setPreview(refreshed);
      }
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao cadastrar modelos.");
    } finally {
      setPending(false);
    }
  }

  function cancelPreview() {
    setPreview(null);
    pendingFile.current = null;
    setError(null);
    setRegisterNote(null);
    setSelectedKeys(new Set());
  }

  function toggleKey(key: string) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelectedKeys(checked ? new Set(suggestions.map((s) => s.key)) : new Set());
  }

  return (
    <div className="flex flex-col items-stretch gap-1 lg:items-end">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={(event) => {
          void handleFileChange(event.target.files);
        }}
      />
      <button
        type="button"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        title="Importar planilha Kits WEGA (1 linha = 1 produto em cadastro)"
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending && !preview ? (
          <LoadingDots label={pendingLabel} size="sm" />
        ) : (
          "Importar Excel WEGA"
        )}
      </button>
      {error ? <p className="max-w-xs text-right text-xs text-red-600">{error}</p> : null}

      {pending ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4"
          role="alertdialog"
          aria-busy="true"
          aria-labelledby="wega-loading-title"
        >
          <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-xl bg-white px-6 py-8 shadow-xl">
            <p id="wega-loading-title" className="text-center text-base font-semibold text-gray-900">
              {pendingLabel}
            </p>
            <LoadingDots label="" className="justify-center" />
            <p className="text-center text-xs text-gray-500">
              Aguarde — isso pode levar alguns segundos.
            </p>
          </div>
        </div>
      ) : null}

      {preview ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wega-import-title"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
            <h2 id="wega-import-title" className="text-base font-semibold text-gray-900">
              {preview.dryRun ? "Prévia da importação WEGA" : "Importação concluída"}
            </h2>
            <ul className="mt-3 space-y-1 text-sm text-gray-700">
              <li>Linhas válidas: {preview.totalRows}</li>
              <li>
                {preview.dryRun ? "Serão criados" : "Criados"}: {preview.created}
              </li>
              <li>
                {preview.dryRun ? "Serão atualizados" : "Atualizados"}: {preview.updated}
              </li>
              <li>Sem alteração: {preview.skipped}</li>
              <li className="text-xs text-gray-500">
                Fotos, estoque e valores já preenchidos não são alterados.
              </li>
              <li>Vínculos de compatibilidade: {preview.compatLinks}</li>
              <li>Sem match de modelo: {preview.unmatchedCompat.length}</li>
            </ul>

            {registerNote ? (
              <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                {registerNote} Rode a importação de produtos quando a prévia estiver ok.
              </p>
            ) : null}

            {preview.dryRun && suggestions.length > 0 ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/80 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-amber-950">
                    Modelos sugeridos para cadastrar ({suggestions.length})
                  </p>
                  <label className="flex items-center gap-2 text-xs text-amber-900">
                    <input
                      type="checkbox"
                      checked={selectedKeys.size === suggestions.length && suggestions.length > 0}
                      onChange={(e) => toggleAll(e.target.checked)}
                    />
                    Selecionar todos
                  </label>
                </div>
                <p className="mt-1 text-xs text-amber-900/90">
                  Cadastre os modelos faltantes no catálogo e a prévia será atualizada. Depois
                  confirme a importação dos produtos.
                </p>
                <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs text-amber-950">
                  {suggestions.map((s) => (
                    <li key={s.key} className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={selectedKeys.has(s.key)}
                        onChange={() => toggleKey(s.key)}
                      />
                      <span>
                        <span className="font-medium">
                          {s.montadora} · {s.nomeModelo}
                        </span>
                        <span className="text-amber-800/90">
                          {" "}
                          · {formatAnoRangeLabel(s.anoInicio, s.anoFim)}
                          {s.needsMarca ? " · (cria marca)" : ""}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={pending || selectedSuggestions.length === 0}
                  onClick={() => {
                    void registerSelectedModelos();
                  }}
                  className="mt-3 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100 disabled:opacity-50"
                >
                  {pending
                    ? "Cadastrando…"
                    : `Cadastrar ${selectedSuggestions.length} modelo(s) sugerido(s)`}
                </button>
              </div>
            ) : null}

            {preview.sampleTitles.length > 0 ? (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Exemplos de título
                </p>
                <ul className="mt-1 max-h-28 overflow-y-auto text-xs text-gray-600">
                  {preview.sampleTitles.map((t) => (
                    <li key={t} className="truncate">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {preview.unmatchedCompat.length > 0 ? (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Sem compatibilidade ({preview.unmatchedCompat.length})
                </p>
                <ul className="mt-1 max-h-32 overflow-y-auto text-xs text-amber-900">
                  {preview.unmatchedCompat.slice(0, 40).map((u) => (
                    <li key={`${u.sheetRow}-${u.titulo}`}>
                      L{u.sheetRow}: {u.carroModelo} — {u.reason}
                    </li>
                  ))}
                  {preview.unmatchedCompat.length > 40 ? (
                    <li>… e mais {preview.unmatchedCompat.length - 40}</li>
                  ) : null}
                </ul>
              </div>
            ) : null}

            {preview.warnings.length > 0 ? (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Avisos ({preview.warnings.length})
                </p>
                <ul className="mt-1 max-h-28 overflow-y-auto text-xs text-gray-600">
                  {preview.warnings.slice(0, 20).map((warning, index) => (
                    <li key={`${index}-${warning}`}>{warning}</li>
                  ))}
                  {preview.warnings.length > 20 ? (
                    <li>… e mais {preview.warnings.length - 20}</li>
                  ) : null}
                </ul>
              </div>
            ) : null}

            {preview.errors.length > 0 ? (
              <p className="mt-2 text-xs text-red-600">{preview.errors.join(" · ")}</p>
            ) : null}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              {preview.dryRun ? (
                <>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={cancelPreview}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={pending || (preview.created === 0 && preview.updated === 0)}
                    onClick={() => {
                      void confirmImport();
                    }}
                    className="rounded-lg bg-admin-accent px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {pending ? "Importando…" : confirmLabel(preview.created, preview.updated)}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={cancelPreview}
                  className="rounded-lg bg-admin-accent px-3 py-2 text-sm font-semibold text-white"
                >
                  Fechar
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
