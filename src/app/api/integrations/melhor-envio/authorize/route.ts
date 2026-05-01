import { randomBytes } from "crypto";

import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/auth/requireAdminApi";
import { resolveMelhorEnvioOAuthAuthorizeUrl } from "@/services/melhorEnvio/oauthToken";

import {
  MELHOR_ENVIO_OAUTH_STATE_COOKIE,
  MELHOR_ENVIO_OAUTH_STATE_MAX_AGE,
  melhorEnvioOAuthStateCookieBase,
} from "../stateCookie";

export const dynamic = "force-dynamic";

function resolveDefaultScopes(): string {
  const raw = process.env.MELHOR_ENVIO_OAUTH_SCOPES?.trim();
  if (raw) {
    return raw;
  }
  return "shipping-calculate cart-read cart-write shipping-checkout shipping-generate shipping-print";
}

function requireRedirectUri(): string | null {
  return process.env.MELHOR_ENVIO_REDIRECT_URI?.trim() || null;
}

function requireClientId(): string | null {
  return process.env.MELHOR_ENVIO_CLIENT_ID?.trim() || null;
}

export async function GET() {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  const clientId = requireClientId();
  const redirectUri = requireRedirectUri();
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      {
        error:
          "OAuth Melhor Envio: defina MELHOR_ENVIO_CLIENT_ID e MELHOR_ENVIO_REDIRECT_URI no servidor.",
      },
      { status: 500 },
    );
  }

  const state = randomBytes(32).toString("hex");
  const authorizeBase = resolveMelhorEnvioOAuthAuthorizeUrl();
  const scopes = resolveDefaultScopes();

  const url = new URL(authorizeBase);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  url.searchParams.set("scope", scopes);

  const res = NextResponse.redirect(url.toString());
  res.cookies.set(MELHOR_ENVIO_OAUTH_STATE_COOKIE, state, {
    ...melhorEnvioOAuthStateCookieBase,
    maxAge: MELHOR_ENVIO_OAUTH_STATE_MAX_AGE,
  });

  return res;
}
