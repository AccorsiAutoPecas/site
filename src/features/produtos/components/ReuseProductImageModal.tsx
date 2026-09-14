"use client";

import { useCallback, useEffect, useId, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  searchProductsForImageReuse,
  type ProductImageReuseSearchItem,
} from "@/features/produtos/services/searchProductsForImageReuse";
import { reuseProductImage } from "@/features/produtos/services/reuseProductImage";

export type ReuseDestinationProduct = {
  id: string;
  titulo: string;
};

type Step = "pick" | "preview";

export function ReuseProductImageModal({
  open,
  onOpenChange,
  destinations,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  destinations: ReuseDestinationProduct[];
  onSuccess?: (message: string) => void;
}) {
  const router = useRouter();
  const titleId = useId();
  const descId = useId();
  const [step, setStep] = useState<Step>("pick");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductImageReuseSearchItem[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [source, setSource] = useState<ProductImageReuseSearchItem | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const resetState = useCallback(() => {
    setStep("pick");
    setQuery("");
    setResults([]);
    setSearchError(null);
    setSearching(false);
    setSource(null);
    setConfirmOpen(false);
    setActionError(null);
  }, []);

  useEffect(() => {
    if (!open) {
      resetState();
      return;
    }
  }, [open, resetState]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending && !confirmOpen) onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pending, confirmOpen, onOpenChange]);

  useEffect(() => {
    if (!open || step !== "pick") return;
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      setSearchError(null);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const timer = window.setTimeout(() => {
      void (async () => {
        const res = await searchProductsForImageReuse(q);
        if (cancelled) return;
        setSearching(false);
        if (!res.ok) {
          setSearchError(res.message);
          setResults([]);
          return;
        }
        setSearchError(null);
        setResults(res.items);
      })();
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, step, query]);

  const effectiveDestinations = destinations.filter((d) => d.id !== source?.id);
  const canApply = Boolean(source?.imageUrl) && effectiveDestinations.length > 0;

  const selectSource = (item: ProductImageReuseSearchItem) => {
    setActionError(null);
    if (!item.imageUrl) {
      setSource(item);
      setActionError("Este produto não possui imagem cadastrada. Escolha outro.");
      return;
    }
    setSource(item);
    setStep("preview");
  };

  const runApply = () => {
    if (!source || !canApply || pending) return;
    setConfirmOpen(false);
    setActionError(null);
    startTransition(async () => {
      const res = await reuseProductImage({
        sourceProductId: source.id,
        destinationIds: destinations.map((d) => d.id),
      });
      if (!res.ok) {
        setActionError(res.message);
        return;
      }
      onOpenChange(false);
      onSuccess?.(res.message);
      router.refresh();
    });
  };

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6">
        <button
          type="button"
          aria-label="Fechar"
          className="absolute inset-0 bg-black/50"
          disabled={pending}
          onClick={() => {
            if (!pending) onOpenChange(false);
          }}
        />
        <div
          className="relative z-10 flex max-h-[min(90vh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
        >
          <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
            <h3 id={titleId} className="text-base font-semibold text-gray-900">
              Reutilizar imagem
            </h3>
            <p id={descId} className="mt-1 text-sm text-gray-600">
              {step === "pick"
                ? "Selecione o produto que possui a imagem que deseja reutilizar."
                : "Confira a imagem e os produtos que a receberão antes de aplicar."}
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
            {step === "pick" ? (
              <div className="space-y-3">
                <label className="block">
                  <span className="sr-only">Buscar produto de origem</span>
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar por nome ou código"
                    autoFocus
                    disabled={pending}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none ring-admin-accent placeholder:text-gray-400 focus:ring-2"
                  />
                </label>
                {searching && <p className="text-xs text-gray-500">Buscando…</p>}
                {searchError && (
                  <p className="text-xs text-red-700" role="alert">
                    {searchError}
                  </p>
                )}
                {actionError && step === "pick" && (
                  <p className="text-xs text-red-700" role="alert">
                    {actionError}
                  </p>
                )}
                {!searching && query.trim().length > 0 && results.length === 0 && !searchError && (
                  <p className="text-sm text-gray-500">Nenhum produto encontrado.</p>
                )}
                {results.length > 0 && (
                  <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                    {results.map((item) => {
                      const selected = source?.id === item.id;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => selectSource(item)}
                            className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-gray-50 disabled:opacity-50 ${
                              selected ? "bg-blue-50" : ""
                            }`}
                          >
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-white">
                              {item.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.imageUrl}
                                  alt=""
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <span className="text-[10px] text-gray-400">Sem foto</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-gray-900">
                                {item.titulo}
                              </p>
                              <p className="truncate font-mono text-xs text-gray-600">
                                {item.cod_produto}
                              </p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Imagem que será reutilizada
                  </p>
                  <div className="mt-2 flex h-28 w-28 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                    {source?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={source.imageUrl}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">Sem foto</span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-gray-900">Produto de origem:</span>{" "}
                  {source?.titulo ?? "—"}
                </p>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Produtos que receberão a imagem:
                  </p>
                  <ul className="mt-2 max-h-40 list-disc space-y-1 overflow-y-auto pl-5 text-sm text-gray-700">
                    {effectiveDestinations.map((d) => (
                      <li key={d.id}>{d.titulo}</li>
                    ))}
                  </ul>
                  {destinations.some((d) => d.id === source?.id) && (
                    <p className="mt-2 text-xs text-gray-500">
                      O produto de origem estava na seleção e será ignorado.
                    </p>
                  )}
                </div>
                {!source?.imageUrl && (
                  <p className="text-sm text-red-700" role="alert">
                    O produto de origem não possui imagem. Volte e escolha outro.
                  </p>
                )}
                {actionError && (
                  <p className="text-sm text-red-700" role="alert">
                    {actionError}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {step === "preview" && (
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setStep("pick");
                  setActionError(null);
                }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Voltar
              </button>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            {step === "preview" && (
              <button
                type="button"
                disabled={pending || !canApply}
                onClick={() => setConfirmOpen(true)}
                className="rounded-lg border border-[#1857d1] bg-admin-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1857d1] disabled:opacity-50"
              >
                Aplicar imagem
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(next) => {
          if (!pending) setConfirmOpen(next);
        }}
        title="Confirmar reutilização"
        variant="neutral"
        confirmLabel="Sim, aplicar imagem"
        cancelLabel="Cancelar"
        pending={pending}
        description={
          <p>
            Você está prestes a aplicar esta imagem em{" "}
            <strong className="text-gray-800">{effectiveDestinations.length}</strong> produto
            {effectiveDestinations.length === 1 ? "" : "s"}. As imagens atuais desses produtos serão
            substituídas. Deseja continuar?
          </p>
        }
        onConfirm={runApply}
      />
    </>,
    document.body
  );
}
