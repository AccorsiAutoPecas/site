type LoadingDotsProps = {
  label?: string;
  className?: string;
  /** Tamanho das bolinhas */
  size?: "sm" | "md";
  /** Cor das bolinhas (classes Tailwind de bg-*) */
  dotClassName?: string;
};

/** Três bolinhas pulsando — indica processamento (cadastro/importação). */
export function LoadingDots({
  label = "Processando",
  className = "",
  size = "md",
  dotClassName = "bg-admin-accent",
}: LoadingDotsProps) {
  const dot = size === "sm" ? "h-1.5 w-1.5" : "h-2.5 w-2.5";

  return (
    <div
      className={`inline-flex items-center gap-2 text-sm font-medium text-gray-800 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label || "Processando"}
    >
      {label ? <span>{label}</span> : null}
      <span className="inline-flex items-center gap-1" aria-hidden>
        <span
          className={`${dot} ${dotClassName} animate-bounce rounded-full [animation-delay:-0.3s]`}
        />
        <span
          className={`${dot} ${dotClassName} animate-bounce rounded-full [animation-delay:-0.15s]`}
        />
        <span className={`${dot} ${dotClassName} animate-bounce rounded-full`} />
      </span>
    </div>
  );
}
