import { removeCategoryIconBackground } from "@/features/categorias/utils/removeCategoryIconBackground";
import { createClient } from "@/services/supabase/client";
import { parseProductImageStoragePath } from "@/services/storage/productImagePath";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/** Alguns navegadores (ex.: Windows) enviam `File.type` vazio mesmo com extensão válida. */
function effectiveImageMime(file: File): string | null {
  if (ALLOWED_MIME.has(file.type)) return file.type;
  const n = file.name.toLowerCase();
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".gif")) return "image/gif";
  return null;
}

const FALLBACK_MAX_DIMENSION = 1024;

/**
 * Quando o modelo ONNX falha (threads/WASM, rede, etc.), gera PNG com fundo branco
 * para o ícone ainda poder ser salvo.
 */
async function flattenImageFileToPng(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    let w = bitmap.width;
    let h = bitmap.height;
    if (w > FALLBACK_MAX_DIMENSION || h > FALLBACK_MAX_DIMENSION) {
      const scale = Math.min(FALLBACK_MAX_DIMENSION / w, FALLBACK_MAX_DIMENSION / h);
      w = Math.max(1, Math.round(w * scale));
      h = Math.max(1, Math.round(h * scale));
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas 2D indisponível neste navegador.");
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/png", 0.92);
    });
    if (!blob) {
      throw new Error("Não foi possível gerar PNG a partir da imagem.");
    }
    return blob;
  } finally {
    bitmap.close?.();
  }
}

function productImagesBucket() {
  return process.env.NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET ?? "product-images";
}

async function removeStorageObjectIfInBucket(ref: string): Promise<void> {
  const bucket = productImagesBucket();
  const path = parseProductImageStoragePath(ref, bucket);
  if (!path) return;
  const { error } = await createClient().storage.from(bucket).remove([path]);
  if (error && !/not found|No such file|404/i.test(error.message)) {
    /* arquivo antigo pode permanecer no bucket */
  }
}

/**
 * Envia ícone de categoria para o bucket de imagens (`categorias/`).
 * Retorna a URL pública. Opcionalmente remove o arquivo anterior no mesmo bucket.
 */
export async function uploadCategoryIconFile(
  file: File,
  options?: { replaceRef?: string | null }
): Promise<string> {
  if (effectiveImageMime(file) == null) {
    throw new Error("Use JPEG, PNG, WEBP ou GIF.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Arquivo muito grande (máximo 5 MB).");
  }

  let pngBody: Blob;
  try {
    pngBody = await removeCategoryIconBackground(file);
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    try {
      pngBody = await flattenImageFileToPng(file);
    } catch (e2) {
      const reason2 = e2 instanceof Error ? e2.message : String(e2);
      throw new Error(
        `Não foi possível processar o ícone. Remoção de fundo: ${reason}. Plano B (PNG): ${reason2}. Tente outra imagem ou outro navegador.`
      );
    }
    if (pngBody.size > MAX_FILE_BYTES) {
      throw new Error(
        `Não foi possível remover o fundo (${reason}). A imagem com fundo branco ainda excede 5 MB — use uma foto menor.`
      );
    }
  }

  if (pngBody.size > MAX_FILE_BYTES) {
    throw new Error("Imagem após remover o fundo ainda excede 5 MB. Use uma foto menor.");
  }

  const supabase = createClient();
  const bucket = productImagesBucket();
  const path = `categorias/${crypto.randomUUID()}.png`;

  const { error: upErr } = await supabase.storage.from(bucket).upload(path, pngBody, {
    contentType: "image/png",
    upsert: false,
  });

  if (upErr) {
    const msg =
      upErr.message.includes("JWT") ||
      upErr.message.includes("policy") ||
      upErr.message.includes("row-level security") ||
      upErr.message.includes("RLS")
        ? "Sem permissão no Storage: confira as políticas de INSERT (anon) no bucket de imagens."
        : upErr.message;
    throw new Error(msg);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  const prev = options?.replaceRef?.trim();
  if (prev && prev !== publicUrl) {
    try {
      await removeStorageObjectIfInBucket(prev);
    } catch {
      /* ignora */
    }
  }

  return publicUrl;
}
