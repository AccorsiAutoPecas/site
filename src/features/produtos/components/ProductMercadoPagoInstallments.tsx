"use client";

import { useEffect, useMemo, useState } from "react";

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function parsePayerCosts(data: unknown): { installments: number; installment_amount: number }[] {
  if (!data) return [];
  const arr = Array.isArray(data) ? data : [data];
  for (const entry of arr) {
    if (!entry || typeof entry !== "object") continue;
    const costs = (entry as { payer_costs?: unknown }).payer_costs;
    if (!Array.isArray(costs)) continue;
    const out: { installments: number; installment_amount: number }[] = [];
    for (const c of costs) {
      if (!c || typeof c !== "object") continue;
      const inst = Number((c as { installments?: unknown }).installments);
      const amt = Number((c as { installment_amount?: unknown }).installment_amount);
      if (!Number.isFinite(inst) || inst < 1 || !Number.isFinite(amt) || amt < 0) continue;
      out.push({ installments: inst, installment_amount: amt });
    }
    if (out.length) return out.sort((a, b) => a.installments - b.installments);
  }
  return [];
}

/** Parcelamento no cartão (Mercado Pago). Com chave pública, consulta a API; senão, estimativa sem juros. */
export function ProductMercadoPagoInstallments({ amountBrl }: { amountBrl: number }) {
  const pk = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY?.trim();
  const [apiRows, setApiRows] = useState<{ installments: number; installment_amount: number }[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!pk || amountBrl <= 0) {
      setApiRows(null);
      setFailed(false);
      return;
    }
    const ac = new AbortController();
    const url = `https://api.mercadopago.com/v1/payment_methods/installments?public_key=${encodeURIComponent(pk)}&amount=${encodeURIComponent(amountBrl.toFixed(2))}&payment_type_id=credit_card`;
    void fetch(url, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("installments"))))
      .then((data) => {
        const parsed = parsePayerCosts(data);
        setApiRows(parsed.length ? parsed : null);
        setFailed(parsed.length === 0);
      })
      .catch(() => {
        setApiRows(null);
        setFailed(true);
      });
    return () => ac.abort();
  }, [amountBrl, pk]);

  const fallbackRows = useMemo(() => {
    if (amountBrl <= 0) return [];
    const base = amountBrl;
    return [1, 3, 6, 12]
      .filter((n) => n > 0)
      .map((installments) => ({
        installments,
        installment_amount: Math.round((base / installments) * 100) / 100,
      }));
  }, [amountBrl]);

  const rows = apiRows && apiRows.length > 0 ? apiRows : fallbackRows;
  const showDisclaimer = !pk || failed || !apiRows?.length;

  if (amountBrl <= 0) return null;

  const displayRows = rows.filter((r) => r.installments <= 12).slice(0, 6);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-store-navy">Parcelamento no cartão (Mercado Pago)</h3>
      <ul className="space-y-1 text-sm text-store-navy">
        {displayRows.map((r) => (
          <li key={r.installments}>
            {r.installments === 1 ? (
              <span>
                À vista: <span className="font-semibold text-black">{money.format(r.installment_amount)}</span>
              </span>
            ) : (
              <span>
                {r.installments}x de <span className="font-semibold text-black">{money.format(r.installment_amount)}</span>
              </span>
            )}
          </li>
        ))}
      </ul>
      {showDisclaimer ? (
        <p className="text-xs text-store-navy-muted">
          {pk
            ? "Valores indicativos; juros e condições finais são definidos no checkout do Mercado Pago."
            : "Defina NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY para exibir condições oficiais. Estimativa abaixo considera divisão simples do valor."}
        </p>
      ) : (
        <p className="text-xs text-store-navy-muted">Condições sujeitas à análise no checkout do Mercado Pago.</p>
      )}
    </div>
  );
}
