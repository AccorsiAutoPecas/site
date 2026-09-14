export default function ProdutosLoading() {
  return (
    <div className="flex min-h-dvh flex-col bg-store-cream font-sans text-store-navy">
      <section className="flex-1 px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:gap-10">
          <div
            className="h-72 w-full shrink-0 animate-pulse rounded-sm border border-store-line/60 bg-white lg:w-1/4 lg:max-w-xs"
            aria-hidden
          />
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <div className="h-12 w-full max-w-xl animate-pulse rounded-full bg-store-navy/10" aria-hidden />
            <div className="h-8 w-48 animate-pulse rounded bg-store-navy/10" aria-hidden />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-sm bg-white" aria-hidden />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
