import { createAdminClient } from "@/services/supabase/admin";

export const PLACA_CONSULTA_ANON_COOKIE = "placa_consulta_anon_id";

export const PLACA_CONSULTA_USER_DAILY_MAX = 5;
export const PLACA_CONSULTA_ANON_LIFETIME_MAX = 1;

type AdminClient = ReturnType<typeof createAdminClient>;

export function todaySaoPauloISODate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parsePlacaConsultaAnonCookie(raw: string | null | undefined): string | null {
  if (!raw || !UUID_RE.test(raw)) return null;
  return raw.toLowerCase();
}

export type PlateQuotaDenyReason = "PLACA_QUOTA_ANON" | "PLACA_QUOTA_DIA";

export async function plateQuotaAssertCanConsult(
  admin: AdminClient,
  params: { userId: string | null; anonId: string | null }
): Promise<{ ok: true } | { ok: false; message: string; code: PlateQuotaDenyReason }> {
  const { userId, anonId } = params;

  if (userId) {
    const dia = todaySaoPauloISODate();
    const { data, error } = await admin
      .from("placa_consulta_usuario_dia")
      .select("quantidade")
      .eq("user_id", userId)
      .eq("dia_sp", dia)
      .maybeSingle();

    if (error) throw error;

    const n = data?.quantidade ?? 0;
    if (n >= PLACA_CONSULTA_USER_DAILY_MAX) {
      return {
        ok: false,
        code: "PLACA_QUOTA_DIA",
        message: `Você já usou suas ${PLACA_CONSULTA_USER_DAILY_MAX} consultas de placa hoje. O limite renova!`,
      };
    }
    return { ok: true };
  }

  if (anonId) {
    const { data, error } = await admin
      .from("placa_consulta_anon")
      .select("quantidade")
      .eq("id", anonId)
      .maybeSingle();

    if (error) throw error;

    const n = data?.quantidade ?? 0;
    if (n >= PLACA_CONSULTA_ANON_LIFETIME_MAX) {
      return {
        ok: false,
        code: "PLACA_QUOTA_ANON",
        message:
          "Quem não está logado pode consultar apenas uma placa. Faça login ou crie uma conta para consultar até 5 placas por dia.",
      };
    }
  }

  return { ok: true };
}

export async function plateQuotaRecordSuccess(
  admin: AdminClient,
  params: { userId: string | null; anonCookieRaw: string | null }
): Promise<{ setAnonCookieId?: string }> {
  const { userId, anonCookieRaw } = params;

  if (userId) {
    const dia = todaySaoPauloISODate();
    const { error } = await admin.rpc("increment_placa_consulta_usuario", {
      p_user_id: userId,
      p_dia_sp: dia,
    });
    if (error) throw error;
    return {};
  }

  const existing = parsePlacaConsultaAnonCookie(anonCookieRaw);
  const id = existing ?? crypto.randomUUID();

  const { error } = await admin
    .from("placa_consulta_anon")
    .upsert({ id, quantidade: 1 }, { onConflict: "id" });

  if (error) throw error;

  return existing ? {} : { setAnonCookieId: id };
}
