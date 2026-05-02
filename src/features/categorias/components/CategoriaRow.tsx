"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteCategoria, updateCategoria } from "@/features/categorias/services/categoriaActions";
import { CategoriaIconeField } from "@/features/categorias/components/CategoriaIconeField";

const fieldClass =
  "w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-admin-accent focus:ring-2 focus:ring-[#1d63ed]/20";

const iconBtn =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition disabled:opacity-50";

function thumbSrc(icone: string | null): string | null {
  if (!icone?.trim()) return null;
  const t = icone.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return t.startsWith("/") ? t : `/${t}`;
}

export function CategoriaRow({
  categoria,
}: {
  categoria: { id: string; nome: string; icone: string | null };
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [nome, setNome] = useState(categoria.nome);
  const [iconeDraft, setIconeDraft] = useState<string | null>(categoria.icone);
  const [iconBusy, setIconBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function cancelEdit() {
    setNome(categoria.nome);
    setIconeDraft(categoria.icone);
    setEditing(false);
    setError(null);
  }

  function handleSave() {
    setError(null);
    const fd = new FormData();
    fd.set("id", categoria.id);
    fd.set("nome", nome.trim());
    fd.set("icone", iconeDraft ?? "");
    startTransition(async () => {
      const r = await updateCategoria(fd);
      if (r.ok === false) {
        setError(r.message);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  function runDelete() {
    setDeleteOpen(false);
    setError(null);
    startTransition(async () => {
      const r = await deleteCategoria(categoria.id);
      if (r.ok === false) {
        setError(r.message);
        return;
      }
      router.refresh();
    });
  }

  const thumb = thumbSrc(categoria.icone);

  return (
    <>
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir categoria?"
        description={
          <>
            Excluir a categoria <strong className="text-gray-800">“{categoria.nome}”</strong>? Os vínculos com
            produtos serão removidos.
          </>
        }
        confirmLabel="Sim, excluir"
        onConfirm={runDelete}
      />
    <tr className="text-gray-900 transition hover:bg-gray-50/80">
      <td className="w-14 px-4 py-3.5 align-middle">
        {!editing && (
          <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-white">
            {thumb ? (
              <Image
                src={thumb}
                alt=""
                width={40}
                height={40}
                className="h-full w-full object-contain"
                unoptimized
              />
            ) : (
              <span className="text-[10px] text-gray-300">—</span>
            )}
          </span>
        )}
      </td>
      <td className="px-6 py-3.5">
        {editing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={fieldClass}
              disabled={pending || iconBusy}
              autoFocus
              aria-label="Nome da categoria"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (!pending && !iconBusy) handleSave();
                }
                if (e.key === "Escape") cancelEdit();
              }}
            />
            <div>
              <p className="mb-1 text-xs font-medium text-gray-600">Ícone</p>
              <CategoriaIconeField
                key={categoria.id}
                defaultUrl={categoria.icone}
                replaceRef={categoria.icone}
                disabled={pending}
                onBusyChange={setIconBusy}
                onUrlChange={setIconeDraft}
              />
            </div>
          </div>
        ) : (
          <span className="font-medium">{categoria.nome}</span>
        )}
        {error && (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
      </td>
      <td className="w-[1%] whitespace-nowrap px-4 py-3.5">
        <div className="flex items-center justify-end gap-0.5">
          {editing ? (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={pending || iconBusy}
                className={`${iconBtn} text-emerald-700 hover:bg-emerald-50`}
                aria-label="Salvar"
                title="Salvar"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={pending || iconBusy}
                className={`${iconBtn} text-gray-600 hover:bg-gray-100`}
                aria-label="Cancelar edição"
                title="Cancelar"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setNome(categoria.nome);
                  setIconeDraft(categoria.icone);
                  setEditing(true);
                }}
                disabled={pending}
                className={`${iconBtn} text-admin-accent hover:bg-[#1d63ed]/10`}
                aria-label="Editar categoria"
                title="Editar"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                disabled={pending}
                className={`${iconBtn} text-red-600 hover:bg-red-50`}
                aria-label="Excluir categoria"
                title="Excluir"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
    </>
  );
}
