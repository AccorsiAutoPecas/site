import { MAINTENANCE_MODE } from "@/lib/siteMaintenance";

export function SiteMaintenanceCard() {
  const isOn = MAINTENANCE_MODE;

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Modo manutenção</h2>
          <p className="mt-1 text-xs text-gray-500">
            Controle via variável `NEXT_PUBLIC_MAINTENANCE_MODE`.
          </p>
        </div>
        <span
          className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
            isOn
              ? "bg-amber-100 text-amber-900 ring-1 ring-amber-200"
              : "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200"
          }`}
        >
          {isOn ? "Ativo" : "Desativado"}
        </span>
      </div>
    </section>
  );
}
