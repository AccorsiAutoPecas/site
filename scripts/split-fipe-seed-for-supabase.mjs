/**
 * Divide supabase/seeds/fipe_carros_seed.sql em vários arquivos pequenos para o
 * SQL Editor do Supabase (limite de tamanho da query).
 *
 * Uso:
 *   node scripts/split-fipe-seed-for-supabase.mjs
 *   node scripts/split-fipe-seed-for-supabase.mjs --in caminho.sql --out-dir supabase/seeds/fipe_parts --max-chars 65000
 *
 * Só inclui linhas INSERT (ignora BEGIN/COMMIT soltos no meio do arquivo).
 * Rode as partes em ordem: 01, 02, 03… Cada parte é uma transação própria.
 */

import { readFileSync, mkdirSync, writeFileSync, readdirSync, unlinkSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  let input = resolve(__dirname, "../supabase/seeds/fipe_carros_seed.sql");
  let outDir = resolve(__dirname, "../supabase/seeds/fipe_parts");
  let maxChars = 65_000;
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--in" && argv[i + 1]) input = resolve(argv[++i]);
    else if (a === "--out-dir" && argv[i + 1]) outDir = resolve(argv[++i]);
    else if (a === "--max-chars" && argv[i + 1]) maxChars = Math.max(5000, Number(argv[++i]) || 65_000);
  }
  return { input, outDir, maxChars };
}

function main() {
  const { input, outDir, maxChars } = parseArgs(process.argv);
  const raw = readFileSync(input, "utf8");
  const lines = raw.split(/\r?\n/);

  const insertLines = [];
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("INSERT")) insertLines.push(line);
  }

  if (insertLines.length === 0) {
    console.error("Nenhuma linha INSERT encontrada em", input);
    process.exit(1);
  }

  mkdirSync(outDir, { recursive: true });

  for (const name of readdirSync(outDir)) {
    if (name.endsWith(".sql")) unlinkSync(join(outDir, name));
  }

  const headerBase =
    "-- Parte FIPE carros (Supabase SQL Editor — limite de tamanho)\n" +
    "-- Idempotente: ON CONFLICT DO NOTHING nas linhas INSERT.\n";

  const parts = [];
  let buf = [];
  let size = 0;

  function flush() {
    if (buf.length === 0) return;
    parts.push(buf);
    buf = [];
    size = 0;
  }

  for (const ins of insertLines) {
    const add = ins.length + 1;
    if (size + add > maxChars && buf.length > 0) flush();
    buf.push(ins);
    size += add;
  }
  flush();

  const total = parts.length;
  let n = 0;
  for (const chunk of parts) {
    n += 1;
    const num = String(n).padStart(2, "0");
    const name = `fipe_carros_part_${num}_of_${String(total).padStart(2, "0")}.sql`;
    const path = join(outDir, name);
    const body =
      headerBase +
      `-- ${n} de ${total} — execute nesta ordem.\n` +
      "BEGIN;\n\n" +
      chunk.join("\n") +
      "\n\nCOMMIT;\n";
    writeFileSync(path, body, "utf8");
    console.error(`Escrito ${path} (${chunk.length} inserts, ${body.length} chars)`);
  }

  console.error(`\nPronto: ${total} arquivo(s) em ${outDir}`);
  console.error("No Supabase: SQL Editor → abra part_01, rode; depois part_02; …");
}

main();
