"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

import { CART_ICON_SRC } from "@/features/carrinho/constants";
import { useCart } from "@/features/carrinho/CartContext";
import type { ProductSummary } from "@/types/product";

type ProductDetailAddToCartProps = {
  product: ProductSummary;
};

export function ProductDetailAddToCart({ product }: ProductDetailAddToCartProps) {
  const { addProduct, lines } = useCart();
  const [quantity, setQuantity] = useState(1);
  const stock = Math.max(0, Math.floor(Number(product.quantidade_estoque)));
  const inCart = lines.find((line) => line.id === product.id)?.quantity ?? 0;
  const availableToAdd = Math.max(0, stock - inCart);
  const disabled = availableToAdd <= 0;

  const maxSelectable = useMemo(() => Math.max(1, Math.min(10, availableToAdd || 1)), [availableToAdd]);

  function decrement() {
    setQuantity((prev) => Math.max(1, prev - 1));
  }

  function increment() {
    setQuantity((prev) => Math.min(maxSelectable, prev + 1));
  }

  function handleAdd() {
    const times = Math.min(quantity, availableToAdd);
    for (let i = 0; i < times; i += 1) addProduct(product);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-store-navy">Quantidade</span>
        <div className="inline-flex items-center rounded-full border border-store-line bg-white">
          <button
            type="button"
            onClick={decrement}
            disabled={quantity <= 1}
            className="h-8 w-8 text-base font-semibold text-store-navy disabled:cursor-not-allowed disabled:text-store-navy-muted"
            aria-label="Diminuir quantidade"
          >
            -
          </button>
          <span className="min-w-8 text-center text-sm font-semibold text-black">{quantity}</span>
          <button
            type="button"
            onClick={increment}
            disabled={quantity >= maxSelectable}
            className="h-8 w-8 text-base font-semibold text-store-navy disabled:cursor-not-allowed disabled:text-store-navy-muted"
            aria-label="Aumentar quantidade"
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={disabled}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-store-accent px-5 py-3 text-base font-bold text-black transition enabled:hover:brightness-95 enabled:active:brightness-90 disabled:cursor-not-allowed disabled:bg-store-line disabled:text-store-navy-muted"
      >
        <Image src={CART_ICON_SRC} alt="" width={22} height={22} className="h-5 w-5 object-contain" unoptimized />
        {disabled ? "Indisponível" : "Adicionar ao carrinho"}
      </button>
    </div>
  );
}
