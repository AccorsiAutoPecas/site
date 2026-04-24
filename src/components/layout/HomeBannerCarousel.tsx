"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";

const INTERVAL_MS = 6500;

type HomeBannerCarouselProps = {
  srcs: string[];
  /** Largura / altura de referência para proporção (artes 1920×550 px no admin). */
  width?: number;
  height?: number;
};

export function HomeBannerCarousel({
  srcs,
  width = 1920,
  height = 550,
}: HomeBannerCarouselProps) {
  const slides = srcs.filter(Boolean);
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const dotGroupId = useId();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (slides.length < 2 || reduceMotion) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(t);
  }, [slides.length, reduceMotion]);

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [index, slides.length]);

  if (slides.length === 0) return null;

  return (
    <div
      className="relative w-full max-w-[1920px]"
      role="region"
      aria-roledescription="carrossel"
      aria-label="Banners da página inicial"
    >
      <div
        className="relative w-full"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        {slides.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className={[
              "absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-out",
              i === index ? "z-[1] opacity-100" : "z-0 opacity-0",
            ].join(" ")}
            aria-hidden={i !== index}
          >
            <Image
              src={src}
              alt={i === 0 ? "Accorsi Auto Peças — banner" : `Accorsi Auto Peças — banner ${i + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority={i === 0}
              unoptimized
            />
          </div>
        ))}
      </div>

      {slides.length > 1 ? (
        <div
          className="pointer-events-auto absolute bottom-2 left-0 right-0 z-[2] flex justify-center gap-1.5"
          role="group"
          aria-label="Selecionar banner"
          id={dotGroupId}
        >
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Banner ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              className={[
                "h-2 w-2 rounded-full transition-[transform,background-color] duration-200",
                i === index ? "scale-110 bg-white shadow-sm" : "bg-white/50 hover:bg-white/80",
              ].join(" ")}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
