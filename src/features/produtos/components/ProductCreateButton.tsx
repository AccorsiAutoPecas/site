"use client";

import { useTransition } from "react";

import { LoadingDots } from "@/features/produtos/components/LoadingDots";
import { createDraftProduct } from "@/features/produtos/services/createDraftProduct";

type ProductCreateButtonProps = {
  disabled?: boolean;
};

export function ProductCreateButton({ disabled = false }: ProductCreateButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={() => {
        startTransition(async () => {
          await createDraftProduct();
        });
      }}
      className="inline-flex min-w-[11.5rem] items-center justify-center gap-2 rounded-lg bg-admin-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1857d1] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? (
        <LoadingDots label="Cadastrando" size="sm" dotClassName="bg-white" className="text-white" />
      ) : (
        "Cadastrar novo produto"
      )}
    </button>
  );
}
