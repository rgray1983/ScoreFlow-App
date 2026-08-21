import { getDownloadURL, ref, uploadString } from "firebase/storage";
import { getFirebase } from "./firebase";
import { isHttpUrl, liveLogoValue, MAX_LIVE_DATA_LOGO } from "./payload";

function extensionFor(dataUrl: string): string {
  if (dataUrl.startsWith("data:image/webp")) return "webp";
  if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")) return "jpg";
  return "png";
}

function imageContentType(dataUrl: string): string {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+)/i);
  return match?.[1] || "image/png";
}

export async function compactLiveLogo(logo: string): Promise<string> {
  const ready = liveLogoValue(logo);
  if (ready) return ready;
  const value = logo.trim();
  if (!value.startsWith("data:image/")) return "";
  try {
    return await shrinkDataUrl(value);
  } catch {
    return "";
  }
}

export async function compactLiveLogos(logos: { homeLogo: string; awayLogo: string }): Promise<{
  homeLogo: string;
  awayLogo: string;
}> {
  const [homeLogo, awayLogo] = await Promise.all([
    compactLiveLogo(logos.homeLogo),
    compactLiveLogo(logos.awayLogo)
  ]);
  return { homeLogo, awayLogo };
}

async function shrinkDataUrl(dataUrl: string): Promise<string> {
  const blob = await fetch(dataUrl).then((response) => response.blob());
  const bitmap = await createImageBitmap(blob);
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    for (const maxPx of [160, 128, 96, 72]) {
      const scale = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height, 1));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.7, 0.5, 0.35]) {
        const jpeg = canvas.toDataURL("image/jpeg", quality);
        if (jpeg.startsWith("data:image/jpeg") && jpeg.length <= MAX_LIVE_DATA_LOGO) return jpeg;
        const webp = canvas.toDataURL("image/webp", quality);
        if (webp.startsWith("data:image/webp") && webp.length <= MAX_LIVE_DATA_LOGO) return webp;
      }
    }
    return "";
  } finally {
    bitmap.close();
  }
}

export async function uploadTeamLogo(gameId: string, side: "home" | "away", logo: string): Promise<string> {
  const value = logo.trim();
  if (!value) return "";
  if (isHttpUrl(value)) return value;
  if (!value.startsWith("data:image/")) return "";
  const { storage } = getFirebase();
  const fileRef = ref(storage, `volleyballGames/${gameId}/${side}.${extensionFor(value)}`);
  await uploadString(fileRef, value, "data_url", { contentType: imageContentType(value) });
  return getDownloadURL(fileRef);
}

export async function uploadMatchLogos(
  gameId: string,
  logos: { homeLogo: string; awayLogo: string }
): Promise<{ homeLogo: string; awayLogo: string }> {
  const [homeLogo, awayLogo] = await Promise.all([
    uploadTeamLogo(gameId, "home", logos.homeLogo).catch(() => ""),
    uploadTeamLogo(gameId, "away", logos.awayLogo).catch(() => "")
  ]);
  return { homeLogo, awayLogo };
}

export function resolveLiveLogos(
  uploaded: { homeLogo: string; awayLogo: string },
  draft: { homeLogo: string; awayLogo: string }
): { homeLogo: string; awayLogo: string } {
  return {
    homeLogo: uploaded.homeLogo || liveLogoValue(draft.homeLogo),
    awayLogo: uploaded.awayLogo || liveLogoValue(draft.awayLogo)
  };
}
