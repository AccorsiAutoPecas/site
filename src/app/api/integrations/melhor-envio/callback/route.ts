import { timingSafeEqual } from "crypto";

import { NextResponse, type NextRequest } from "next/server";

import { requireAdminApi } from "@/lib/auth/requireAdminApi";
import { exchangeMelhorEnvioAuthorizationCode } from "@/services/melhorEnvio/oauthToken";
import { upsertMelhorEnvioCredentials } from "@/services/melhorEnvio/upsertMelhorEnvioCredentials";

import {
  MELHOR_ENVIO_OAUTH_STATE_COOKIE,
  melhorEnvioOAuthStateCookieBase,
} from "../stateCookie";

export const dynamic = "force-dynamic";

function adminBaseUrl(request: NextRequest): string {
  return request.nextUrl.origin;
}

function redirectWithClearedState(
  request: NextRequest,
  pathWithQuery: string,
): NextResponse {
  const target = new URL(pathWithQuery, adminBaseUrl(request));
  const res = NextResponse.redirect(target);
  res.cookies.set(MELHOR_ENVIO_OAUTH_STATE_COOKIE, "", {
    ...melhorEnvioOAuthStateCookieBase,
    maxAge: 0,
  });
  return res;
}

function oauthStateMatchesCookie(cookieValue: string | undefined, state: string) {
  if (!cookieValue || !state || cookieValue.length !== state.length) {
    return false;
  }
  try {
    return timingSafeEqual(Buffer.from(cookieValue), Buffer.from(state));
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const gate = await requireAdminApi();
  if (!gate.ok) {
    if (gate.response.status === 401) {
      return NextResponse.redirect(
        new URL(
          `/login?next=${encodeURIComponent("/admin")}`,
          adminBaseUrl(request),
        ),
      );
    }
    return NextResponse.redirect(new URL("/", adminBaseUrl(request)));
  }

  const url = request.nextUrl;
  const code = url.searchParams.get("code")?.trim();
  const state = url.searchParams.get("state")?.trim() ?? "";
  const stored = request.cookies.get(MELHOR_ENVIO_OAUTH_STATE_COOKIE)?.value;

  if (!oauthStateMatchesCookie(stored, state)) {
    return redirectWithClearedState(
      request,
      "/admin?melhor_envio_oauth=erro_estado",
    );
  }

  if (!code) {
    return redirectWithClearedState(request, "/admin?melhor_envio_oauth=erro_codigo");
  }

  const redirectUri = process.env.MELHOR_ENVIO_REDIRECT_URI?.trim();
  if (!redirectUri) {
    return redirectWithClearedState(
      request,
      "/admin?melhor_envio_oauth=erro_config",
    );
  }

  try {
    const tokens = await exchangeMelhorEnvioAuthorizationCode(code, redirectUri);
    await upsertMelhorEnvioCredentials(tokens);
  } catch {
    return redirectWithClearedState(
      request,
      "/admin?melhor_envio_oauth=erro_token",
    );
  }

  return redirectWithClearedState(request, "/admin?melhor_envio_oauth=ok");
}
