"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteModelo } from "@/features/compatibilidade/services/modeloActions";
import { ModeloAnosCell } from "@/features/compatibilidade/components/ModeloAnosCell";
import {
  TIPO_VEICULO_MODELO_LABELS,
  normalizeTipoVeiculoModeloFromDb,
} from "@/features/compatibilidade/constants/tipoVeiculoModelo";

const iconBtn =
  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition disabled:opacity-50";

export function ModeloTableRow({
  modeloId,
  nome,
  tipoVeiculo,
  marcaNome,
  anos,
  modeloAnosError,
  bulkCheckbox,
}: {
  modeloId: string;
  nome: string;
  tipoVeiculo: string | null;
  marcaNome: string;
  anos: { id: string; ano: number }[];
  modeloAnosError: boolean;
  bulkCheckbox?: { checked: boolean; onChange: (checked: boolean) => void };
}) {
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function runDelete() {
    setDeleteOpen(false);
    setError(null);
    startTransition(async () => {
      const r = await deleteModelo(modeloId);
      if (r.ok === false) {
        setError(r.message);
      }
    });
  }

  const tipoLabel = TIPO_VEICULO_MODELO_LABELS[normalizeTipoVeiculoModeloFromDb(tipoVeiculo)];

  return (
    <>
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir modelo?"
        description={
          <>
            Excluir o modelo <strong className="text-gray-800">“{nome}”</strong> ({marcaNome})? As
            compatibilidades de produtos com este modelo e os anos de referência serão removidos.{" "}
            <span className="font-medium text-gray-800">Esta ação não pode ser desfeita.</span>
          </>
        }
        confirmLabel="Sim, excluir"
        onConfirm={runDelete}
      />
    <tr className="align-top text-gray-900 transition hover:bg-gray-50/80">
      {bulkCheckbox && (
        <td className="w-[1%] px-3 py-2 align-middle">
          <input
            type="checkbox"
            checked={bulkCheckbox.checked}
            onChange={(e) => bulkCheckbox.onChange(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-gray-300 text-admin-accent focus:ring-admin-accent"
            aria-label={`Selecionar modelo ${nome}`}
          />
        </td>
      )}
      <td className="px-4 py-2">{marcaNome}</td>
      <td className="px-4 py-2 font-medium">
        {nome}
        {error && (
          <p className="mt-1 text-xs font-normal text-red-600" role="alert">
            {error}
          </p>
        )}
      </td>
      <td className="px-4 py-2 text-gray-700">{tipoLabel}</td>
      <td className="px-4 py-2">
        {!modeloAnosError ? (
          <ModeloAnosCell modeloId={modeloId} anos={anos} />
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
      <td className="w-[1%] whitespace-nowrap px-3 py-2">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            disabled={pending}
            className={`${iconBtn} text-red-600 hover:bg-red-50`}
            aria-label="Excluir modelo"
            title="Excluir"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </td>
    </tr>
    </>
  );
}
