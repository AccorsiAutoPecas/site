import { createAdminClient } from "@/services/supabase/admin";

import type { RefreshedMelhorEnvioCredentials } from "./oauthToken";

/**
 * Mantém no máximo uma linha de credenciais (primeiro OAuth ou renovações).
 */
export async function upsertMelhorEnvioCredentials(
  input: RefreshedMelhorEnvioCredentials,
): Promise<void> {
  const admin = createAdminClient();

  const { data: existing, error: readError } = await admin
    .from("melhor_envio_credentials")
    .select("id")
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (readError) {
    throw new Error(
      `Melhor Envio: falha ao ler credenciais para upsert (${readError.message}).`,
    );
  }

  const payload = {
    access_token: input.accessToken,
    refresh_token: input.refreshToken,
    expires_at: input.expiresAt.toISOString(),
    is_refreshing: false,
    refresh_lock_until: null as string | null,
  };

  if (existing?.id) {
    const { error } = await admin
      .from("melhor_envio_credentials")
      .update(payload)
      .eq("id", existing.id);

    if (error) {
      throw new Error(
        `Melhor Envio: falha ao atualizar credenciais (${error.message}).`,
      );
    }
    return;
  }

  const { error } = await admin.from("melhor_envio_credentials").insert(payload);

  if (error) {
    throw new Error(
      `Melhor Envio: falha ao gravar credenciais (${error.message}).`,
    );
  }
}
