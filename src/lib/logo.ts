export const LOGO_MAX_PX = 256;

export async function resizeImageFile(file: File, maxPx = LOGO_MAX_PX): Promise<string> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Could not read that image.");
  }
  try {
    const scale = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not read that image.");
    ctx.drawImage(bitmap, 0, 0, width, height);
    const webp = canvas.toDataURL("image/webp", 0.82);
    if (webp.startsWith("data:image/webp")) return webp;
    return canvas.toDataURL("image/png");
  } finally {
    bitmap.close();
  }
}
