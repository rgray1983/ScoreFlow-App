export const LOGO_MAX_PX = 256;
export const AVATAR_PX = 256;

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

export async function resizeAvatarFile(file: File, size = AVATAR_PX): Promise<string> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Could not read that image.");
  }
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = Math.floor((bitmap.width - side) / 2);
    const sy = Math.floor((bitmap.height - side) / 2);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not read that image.");
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
    const webp = canvas.toDataURL("image/webp", 0.86);
    if (webp.startsWith("data:image/webp")) return webp;
    return canvas.toDataURL("image/jpeg", 0.86);
  } finally {
    bitmap.close();
  }
}
