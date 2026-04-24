import { createAdminClient } from "@/services/supabase/admin";

import { refreshMelhorEnvioToken } from "./oauthToken";

const FRESH_WINDOW_MS = 5 * 60 * 1000;
const LOCK_TTL_MS = 2 * 60 * 1000;
const POLL_MS = 250;
const MAX_WAIT_MS = 90 * 1000;

export class MelhorEnvioCredentialsMissingError extends Error {
  constructor() {
    super(
      "Integração Melhor Envio não configurada (nenhuma credencial OAuth no banco).",
    );
    this.name = "MelhorEnvioCredentialsMissingError";
  }
}

function resolveLegacyAccessTokenFromEnv(): string | null {
  const legacy = process.env.MELHOR_ENVIO_TOKEN?.trim();
  return legacy ? legacy : null;
}

type CredentialsRow = {
  id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  is_refreshing: boolean;
  refresh_lock_until: string | null;
};

function isAccessTokenFresh(expiresAtIso: string): boolean {
  const expiresAt = Date.parse(expiresAtIso);
  if (Number.isNaN(expiresAt)) {
    return false;
  }
  return expiresAt > Date.now() + FRESH_WINDOW_MS;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchCredentialsRow(): Promise<CredentialsRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("melhor_envio_credentials")
    .select(
      "id, access_token, refresh_token, expires_at, is_refreshing, refresh_lock_until",
    )
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Melhor Envio: falha ao ler credenciais (${error.message}).`,
    );
  }

  return data as CredentialsRow | null;
}

async function tryAcquireRefreshLock(
  id: string,
  lockUntilIso: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  const first = await admin
    .from("melhor_envio_credentials")
    .update({
      is_refreshing: true,
      refresh_lock_until: lockUntilIso,
    })
    .eq("id", id)
    .eq("is_refreshing", false)
    .select("id");

  if (first.error) {
    throw new Error(
      `Melhor Envio: falha ao adquirir lock de renovação (${first.error.message}).`,
    );
  }

  if (first.data && first.data.length > 0) {
    return true;
  }

  const second = await admin
    .from("melhor_envio_credentials")
    .update({
      is_refreshing: true,
      refresh_lock_until: lockUntilIso,
    })
    .eq("id", id)
    .eq("is_refreshing", true)
    .lt("refresh_lock_until", nowIso)
    .select("id");

  if (second.error) {
    throw new Error(
      `Melhor Envio: falha ao adquirir lock de renovação (${second.error.message}).`,
    );
  }

  return Boolean(second.data && second.data.length > 0);
}

async function clearRefreshLock(id: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("melhor_envio_credentials")
    .update({
      is_refreshing: false,
      refresh_lock_until: null,
    })
    .eq("id", id);

  if (error) {
    throw new Error(
      `Melhor Envio: falha ao liberar lock de renovação (${error.message}).`,
    );
  }
}

async function persistRefreshedTokens(
  id: string,
  input: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  },
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("melhor_envio_credentials")
    .update({
      access_token: input.accessToken,
      refresh_token: input.refreshToken,
      expires_at: input.expiresAt.toISOString(),
      is_refreshing: false,
      refresh_lock_until: null,
    })
    .eq("id", id);

  if (error) {
    throw new Error(
      `Melhor Envio: falha ao salvar tokens renovados (${error.message}).`,
    );
  }
}

/**
 * Retorna um access_token válido (com margem de 5 min), usando service_role e
 * lock em banco (`is_refreshing` + `refresh_lock_until`) para concorrência entre instâncias.
 */
export async function ensureMelhorEnvioAccessToken(): Promise<string> {
  let row = await fetchCredentialsRow();
  if (!row) {
    const legacy = resolveLegacyAccessTokenFromEnv();
    if (legacy) {
      return legacy;
    }
    throw new MelhorEnvioCredentialsMissingError();
  }

  if (isAccessTokenFresh(row.expires_at)) {
    return row.access_token;
  }

  const deadline = Date.now() + MAX_WAIT_MS;

  while (Date.now() < deadline) {
    row = await fetchCredentialsRow();
    if (!row) {
      const legacy = resolveLegacyAccessTokenFromEnv();
      if (legacy) {
        return legacy;
      }
      throw new MelhorEnvioCredentialsMissingError();
    }

    if (isAccessTokenFresh(row.expires_at)) {
      return row.access_token;
    }

    const lockUntil = new Date(Date.now() + LOCK_TTL_MS).toISOString();
    const acquired = await tryAcquireRefreshLock(row.id, lockUntil);

    if (acquired) {
      const current = await fetchCredentialsRow();
      if (!current) {
        await clearRefreshLock(row.id);
        throw new MelhorEnvioCredentialsMissingError();
      }

      if (isAccessTokenFresh(current.expires_at)) {
        await clearRefreshLock(current.id);
        return current.access_token;
      }

      try {
        const refreshed = await refreshMelhorEnvioToken(
          current.refresh_token,
        );
        await persistRefreshedTokens(current.id, refreshed);
        return refreshed.accessToken;
      } catch (err) {
        await clearRefreshLock(current.id);
        throw err;
      }
    }

    await sleep(POLL_MS);
  }

  throw new Error(
    "Melhor Envio: tempo esgotado aguardando renovação do access token.",
  );
}
