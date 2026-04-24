"use client";

import { useState, useTransition } from "react";
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
}: {
  modeloId: string;
  nome: string;
  tipoVeiculo: string | null;
  marcaNome: string;
  anos: { id: string; ano: number }[];
  modeloAnosError: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (
      !confirm(
        `Excluir o modelo “${nome}” (${marcaNome})? As compatibilidades de produtos com este modelo e os anos de referência serão removidos. Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }
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
    <tr className="align-top text-gray-900 transition hover:bg-gray-50/80">
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
            onClick={handleDelete}
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
  );
}
