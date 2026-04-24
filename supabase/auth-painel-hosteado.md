# Supabase (projeto hospedado): Auth, URLs e e-mails Accorsi

Estas configurações espelham `supabase/config.toml` (desenvolvimento local) e o app Next.js (`/auth/callback`, senha mínima 8 caracteres). **Aplique manualmente** no [Dashboard Supabase](https://supabase.com/dashboard) do projeto de produção (e de staging, se houver).

## 1. URL Configuration

**Authentication → URL Configuration**

| Campo | Valor sugerido |
|--------|----------------|
| **Site URL** | URL pública da loja em produção, por exemplo `https://www.seu-dominio.com.br`. Em desenvolvimento local, use `http://localhost:3000`. |
| **Redirect URLs** | Inclua todas as origens e padrões de callback usados pelo app. Exemplos (ajuste o domínio de produção): |

```
http://localhost:3000/**
http://127.0.0.1:3000/**
https://www.seu-dominio.com.br/**
https://seu-dominio.com.br/**
```

O fluxo PKCE do app redireciona para `/auth/callback` (com query `next=...`). O curinga `/**` cobre esses caminhos.

## 2. Provedor E-mail e política de senha

**Authentication → Providers → Email**

- Mantenha o provedor **Email** habilitado para login por e-mail e senha.
- **Minimum password length: 8** (igual a `AUTH_PASSWORD_MIN_LENGTH` no código).
- **Password strength** / requisitos adicionais: opcional. O front valida apenas comprimento mínimo; se ativar regras mais rígidas no painel (ex.: letras e números), alinhe mensagens de erro no app.

**Authentication → Emails** (se disponível na sua versão do painel)

- Ajuste **Sender name** / remetente para algo como `Accorsi Auto Peças`, se o projeto permitir personalização.

## 3. Modelos de e-mail em português

**Authentication → Email Templates**

Para cada tipo abaixo, defina o **Subject** indicado e cole o **conteúdo HTML** do arquivo correspondente em `supabase/templates/` (mesmo texto usado pelo CLI local).

| Template no painel | Arquivo | Assunto (Subject) |
|--------------------|---------|---------------------|
| Confirm signup | `confirmation.html` | Confirme seu cadastro — Accorsi Auto Peças |
| Reset password | `recovery.html` | Redefina sua senha — Accorsi Auto Peças |
| Magic link | `magic_link.html` | Seu link de acesso — Accorsi Auto Peças |
| Change email address | `email_change.html` | Confirme seu novo e-mail — Accorsi Auto Peças |

## 4. Notificações de segurança

**Authentication → Email** (ou **Security** / notificações, conforme o layout do painel)

- Ative a notificação **Password changed** e use o HTML de `password_changed_notification.html` com o assunto: **Sua senha foi alterada — Accorsi Auto Peças**.

## 5. Confirmação de e-mail no cadastro

**Authentication → Providers → Email**

- **Confirm email**: ligue se quiser exigir confirmação antes do primeiro login (recomendado em produção). O texto do e-mail de confirmação é o template **Confirm signup** acima.

## 6. Após alterar templates ou URLs

- Em desenvolvimento: `supabase stop` e `supabase start` para recarregar `config.toml`.
- Em produção: alterações no painel passam a valer imediatamente; não é necessário redeploy do Next.js só por causa dos textos de e-mail.
