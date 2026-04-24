"use client";

import Image from "next/image";
import { useActionState, useRef, useState } from "react";

import { saveSiteLayout, type SaveSiteLayoutState } from "@/features/site-layout/services/saveSiteLayout";
import { uploadSiteBannerFile } from "@/services/storage/uploadSiteBanner";
import type { SiteLayoutRow } from "@/types/siteLayout";

type SiteLayoutFormProps = {
  initial: SiteLayoutRow;
};

export function SiteLayoutForm({ initial }: SiteLayoutFormProps) {
  const [banner1, setBanner1] = useState(initial.banner_1_url.trim());
  const [banner2, setBanner2] = useState(initial.banner_2_url.trim());
  const [busy1, setBusy1] = useState(false);
  const [busy2, setBusy2] = useState(false);
  const [err1, setErr1] = useState<string | null>(null);
  const [err2, setErr2] = useState<string | null>(null);
  const file1Ref = useRef<HTMLInputElement>(null);
  const file2Ref = useRef<HTMLInputElement>(null);

  const [state, formAction, pending] = useActionState(saveSiteLayout, null as SaveSiteLayoutState | null);

  const onPick = async (slot: 1 | 2, file: File | null) => {
    if (!file) return;
    const setBusy = slot === 1 ? setBusy1 : setBusy2;
    const setErr = slot === 1 ? setErr1 : setErr2;
    const prev = slot === 1 ? banner1 : banner2;
    setErr(null);
    setBusy(true);
    try {
      const url = await uploadSiteBannerFile(file, { replaceRef: prev || null });
      if (slot === 1) setBanner1(url);
      else setBanner2(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha no envio.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6" aria-label="Seções de layout">
          <span className="border-b-2 border-admin-accent px-1 pb-3 text-sm font-semibold text-gray-900">
            Site
          </span>
        </nav>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-gray-900">Banners da página inicial</h2>
        <p className="mt-1 text-sm text-gray-600">
          Envie até dois arquivos (recomendado 1920×550 px). Na loja eles
          alternam automaticamente na faixa abaixo da barra de navegação.
        </p>

        {state?.ok === true && (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
            {state.message}
          </p>
        )}
        {state?.ok === false && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
            {state.message}
          </p>
        )}

        <form action={formAction} className="mt-6 space-y-8">
          <input type="hidden" name="banner_1_url" value={banner1} />
          <input type="hidden" name="banner_2_url" value={banner2} />

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-800">Banner 1</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
                  disabled={busy1 || pending}
                  onClick={() => file1Ref.current?.click()}
                >
                  {busy1 ? "Enviando…" : "Escolher imagem"}
                </button>
                <input
                  ref={file1Ref}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={(e) => void onPick(1, e.target.files?.[0] ?? null)}
                />
              </div>
              {err1 && <p className="mt-2 text-sm text-red-700">{err1}</p>}
              {banner1 ? (
                <div className="mt-3 space-y-2">
                  <div className="relative aspect-[1920/550] w-full max-w-xl overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                    <Image src={banner1} alt="" fill className="object-contain" unoptimized />
                  </div>
                  <button
                    type="button"
                    className="text-sm font-medium text-gray-600 underline-offset-2 hover:text-gray-900 hover:underline"
                    onClick={() => setBanner1("")}
                  >
                    Remover imagem
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-sm text-gray-500">Nenhuma imagem (usa o banner padrão da loja se ambos estiverem vazios).</p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-800">Banner 2</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
                  disabled={busy2 || pending}
                  onClick={() => file2Ref.current?.click()}
                >
                  {busy2 ? "Enviando…" : "Escolher imagem"}
                </button>
                <input
                  ref={file2Ref}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={(e) => void onPick(2, e.target.files?.[0] ?? null)}
                />
              </div>
              {err2 && <p className="mt-2 text-sm text-red-700">{err2}</p>}
              {banner2 ? (
                <div className="mt-3 space-y-2">
                  <div className="relative aspect-[1920/550] w-full max-w-xl overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                    <Image src={banner2} alt="" fill className="object-contain" unoptimized />
                  </div>
                  <button
                    type="button"
                    className="text-sm font-medium text-gray-600 underline-offset-2 hover:text-gray-900 hover:underline"
                    onClick={() => setBanner2("")}
                  >
                    Remover imagem
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-sm text-gray-500">Opcional — com dois banners, a home alterna entre eles.</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-6">
            <button
              type="submit"
              className="rounded-lg bg-admin-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1857d1] disabled:opacity-60"
              disabled={pending || busy1 || busy2}
            >
              {pending ? "Salvando…" : "Salvar layout"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
