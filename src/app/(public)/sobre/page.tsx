import Link from "next/link";

export default function SobrePage() {
  return (
    <main className="mx-auto w-full max-w-store px-4 py-14 sm:px-6 sm:py-16">
      <section className="mx-auto max-w-3xl rounded-2xl border border-store-line bg-white p-6 text-center shadow-sm sm:p-8">
        <p className="inline-flex rounded-full bg-store-subtle px-3 py-1 text-xs font-bold uppercase tracking-wide text-store-navy-muted">
          Sobre nós
        </p>
        <h1 className="mt-4 text-3xl font-black text-store-navy sm:text-4xl">Página em construção</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-store-navy-muted sm:text-base">
          Estamos preparando uma página especial para contar nossa história, nossos valores e como ajudamos você a
          encontrar a peça certa com rapidez e confiança.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/produtos"
            className="inline-flex rounded-lg bg-store-navy px-4 py-2.5 text-sm font-bold text-white transition hover:bg-store-navy/90"
          >
            Ver produtos
          </Link>
          <Link
            href="/produtos#categorias"
            className="inline-flex rounded-lg border border-store-line px-4 py-2.5 text-sm font-bold text-store-navy transition hover:bg-store-subtle"
          >
            Explorar categorias
          </Link>
        </div>
      </section>
    </main>
  );
}
