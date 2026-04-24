import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  PLACA_CONSULTA_ANON_COOKIE,
  parsePlacaConsultaAnonCookie,
  plateQuotaAssertCanConsult,
  plateQuotaRecordSuccess,
} from "@/lib/placaConsultaQuota";
import { createAdminClient } from "@/services/supabase/admin";
import { createClient } from "@/services/supabase/server";

type PlateLookupResult = {
  placa: string;
  modelo: string | null;
  marca: string | null;
  ano: number | null;
  fonte: "wdapi2" | "placafipe";
  informacoesVeiculo: {
    marca: string | null;
    modelo: string | null;
    ano: number | null;
  };
};

function normalizePlate(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function isValidPlate(plate: string): boolean {
  return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(plate) || /^[A-Z]{3}[0-9]{4}$/.test(plate);
}

function normalizeText(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length ? trimmed : null;
}

function toYear(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 1900 && raw <= 2100) return raw;
  if (typeof raw === "string") {
    const match = raw.match(/\b(19|20)\d{2}\b/);
    if (!match) return null;
    const year = Number.parseInt(match[0], 10);
    if (Number.isFinite(year) && year >= 1900 && year <= 2100) return year;
  }
  return null;
}

function readPath(obj: unknown, path: string[]): unknown {
  let cursor = obj as Record<string, unknown> | null;
  for (const key of path) {
    if (!cursor || typeof cursor !== "object") return null;
    cursor = (cursor[key] as Record<string, unknown>) ?? null;
  }
  return cursor;
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function fetchFromWdApi2(placa: string, token: string): Promise<PlateLookupResult | null> {
  const response = await fetch(`https://wdapi2.com.br/consulta/${placa}/${token}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const payload = (await safeJson(response)) as Record<string, unknown> | null;
  if (!payload || typeof payload !== "object") return null;

  const modelo =
    normalizeText(payload.modelo) ??
    normalizeText(payload.modelo_veiculo) ??
    normalizeText(payload.veiculo) ??
    normalizeText(payload.marca_modelo);
  const marca = normalizeText(payload.marca) ?? normalizeText(payload.fabricante);
  const ano = toYear(payload.ano) ?? toYear(payload.ano_modelo);

  if (!modelo && !ano) return null;
  return {
    placa,
    modelo,
    marca,
    ano,
    fonte: "wdapi2",
    informacoesVeiculo: { marca, modelo, ano },
  };
}

async function fetchFromPlacaFipe(placa: string, token: string): Promise<PlateLookupResult | null> {
  const response = await fetch("https://api.placafipe.com.br/getplaca", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ placa, token }),
    cache: "no-store",
  });
  if (!response.ok) return null;
  const payload = (await safeJson(response)) as Record<string, unknown> | null;
  if (!payload || typeof payload !== "object") return null;

  const info = (readPath(payload, ["informacoes_veiculo"]) as Record<string, unknown> | null) ?? payload;
  const modelo =
    normalizeText(info.modelo) ??
    normalizeText(info.modelo_veiculo) ??
    normalizeText(info.marca_modelo) ??
    normalizeText(info.veiculo);
  const marca = normalizeText(info.marca);
  const ano = toYear(info.ano_modelo) ?? toYear(info.ano);

  if (!modelo && !ano) return null;
  return {
    placa,
    modelo,
    marca,
    ano,
    fonte: "placafipe",
    informacoesVeiculo: { marca, modelo, ano },
  };
}

function placaConsultaSuccessResponse(
  body: PlateLookupResult,
  params: { setAnonCookieId?: string }
) {
  const res = NextResponse.json(body);
  if (params.setAnonCookieId) {
    res.cookies.set(PLACA_CONSULTA_ANON_COOKIE, params.setAnonCookieId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 400,
      secure: process.env.NODE_ENV === "production",
    });
  }
  return res;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const placa = normalizePlate(url.searchParams.get("placa") ?? "");
  if (!placa || !isValidPlate(placa)) {
    return NextResponse.json(
      { message: "Informe uma placa válida no formato ABC1234 ou ABC1D23." },
      { status: 400 }
    );
  }

  const token = process.env.MINHAS_PLACAS_TOKEN?.trim() ?? "";
  if (!token) {
    return NextResponse.json({ message: "Servidor sem token de consulta de placas." }, { status: 503 });
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { message: "Limite de consultas indisponível: configure SUPABASE_SERVICE_ROLE_KEY no servidor." },
      { status: 503 }
    );
  }

  const cookieStore = await cookies();
  const anonCookieRaw = cookieStore.get(PLACA_CONSULTA_ANON_COOKIE)?.value ?? null;
  const anonId = parsePlacaConsultaAnonCookie(anonCookieRaw);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  try {
    const quota = await plateQuotaAssertCanConsult(admin, { userId, anonId });
    if (!quota.ok) {
      return NextResponse.json({ message: quota.message, code: quota.code }, { status: 429 });
    }
  } catch {
    return NextResponse.json({ message: "Não foi possível verificar o limite de consultas." }, { status: 503 });
  }

  try {
    const fromWdApi2 = await fetchFromWdApi2(placa, token);
    if (fromWdApi2) {
      try {
        const { setAnonCookieId } = await plateQuotaRecordSuccess(admin, { userId, anonCookieRaw });
        return placaConsultaSuccessResponse(fromWdApi2, { setAnonCookieId });
      } catch {
        return NextResponse.json(
          { message: "Veículo encontrado, mas falhou ao registrar a consulta. Tente novamente." },
          { status: 503 }
        );
      }
    }

    const fromPlacaFipe = await fetchFromPlacaFipe(placa, token);
    if (fromPlacaFipe) {
      try {
        const { setAnonCookieId } = await plateQuotaRecordSuccess(admin, { userId, anonCookieRaw });
        return placaConsultaSuccessResponse(fromPlacaFipe, { setAnonCookieId });
      } catch {
        return NextResponse.json(
          { message: "Veículo encontrado, mas falhou ao registrar a consulta. Tente novamente." },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { message: "Não foi possível identificar o veículo com a placa informada." },
      { status: 404 }
    );
  } catch {
    return NextResponse.json({ message: "Falha ao consultar a API de placas." }, { status: 502 });
  }
}
