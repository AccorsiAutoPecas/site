"use client";

import { useEffect, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** danger = vermelho (exclusão); neutral = azul admin */
  variant?: "danger" | "neutral";
  pending?: boolean;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  pending = false,
  onConfirm,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pending, onOpenChange]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  const confirmClass =
    variant === "danger"
      ? "rounded-lg border border-red-300 bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
      : "rounded-lg border border-[#1857d1] bg-admin-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1857d1] disabled:opacity-50";

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/50"
        disabled={pending}
        onClick={() => onOpenChange(false)}
      />
      <div
        className="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-2xl sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        <h3 id={titleId} className="text-base font-semibold text-gray-900">
          {title}
        </h3>
        <div id={descId} className="mt-2 text-sm text-gray-600">
          {description}
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={pending}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={pending} className={confirmClass}>
            {pending ? "Aguarde…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
