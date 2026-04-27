/** Resumo do parcelamento no cartão (sem valores por parcela). */
export function ProductMercadoPagoInstallments({ amountBrl }: { amountBrl: number }) {
  if (amountBrl <= 0) return null;

  return (
    <div className="space-y-1">
      <p className="text-sm font-semibold text-store-navy">Parcelamento no cartão</p>
      <p className="text-sm text-store-navy">
        Até <span className="font-semibold text-black">3x sem juros</span>. Condições finais no checkout do Mercado Pago.
      </p>
    </div>
  );
}
