"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { uploadCategoryIconFile } from "@/services/storage/uploadCategoryIcon";

function normalizePreviewSrc(url: string | null): string | null {
  if (!url?.trim()) return null;
  const t = url.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return t.startsWith("/") ? t : `/${t}`;
}

const fieldClass =
  "block w-full cursor-pointer rounded-lg border border-dashed border-gray-300 bg-gray-50/80 px-3 py-2 text-sm text-gray-700 transition hover:border-admin-accent hover:bg-[#1d63ed]/5 disabled:cursor-not-allowed disabled:opacity-60";

type CategoriaIconeFieldProps = {
  /** Nome do campo hidden enviado no FormData */
  name?: string;
  /** URL inicial (edição) */
  defaultUrl?: string | null;
  /** URL do arquivo anterior no storage — removida ao enviar novo arquivo */
  replaceRef?: string | null;
  disabled?: boolean;
  /** Enquanto envia ao Storage, para desabilitar o submit do formulário */
  onBusyChange?: (busy: boolean) => void;
  /** Para formulários que montam o FormData manualmente (ex.: edição na tabela) */
  onUrlChange?: (url: string | null) => void;
};

export function CategoriaIconeField({
  name = "icone",
  defaultUrl = null,
  replaceRef = null,
  disabled = false,
  onBusyChange,
  onUrlChange,
}: CategoriaIconeFieldProps) {
  const [url, setUrl] = useState<string | null>(defaultUrl?.trim() || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function setBusy(next: boolean) {
    setUploading(next);
    onBusyChange?.(next);
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const publicUrl = await uploadCategoryIconFile(file, {
        replaceRef: url ?? replaceRef ?? null,
      });
      setUrl(publicUrl);
      onUrlChange?.(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar a imagem.");
    } finally {
      setBusy(false);
    }
  }

  function clear() {
    setUrl(null);
    onUrlChange?.(null);
    setError(null);
    fileRef.current?.focus();
  }

  const preview = normalizePreviewSrc(url);

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} value={url ?? ""} />

      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white">
          {preview ? (
            <Image src={preview} alt="" width={56} height={56} className="h-full w-full object-contain" unoptimized />
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <label className={fieldClass}>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              disabled={disabled || uploading}
              onChange={onFileChange}
            />
            {uploading
              ? "Removendo fundo e enviando…"
              : "Escolher imagem (JPEG, PNG, WEBP ou GIF, máx. 5 MB). O fundo é removido automaticamente; o ícone fica em PNG como os demais."}
          </label>
          {url && (
            <button
              type="button"
              onClick={clear}
              disabled={disabled || uploading}
              className="text-xs font-medium text-gray-600 underline-offset-2 hover:text-gray-900 hover:underline disabled:opacity-50"
            >
              Remover ícone
            </button>
          )}
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
