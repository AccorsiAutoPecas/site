/**
 * =============================================================================
 * NÃO COLE ESTE ARQUIVO (.mjs) NO SQL EDITOR DO SUPABASE — dá erro de sintaxe.
 * Rode no terminal:  npm run generate:fipe-seed   ou   node scripts/generate-fipe-carros-seed.mjs
 * Depois abra o .sql gerado (ex.: supabase/seeds/fipe_carros_seed.sql) e cole SÓ esse no Supabase.
 * =============================================================================
 *
 * Gera arquivo SQL idempotente (Tabela FIPE Brasil — carros, via API Parallelum)
 * para colar no SQL Editor do Supabase.
 *
 * O Postgres do Supabase não busca a FIPE sozinho: este script gera o .sql localmente.
 *
 * Uso:
 *   node scripts/generate-fipe-carros-seed.mjs
 *   node scripts/generate-fipe-carros-seed.mjs --out supabase/seeds/fipe_carros_seed.sql
 *   node scripts/generate-fipe-carros-seed.mjs --limit-marcas 10
 *   node scripts/generate-fipe-carros-seed.mjs --delay-ms 400
 *   node scripts/generate-fipe-carros-seed.mjs --token SEU_TOKEN
 *
 * Token (recomendado): https://fipe.online — variável FIPE_SUBSCRIPTION_TOKEN ou --token
 * (header X-Subscription-Token). Host v2: fipe.parallelum.com.br.
 */

import { createWriteStream, mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUT = resolve(__dirname, "../supabase/seeds/fipe_carros_seed.sql");
/** API v2 (inglês nos campos: code, name) — melhor uso com token fipe.online */
const BASE = "https://fipe.parallelum.com.br/api/v2/cars";

/** Carrega `.env` e `.env.local` na raiz do projeto (útil para FIPE_SUBSCRIPTION_TOKEN). */
function loadEnvFromFiles() {
  const root = resolve(__dirname, "..");
  for (const name of [".env", ".env.local"]) {
    const p = resolve(root, name);
    if (!existsSync(p)) continue;
    const text = readFileSync(p, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq <= 0) continue;
      const key = t.slice(0, eq).trim();
      let val = t.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

function parseArgs(argv) {
  let out = DEFAULT_OUT;
  let delayMs = 400;
  let limitMarcas = Infinity;
  let token = process.env.FIPE_SUBSCRIPTION_TOKEN || "";
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out" && argv[i + 1]) {
      out = resolve(argv[++i]);
    } else if (a === "--delay-ms" && argv[i + 1]) {
      delayMs = Math.max(0, Number(argv[++i]) || 0);
    } else if (a === "--limit-marcas" && argv[i + 1]) {
      limitMarcas = Math.max(1, Number(argv[++i]) || 1);
    } else if (a === "--token" && argv[i + 1]) {
      token = String(argv[++i]);
    }
  }
  return { out, delayMs, limitMarcas, token };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function slugifyMarca(input) {
  const s = String(input)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "marca";
}

function slugifyModelo(input) {
  const s = String(input)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "modelo";
}

function escapeSql(s) {
  return String(s).replace(/'/g, "''");
}

async function fetchJson(url, delayMs, token, attempt = 0) {
  if (delayMs > 0) await sleep(delayMs);
  const headers = { Accept: "application/json" };
  if (token) headers["X-Subscription-Token"] = token;

  const res = await fetch(url, { headers });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }

  if (res.status === 429 || (data && typeof data.error === "string" && /taxa|rate|limite/i.test(data.error))) {
    if (attempt >= 15) {
      throw new Error(`Limite de taxa (429) após várias tentativas: ${url}`);
    }
    const wait = Math.min(120_000, 2500 * 2 ** attempt);
    console.error(`Taxa / 429 — aguardando ${Math.round(wait / 1000)}s antes de repetir (${attempt + 1})…`);
    await sleep(wait);
    return fetchJson(url, 0, token, attempt + 1);
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${url} — ${text.slice(0, 240)}`);
  }

  if (data && typeof data.error === "string") {
    throw new Error(`${data.error} (${url})`);
  }

  return data;
}

function allocateSlug(base, usedSet) {
  let candidate = base;
  let n = 2;
  while (usedSet.has(candidate)) {
    candidate = `${base}-${n}`;
    n += 1;
    if (n > 500) candidate = `${base}-x-${Date.now()}`;
  }
  usedSet.add(candidate);
  return candidate;
}

function parseAnoFromFipe(codigo) {
  const m = String(codigo ?? "").match(/^(\d{4})/);
  if (!m) return null;
  const y = Number(m[1], 10);
  if (!Number.isFinite(y) || y < 1900 || y > 2100) return null;
  return y;
}

async function main() {
  loadEnvFromFiles();
  const { out, delayMs, limitMarcas, token } = parseArgs(process.argv);
  mkdirSync(dirname(out), { recursive: true });

  const usedMarcaSlugs = new Set();
  const modelSlugsByMarca = new Map();

  const stream = createWriteStream(out, { encoding: "utf8" });
  const w = (line) => stream.write(line + "\n");

  w("-- ============================================================================");
  w("-- ARQUIVO SQL — pode colar no SQL Editor do Supabase. NÃO use o .mjs aqui.");
  w("-- ============================================================================");
  w("-- Seed FIPE Brasil (carros) — gerado por scripts/generate-fipe-carros-seed.mjs");
  w("-- Fonte: API FIPE v2 (fipe.parallelum.com.br / Tabela FIPE). Idempotente (ON CONFLICT DO NOTHING).");
  w("-- Marca só é emitida após obter a lista de modelos com sucesso (evita marcas órfãs se a API falhar).");
  if (token) w("-- (geração com X-Subscription-Token)");
  w("BEGIN;");
  w("");

  console.error("Buscando marcas (API v2)…");
  const marcas = await fetchJson(`${BASE}/brands`, delayMs, token, 0);
  if (!Array.isArray(marcas)) {
    throw new Error("Resposta de marcas inválida");
  }

  const slice = marcas.slice(0, limitMarcas);
  let marcaOk = 0;
  let modeloCount = 0;
  let anoCount = 0;
  let skipped = 0;

  for (const m of slice) {
    const codMarca = m.code ?? m.codigo;
    const nomeMarca = String(m.name ?? m.nome ?? "").trim();
    if (!nomeMarca || codMarca == null || codMarca === "") continue;

    let modelosPayload;
    try {
      modelosPayload = await fetchJson(`${BASE}/brands/${encodeURIComponent(codMarca)}/models`, delayMs, token, 0);
    } catch (e) {
      console.error(`Marca ${nomeMarca} (${codMarca}): modelos — ${e.message}`);
      skipped += 1;
      continue;
    }

    const modelosList = Array.isArray(modelosPayload)
      ? modelosPayload
      : modelosPayload?.modelos ?? modelosPayload?.models;
    if (!Array.isArray(modelosList)) {
      console.error(`Marca ${nomeMarca}: lista de modelos inválida`);
      skipped += 1;
      continue;
    }

    const slugMarca = allocateSlug(slugifyMarca(nomeMarca), usedMarcaSlugs);
    if (!modelSlugsByMarca.has(slugMarca)) modelSlugsByMarca.set(slugMarca, new Set());
    const usedModel = modelSlugsByMarca.get(slugMarca);

    w(
      `INSERT INTO public.marcas (nome, slug) VALUES ('${escapeSql(nomeMarca)}', '${escapeSql(slugMarca)}') ON CONFLICT (slug) DO NOTHING;`
    );
    marcaOk += 1;

    for (const mod of modelosList) {
      const codModelo = mod.code ?? mod.codigo;
      const nomeModelo = String(mod.name ?? mod.nome ?? "").trim();
      if (!nomeModelo || codModelo == null || codModelo === "") continue;

      const slugModelo = allocateSlug(slugifyModelo(nomeModelo), usedModel);

      w(
        `INSERT INTO public.modelos (marca_id, nome, slug, tipo_veiculo) SELECT m.id, '${escapeSql(nomeModelo)}', '${escapeSql(slugModelo)}', 'carro' FROM public.marcas m WHERE m.slug = '${escapeSql(slugMarca)}' ON CONFLICT (marca_id, slug) DO NOTHING;`
      );
      modeloCount += 1;

      let anos;
      try {
        anos = await fetchJson(
          `${BASE}/brands/${encodeURIComponent(codMarca)}/models/${encodeURIComponent(codModelo)}/years`,
          delayMs,
          token,
          0
        );
      } catch (e) {
        console.error(`  Modelo ${nomeModelo}: anos — ${e.message}`);
        continue;
      }

      if (!Array.isArray(anos)) continue;

      const years = new Set();
      for (const a of anos) {
        const y = parseAnoFromFipe(a.code ?? a.codigo);
        if (y != null) years.add(y);
      }

      for (const ano of years) {
        w(
          `INSERT INTO public.modelo_anos (modelo_id, ano) SELECT mo.id, ${ano}::smallint FROM public.modelos mo INNER JOIN public.marcas ma ON ma.id = mo.marca_id WHERE ma.slug = '${escapeSql(slugMarca)}' AND mo.slug = '${escapeSql(slugModelo)}' ON CONFLICT (modelo_id, ano) DO NOTHING;`
        );
        anoCount += 1;
      }
    }

    if (marcaOk % 5 === 0) {
      console.error(`… ${marcaOk} marcas completas, ${modeloCount} modelos, ${anoCount} linhas de ano (puladas: ${skipped})`);
    }
  }

  w("");
  w("COMMIT;");

  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
    stream.end();
  });

  console.error(`Arquivo: ${out}`);
  console.error(`Marcas gravadas no SQL: ${marcaOk}, inserts modelo: ${modeloCount}, inserts ano: ${anoCount}, marcas puladas: ${skipped}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
