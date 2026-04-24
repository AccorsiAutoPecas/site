This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Variáveis de ambiente

1. Copie `.env.example` para `.env.local` e preencha os valores.
2. Variáveis usadas no código:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — cliente e middleware Supabase.
   - `SUPABASE_SERVICE_ROLE_KEY` — apenas servidor (ex.: webhook Mercado Pago); não exponha ao browser.
   - `NEXT_PUBLIC_APP_URL` — URL pública base (com protocolo, sem barra final). Obrigatória para montar `back_urls` e `notification_url` do Checkout Pro; em deploy na Vercel o código também tenta `VERCEL_URL` se esta não estiver definida.
   - `MERCADOPAGO_ACCESS_TOKEN` — token de acesso da aplicação no [painel de desenvolvedor](https://www.mercadopago.com.br/developers/panel/app) (produção ou teste; tokens de teste começam com `TEST-`).
   - `MERCADOPAGO_WEBHOOK_SECRET` — opcional mas recomendado em produção: mesmo segredo usado pelo MP para assinar notificações (`x-signature`). Se ausente, a rota de webhook não valida assinatura.
   - `NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET` — opcional (padrão `product-images`).

## Mercado Pago (painel e webhook)

1. **Credenciais:** em *Suas integrações* → sua aplicação → **Credenciais**, copie o *Access Token* de teste ou produção para `MERCADOPAGO_ACCESS_TOKEN`.
2. **URL do site:** `NEXT_PUBLIC_APP_URL` deve ser exatamente a origem que o Mercado Pago e o navegador usam (ex.: `https://loja.exemplo.com`). Isso define retorno do checkout e a URL de notificação enviada na Preference.
3. **Webhook de pagamentos:** a aplicação expõe `POST /api/webhooks/mercadopago`. No painel, cadastre a URL de produção como:
   - `{NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`
   Use o mesmo host que em `NEXT_PUBLIC_APP_URL`. Em desenvolvimento local o MP não alcança `localhost`; use um túnel (ngrok, Cloudflare Tunnel, etc.), aponte o webhook para a URL pública do túnel e defina `NEXT_PUBLIC_APP_URL` com essa mesma base ao testar preferências e retornos.
4. **Assinatura:** se você configurar validação de webhook no MP, defina o segredo correspondente em `MERCADOPAGO_WEBHOOK_SECRET` para a rota validar `x-signature`.

Documentação: [Checkout Pro](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/landing) e [Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
