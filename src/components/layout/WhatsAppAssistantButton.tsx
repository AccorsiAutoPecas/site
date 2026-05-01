"use client";

import Image from "next/image";
import { useCallback } from "react";

const WHATSAPP_URL = "https://wa.me/5554999343052";

export function WhatsAppAssistantButton() {
  const openWhatsApp = useCallback(() => {
    if (typeof window !== "undefined") {
      window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer");
    }
  }, []);

  return (
    <button
      type="button"
      onClick={openWhatsApp}
      className="fixed bottom-2 right-2 z-[160] flex flex-col items-end transition hover:scale-[1.02] sm:bottom-3 sm:right-4"
      aria-label="Falar com atendimento no WhatsApp"
    >
      <span className="mb-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold leading-none text-store-navy shadow-[0_4px_18px_rgba(0,0,0,0.18)] sm:hidden">
        Posso te ajudar?
      </span>
      <span className="relative block h-[6.5rem] w-[5.9rem] sm:hidden">
        <Image
          src="/icons/assistente.png"
          alt=""
          aria-hidden
          width={176}
          height={230}
          sizes="95px"
          className="pointer-events-none absolute inset-0 h-full w-full scale-[1.06] object-contain object-top opacity-90 [filter:brightness(0)_saturate(100%)_invert(61%)_sepia(64%)_saturate(3230%)_hue-rotate(3deg)_brightness(102%)_contrast(103%)]"
          priority
        />
        <Image
          src="/icons/assistente.png"
          alt="Assistente virtual da Accorsi"
          width={176}
          height={230}
          sizes="95px"
          className="relative z-10 h-full w-full object-contain object-top drop-shadow-[0_8px_22px_rgba(0,0,0,0.22)]"
          priority
        />
      </span>

      <span className="hidden w-[11rem] flex-col items-end sm:flex">
        <span className="mb-1.5 rounded-full bg-white px-3 py-1 text-sm font-bold text-store-navy shadow-[0_4px_18px_rgba(0,0,0,0.18)]">
          Posso te ajudar?
        </span>
        <span className="relative block h-[14.5rem] w-[11rem]">
          <Image
            src="/icons/assistente.png"
            alt=""
            aria-hidden
            width={176}
            height={230}
            sizes="176px"
            className="pointer-events-none absolute inset-0 h-full w-full scale-[1.06] object-contain object-top opacity-90 [filter:brightness(0)_saturate(100%)_invert(61%)_sepia(64%)_saturate(3230%)_hue-rotate(3deg)_brightness(102%)_contrast(103%)]"
            priority
          />
          <Image
            src="/icons/assistente.png"
            alt="Assistente virtual da Accorsi"
            width={176}
            height={230}
            sizes="176px"
            className="relative z-10 h-full w-full object-contain object-top drop-shadow-[0_8px_20px_rgba(0,0,0,0.25)]"
            priority
          />
        </span>
      </span>
    </button>
  );
}
