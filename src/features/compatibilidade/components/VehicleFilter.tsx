"use client";

import Image from "next/image";
import { Suspense, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { TipoVeiculoModelo } from "@/features/compatibilidade/constants/tipoVeiculoModelo";
import type {
  VehicleFilterAnosByModelo,
  VehicleFilterMarca,
  VehicleFilterModelo,
} from "@/features/compatibilidade/services/getVehicleFilterCatalogData";
import { storeShellContent, storeShellInset } from "@/config/storeShell";
import { StoreProductSearchBar } from "@/components/store/StoreProductSearchBar";
import { PlateVehicleFinder } from "@/features/compatibilidade/components/PlateVehicleFinder";

type VehicleCategory = "carros" | "caminhoes";

const TABS: { id: VehicleCategory; label: string }[] = [
  { id: "carros", label: "Carros" },
  { id: "caminhoes", label: "Caminhões" },
];

const TAB_TO_TIPO: Record<VehicleCategory, TipoVeiculoModelo> = {
  carros: "carro",
  caminhoes: "caminhao",
};

function tipoToTab(t: TipoVeiculoModelo): VehicleCategory {
  if (t === "caminhao") return "caminhoes";
  return "carros";
}

const TAB_ICON_SRC: Record<VehicleCategory, string> = {
  carros: "/home/filtro/carro.png",
  caminhoes: "/home/filtro/caminhao.png",
};

const TAB_ICON_PX = 40;

/** Título do filtro no modal mobile (singular / claro). */
const FILTER_KIND_LABEL: Record<VehicleCategory, string> = {
  carros: "carro",
  caminhoes: "caminhão",
};

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15 15l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

const selectClass =
  "w-full appearance-none rounded-xl border border-store-line/80 bg-store-subtle px-3.5 py-2.5 pr-10 text-sm text-store-navy shadow-sm outline-none transition focus:border-store-navy-muted focus:ring-2 focus:ring-store-navy/20";

const tabIndex = (id: VehicleCategory) => TABS.findIndex((t) => t.id === id);

type VehicleFilterFieldsProps = {
  idSuffix: string;
  baseId: string;
  selectClass: string;
  marcaId: string;
  modeloId: string;
  ano: string;
  marcasFiltradas: VehicleFilterMarca[];
  modelosFiltrados: VehicleFilterModelo[];
  anosDisponiveis: number[];
  canSearch: boolean;
  onMarcaChange: (id: string) => void;
  onModeloChange: (id: string) => void;
  onAnoChange: (v: string) => void;
  onApply: () => void;
};

function VehicleFilterFields({
  idSuffix,
  baseId,
  selectClass,
  marcaId,
  modeloId,
  ano,
  marcasFiltradas,
  modelosFiltrados,
  anosDisponiveis,
  canSearch,
  onMarcaChange,
  onModeloChange,
  onAnoChange,
  onApply,
}: VehicleFilterFieldsProps) {
  const mid = `${baseId}-marca${idSuffix}`;
  const modid = `${baseId}-modelo${idSuffix}`;
  const aid = `${baseId}-ano${idSuffix}`;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-5">
      <div className="grid flex-1 gap-4 sm:grid-cols-3">
        <div className="min-w-0">
          <label htmlFor={mid} className="mb-1.5 block text-sm font-medium text-white">
            Marca
          </label>
          <div className="relative">
            <select
              id={mid}
              className={selectClass}
              value={marcaId}
              onChange={(e) => onMarcaChange(e.target.value)}
            >
              <option value="">Selecione</option>
              {marcasFiltradas.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nome}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-store-navy-muted">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path
                  d="M2.5 4.25 6 7.75 9.5 4.25"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </div>
        <div className="min-w-0">
          <label htmlFor={modid} className="mb-1.5 block text-sm font-medium text-white">
            Modelo
          </label>
          <div className="relative">
            <select
              id={modid}
              className={selectClass}
              value={modeloId}
              onChange={(e) => onModeloChange(e.target.value)}
            >
              <option value="">Selecione</option>
              {modelosFiltrados.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-store-navy-muted">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path
                  d="M2.5 4.25 6 7.75 9.5 4.25"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </div>
        <div className="min-w-0">
          <label htmlFor={aid} className="mb-1.5 block text-sm font-medium text-white">
            Ano
          </label>
          <div className="relative">
            <select
              id={aid}
              className={selectClass}
              value={ano}
              onChange={(e) => onAnoChange(e.target.value)}
              disabled={!modeloId}
            >
              <option value="">Qualquer</option>
              {anosDisponiveis.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-store-navy-muted">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path
                  d="M2.5 4.25 6 7.75 9.5 4.25"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-center sm:justify-center lg:shrink-0 lg:pb-0.5">
        <button
          type="button"
          onClick={onApply}
          disabled={!canSearch}
          className={[
            "flex h-12 w-12 items-center justify-center rounded-full text-store-navy shadow-sm transition",
            canSearch
              ? "bg-store-subtle hover:bg-white"
              : "cursor-not-allowed bg-store-subtle/50 opacity-60",
          ].join(" ")}
          aria-label="Aplicar filtro de veículo"
          title={canSearch ? "Aplicar filtro de veículo" : "Escolha um modelo"}
        >
          <IconSearch className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export type VehicleFilterProps = {
  marcas: VehicleFilterMarca[];
  modelos: VehicleFilterModelo[];
  anosByModeloId: VehicleFilterAnosByModelo;
  appliedModeloId: string | null;
  appliedAno: number | null;
  /** Com busca por texto na home: vitrine entre a barra de pesquisa e “Filtre a sua busca”. */
  betweenSearchAndFilter?: ReactNode;
};

export function VehicleFilter({
  marcas,
  modelos,
  anosByModeloId,
  appliedModeloId,
  appliedAno,
  betweenSearchAndFilter,
}: VehicleFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const baseId = useId();

  const appliedModel = useMemo(
    () => (appliedModeloId ? modelos.find((m) => m.id === appliedModeloId) : undefined),
    [appliedModeloId, modelos]
  );

  const [category, setCategory] = useState<VehicleCategory>(() =>
    appliedModel ? tipoToTab(appliedModel.tipo_veiculo) : "carros"
  );
  const [marcaId, setMarcaId] = useState("");
  const [modeloId, setModeloId] = useState("");
  const [ano, setAno] = useState("");
  /** Mobile: painel de marca/modelo/ano só após toque em carro/caminhão. */
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const replaceVehicleQuery = (mutate: (p: URLSearchParams) => void) => {
    const p = new URLSearchParams(sp.toString());
    mutate(p);
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const prevModeloInUrl = useRef<string | null>(null);

  useEffect(() => {
    if (appliedModel) {
      setCategory(tipoToTab(appliedModel.tipo_veiculo));
      setMarcaId(appliedModel.marca_id);
      setModeloId(appliedModel.id);
      setAno(appliedAno != null ? String(appliedAno) : "");
      prevModeloInUrl.current = appliedModeloId;
      return;
    }

    if (appliedModeloId != null) {
      setMarcaId("");
      setModeloId("");
      setAno("");
      prevModeloInUrl.current = appliedModeloId;
      return;
    }

    if (prevModeloInUrl.current != null) {
      setMarcaId("");
      setModeloId("");
      setAno("");
    }
    prevModeloInUrl.current = null;
  }, [appliedModeloId, appliedAno, appliedModel]);

  const tipoAtual = TAB_TO_TIPO[category];

  const marcasFiltradas = useMemo(() => {
    const marcaIds = new Set(modelos.filter((m) => m.tipo_veiculo === tipoAtual).map((m) => m.marca_id));
    return marcas.filter((b) => marcaIds.has(b.id));
  }, [marcas, modelos, tipoAtual]);

  const modelosFiltrados = useMemo(() => {
    return modelos
      .filter((m) => m.tipo_veiculo === tipoAtual && (marcaId === "" || m.marca_id === marcaId))
      .slice()
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [modelos, tipoAtual, marcaId]);

  const anosDisponiveis = modeloId ? anosByModeloId[modeloId] ?? [] : [];

  const activeTabIndex = tabIndex(category);
  const canSearch = Boolean(modeloId.trim());

  const setTab = (id: VehicleCategory) => {
    setCategory(id);
    setMarcaId("");
    setModeloId("");
    setAno("");
    replaceVehicleQuery((p) => {
      p.delete("modelo");
      p.delete("ano");
    });
  };

  const onMarcaChange = (id: string) => {
    setMarcaId(id);
    setModeloId("");
    setAno("");
  };

  const onModeloChange = (id: string) => {
    setModeloId(id);
    setAno("");
  };

  const onVehicleSearch = () => {
    if (!modeloId.trim()) return;
    replaceVehicleQuery((p) => {
      p.set("modelo", modeloId.trim());
      if (ano.trim()) {
        const y = Number.parseInt(ano, 10);
        if (Number.isFinite(y) && y >= 1900 && y <= 2100) p.set("ano", String(y));
        else p.delete("ano");
      } else {
        p.delete("ano");
      }
    });
  };

  const applyVehicleAndCloseMobile = () => {
    onVehicleSearch();
    setMobileFilterOpen(false);
  };

  const onPlateResolvedVehicle = (resolvedModeloId: string, resolvedAno: number | null) => {
    const resolvedModel = modelos.find((m) => m.id === resolvedModeloId);
    if (resolvedModel) {
      setCategory(tipoToTab(resolvedModel.tipo_veiculo));
      setMarcaId(resolvedModel.marca_id);
      setModeloId(resolvedModel.id);
      setAno(resolvedAno != null ? String(resolvedAno) : "");
    }

    replaceVehicleQuery((p) => {
      p.set("modelo", resolvedModeloId);
      if (resolvedAno != null && Number.isFinite(resolvedAno)) p.set("ano", String(resolvedAno));
      else p.delete("ano");
    });
  };

  const isNarrowScreen = () =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 639px)").matches : false;

  const onVehicleTypeTab = (id: VehicleCategory) => {
    if (category !== id) {
      setTab(id);
    }
    if (isNarrowScreen()) setMobileFilterOpen(true);
  };

  useEffect(() => {
    if (!mobileFilterOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileFilterOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileFilterOpen]);

  useEffect(() => {
    if (!mobileFilterOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileFilterOpen]);

  const filterRest = (
    <>
      <h2
        id={`${baseId}-heading`}
        className="vehicle-filter-heading text-center text-lg font-semibold text-store-navy sm:text-xl"
      >
        Filtre a sua busca
      </h2>

      <div
        className="mt-5 rounded-full border border-store-line bg-white p-1 shadow-sm"
        role="tablist"
        aria-label="Tipo de veículo"
      >
        <div className="relative flex">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-0 w-1/2 rounded-full bg-store-navy shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{ transform: `translateX(calc(${activeTabIndex} * 100%))` }}
          />
          {TABS.map(({ id, label }) => {
            const active = category === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={label}
                onClick={() => onVehicleTypeTab(id)}
                className={[
                  "relative z-10 flex min-h-11 flex-1 items-center justify-center gap-0 rounded-full px-1 py-2 text-sm font-semibold transition-colors duration-200 sm:gap-2 sm:px-4",
                  active ? "text-store-accent" : "text-store-navy hover:bg-store-subtle/70",
                ].join(" ")}
              >
                <span
                  className={[
                    "relative block h-7 w-7 shrink-0 sm:h-[1.35rem] sm:w-[1.35rem]",
                    !active && "opacity-90",
                  ].join(" ")}
                  aria-hidden
                >
                  {active ? (
                    <span
                      className="absolute inset-0 bg-store-accent"
                      style={{
                        WebkitMaskImage: `url(${TAB_ICON_SRC[id]})`,
                        WebkitMaskSize: "contain",
                        WebkitMaskRepeat: "no-repeat",
                        WebkitMaskPosition: "center",
                        maskImage: `url(${TAB_ICON_SRC[id]})`,
                        maskSize: "contain",
                        maskRepeat: "no-repeat",
                        maskPosition: "center",
                      }}
                    />
                  ) : (
                    <Image
                      src={TAB_ICON_SRC[id]}
                      alt=""
                      width={TAB_ICON_PX}
                      height={TAB_ICON_PX}
                      className="h-full w-full object-contain object-center"
                      unoptimized
                    />
                  )}
                </span>
                <span className="hidden truncate sm:inline" aria-hidden>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: card sempre visível a partir de sm */}
      <div className="mt-4 hidden rounded-2xl bg-store-navy px-4 py-5 shadow-md sm:block sm:px-6 sm:py-6">
        <VehicleFilterFields
          idSuffix=""
          baseId={baseId}
          selectClass={selectClass}
          marcaId={marcaId}
          modeloId={modeloId}
          ano={ano}
          marcasFiltradas={marcasFiltradas}
          modelosFiltrados={modelosFiltrados}
          anosDisponiveis={anosDisponiveis}
          canSearch={canSearch}
          onMarcaChange={onMarcaChange}
          onModeloChange={onModeloChange}
          onAnoChange={setAno}
          onApply={onVehicleSearch}
        />
      </div>

      {/* Mobile: bottom sheet após toque no tipo de veículo */}
      {mobileFilterOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${baseId}-sheet-title`}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="Fechar filtro de veículo"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div
            className="relative z-10 w-full max-h-[min(88dvh,32rem)] overflow-y-auto rounded-t-2xl bg-store-navy px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-white/25" aria-hidden />
            <h3
              id={`${baseId}-sheet-title`}
              className="text-center text-base font-bold text-white"
            >
              Filtrar por {FILTER_KIND_LABEL[category]}
            </h3>
            <p className="mt-1 text-center text-xs text-white/75">
              Marca, modelo e ano para veículo do tipo selecionado.
            </p>
            <div className="mt-4">
              <VehicleFilterFields
                idSuffix="-m"
                baseId={baseId}
                selectClass={selectClass}
                marcaId={marcaId}
                modeloId={modeloId}
                ano={ano}
                marcasFiltradas={marcasFiltradas}
                modelosFiltrados={modelosFiltrados}
                anosDisponiveis={anosDisponiveis}
                canSearch={canSearch}
                onMarcaChange={onMarcaChange}
                onModeloChange={onModeloChange}
                onAnoChange={setAno}
                onApply={applyVehicleAndCloseMobile}
              />
            </div>
            <button
              type="button"
              className="mt-4 w-full rounded-xl border border-white/20 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10"
              onClick={() => setMobileFilterOpen(false)}
            >
              Fechar sem aplicar
            </button>
          </div>
        </div>
      ) : null}
    </>
  );

  const searchBar = (
    <>
      <PlateVehicleFinder
        marcas={marcas}
        modelos={modelos}
        anosByModeloId={anosByModeloId}
        onResolvedVehicle={onPlateResolvedVehicle}
      />
      <div className="relative mx-auto mb-5 w-1/2 min-w-0 max-w-full">
        <Suspense
          fallback={<div className="h-12 w-full animate-pulse rounded-full bg-[#3a3a3a]/50" aria-hidden />}
        >
          <StoreProductSearchBar />
        </Suspense>
      </div>
    </>
  );

  if (betweenSearchAndFilter) {
    return (
      <section
        className="flex min-h-0 flex-1 flex-col"
        aria-labelledby={`${baseId}-heading`}
      >
        <div className={`${storeShellInset} pt-6 sm:pt-8`}>
          <div className={storeShellContent}>
            <div className="mx-auto max-w-4xl">{searchBar}</div>
          </div>
        </div>

        <div className="animate-vehicle-filter-slot-in">{betweenSearchAndFilter}</div>

        <div className={`${storeShellInset} pb-2 pt-8 sm:pt-10`}>
          <div className={storeShellContent}>
            <div className="mx-auto max-w-4xl">
              <div className="animate-vehicle-filter-panel-in">{filterRest}</div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`${storeShellInset} pb-2 pt-6 sm:pt-8`}
      aria-labelledby={`${baseId}-heading`}
    >
      <div className={storeShellContent}>
        <div className="mx-auto max-w-4xl">
          {searchBar}
          <div className="animate-vehicle-filter-panel-in">{filterRest}</div>
        </div>
      </div>
    </section>
  );
}
