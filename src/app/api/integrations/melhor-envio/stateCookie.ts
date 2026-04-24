export const MELHOR_ENVIO_OAUTH_STATE_COOKIE = "me_oauth_state";

export const MELHOR_ENVIO_OAUTH_STATE_MAX_AGE = 600;

export const melhorEnvioOAuthStateCookieBase = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};
