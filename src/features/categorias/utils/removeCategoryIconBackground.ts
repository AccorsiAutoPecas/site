/**
 * Remove o fundo do ícone no navegador (modelo ONNX via @imgly/background-removal).
 * Só importe este módulo a partir de código client-side.
 */
export async function removeCategoryIconBackground(image: File | Blob): Promise<Blob> {
  const { removeBackground } = await import("@imgly/background-removal");
  return removeBackground(image, {
    model: "isnet_quint8",
    output: { format: "image/png", quality: 0.92 },
    debug: false,
  });
}
