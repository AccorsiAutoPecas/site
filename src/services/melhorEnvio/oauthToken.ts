/**
 * OAuth2 token para Melhor Envio (servidor apenas).
 * Corpo em application/x-www-form-urlencoded, alinhado ao SDK oficial PHP.
 */

export type RefreshedMelhorEnvioCredentials = {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
};

export function resolveMelhorEnvioOAuthBaseUrl(): string {
  const explicit = process.env.MELHOR_ENVIO_OAUTH_BASE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  const sandbox = process.env.MELHOR_ENVIO_SANDBOX === "true";
  return sandbox
    ? "https://sandbox.melhorenvio.com.br"
    : "https://melhorenvio.com.br";
}

export function resolveMelhorEnvioOAuthTokenUrl(): string {
  const explicit = process.env.MELHOR_ENVIO_OAUTH_TOKEN_URL?.trim();
  if (explicit) {
    return explicit;
  }
  return `${resolveMelhorEnvioOAuthBaseUrl()}/oauth/token`;
}

/** URL do passo de autorização no navegador (`response_type=code`). */
export function resolveMelhorEnvioOAuthAuthorizeUrl(): string {
  const explicit = process.env.MELHOR_ENVIO_OAUTH_AUTHORIZE_URL?.trim();
  if (explicit) {
    return explicit;
  }
  return `${resolveMelhorEnvioOAuthBaseUrl()}/oauth/authorize`;
}

export function resolveMelhorEnvioUserAgent(): string {
  const ua = process.env.MELHOR_ENVIO_USER_AGENT?.trim();
  if (ua) {
    return ua;
  }
  return "AccorsiAutoPecasEcommerce/1.0 (defina MELHOR_ENVIO_USER_AGENT com nome e e-mail de contato técnico)";
}

/** Cabeçalhos exigidos pela API REST (Bearer injetado pelo chamador). */
export function melhorEnvioAuthorizedJsonHeaders(
  accessToken: string,
): Record<string, string> {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    "User-Agent": resolveMelhorEnvioUserAgent(),
  };
}

type MelhorEnvioOAuthTokenJson = {
  token_type?: string;
  expires_in?: number;
  access_token?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
  message?: string;
};

function requireMelhorEnvioOAuthClientCredentials(): {
  clientId: string;
  clientSecret: string;
} {
  const clientId = process.env.MELHOR_ENVIO_CLIENT_ID?.trim();
  const clientSecret = process.env.MELHOR_ENVIO_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error(
      "Melhor Envio OAuth: defina MELHOR_ENVIO_CLIENT_ID e MELHOR_ENVIO_CLIENT_SECRET no servidor.",
    );
  }
  return { clientId, clientSecret };
}

async function postMelhorEnvioOAuthToken(
  body: URLSearchParams,
  logContext: "refresh" | "authorization_code",
): Promise<RefreshedMelhorEnvioCredentials> {
  const tokenUrl = resolveMelhorEnvioOAuthTokenUrl();

  let response: Response;
  try {
    response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": resolveMelhorEnvioUserAgent(),
      },
      body: body.toString(),
    });
  } catch {
    console.error(`[Melhor Envio] OAuth token (${logContext}): falha de rede.`);
    throw new Error("Melhor Envio: falha de rede ao solicitar o token OAuth.");
  }

  let json: MelhorEnvioOAuthTokenJson;
  try {
    json = (await response.json()) as MelhorEnvioOAuthTokenJson;
  } catch {
    console.error(
      `[Melhor Envio] OAuth token (${logContext}): resposta inválida (HTTP ${response.status}).`,
    );
    throw new Error(
      `Melhor Envio: resposta inválida ao solicitar o token OAuth (HTTP ${response.status}).`,
    );
  }

  if (!response.ok) {
    console.error(
      `[Melhor Envio] OAuth token (${logContext}) falhou (HTTP ${response.status}).`,
    );
    throw new Error(
      `Melhor Envio: solicitação de token OAuth rejeitada (HTTP ${response.status}).`,
    );
  }

  const access = json.access_token?.trim();
  const refresh = json.refresh_token?.trim();
  const expiresIn = json.expires_in;

  if (!access || typeof expiresIn !== "number" || !Number.isFinite(expiresIn)) {
    console.error(
      `[Melhor Envio] OAuth token (${logContext}): payload incompleto (HTTP ${response.status}).`,
    );
    throw new Error("Melhor Envio: resposta OAuth sem access_token ou expires_in.");
  }

  const expiresAt = new Date(Date.now() + Math.max(0, expiresIn) * 1000);

  return {
    accessToken: access,
    refreshToken: refresh ?? "",
    expiresAt,
  };
}

/**
 * Renova access/refresh tokens via `grant_type=refresh_token`.
 * Não registra tokens nem segredos; em falha de rede/HTTP, apenas status genérico.
 */
export async function refreshMelhorEnvioToken(
  refreshToken: string,
): Promise<RefreshedMelhorEnvioCredentials> {
  const { clientId, clientSecret } = requireMelhorEnvioOAuthClientCredentials();
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  const out = await postMelhorEnvioOAuthToken(body, "refresh");
  if (!out.refreshToken) {
    return { ...out, refreshToken: refreshToken };
  }
  return out;
}

/**
 * Troca `authorization_code` da URL de callback por access/refresh tokens.
 */
export async function exchangeMelhorEnvioAuthorizationCode(
  code: string,
  redirectUri: string,
): Promise<RefreshedMelhorEnvioCredentials> {
  const { clientId, clientSecret } = requireMelhorEnvioOAuthClientCredentials();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const out = await postMelhorEnvioOAuthToken(body, "authorization_code");
  if (!out.refreshToken) {
    throw new Error(
      "Melhor Envio: resposta OAuth sem refresh_token (authorization_code).",
    );
  }
  return out;
}
