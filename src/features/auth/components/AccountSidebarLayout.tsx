"use client";

import { useState, type ReactNode } from "react";

export type AccountSectionId = "conta" | "pedidos" | "garagem" | "suporte";

const sections: { id: AccountSectionId; label: string }[] = [
  { id: "conta", label: "Perfil" },
  { id: "pedidos", label: "Pedidos" },
  { id: "garagem", label: "Garagem" },
  { id: "suporte", label: "Suporte" },
];

export function AccountSidebarLayout({
  conta,
  pedidos,
  garagem,
  suporte,
  initialSection = "conta",
}: {
  conta: ReactNode;
  pedidos: ReactNode;
  garagem: ReactNode;
  suporte: ReactNode;
  initialSection?: AccountSectionId;
}) {
  const [active, setActive] = useState<AccountSectionId>(initialSection);

  const navId = "conta-sidebar-nav";
  const panelLabel = sections.find((s) => s.id === active)?.label ?? "";

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
      <nav
        id={navId}
        className="shrink-0 lg:w-52"
        aria-label="Seções da conta"
      >
        <ul className="flex flex-col gap-0.5 rounded-xl border border-store-line/80 bg-store-subtle/35 p-1.5 lg:border-0 lg:bg-transparent lg:p-0">
          {sections.map(({ id, label }) => {
            const isActive = active === id;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => setActive(id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                    isActive
                      ? "bg-white text-store-navy shadow-sm ring-1 ring-store-line/80 lg:bg-store-subtle/90 lg:ring-0"
                      : "text-store-navy-muted hover:bg-white/80 hover:text-store-navy lg:hover:bg-store-subtle/50"
                  }`}
                >
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="min-w-0 flex-1 border-t border-store-line/70 pt-6 lg:border-l lg:border-t-0 lg:pt-0 lg:pl-10">
        <h2 className="sr-only">{panelLabel}</h2>
        <div hidden={active !== "conta"}>
          {conta}
        </div>
        <div hidden={active !== "pedidos"} className="space-y-6">
          {pedidos}
        </div>
        <div hidden={active !== "garagem"} className="space-y-6">
          {garagem}
        </div>
        <div hidden={active !== "suporte"} className="space-y-6">
          {suporte}
        </div>
      </div>
    </div>
  );
}
