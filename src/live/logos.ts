import { getDownloadURL, ref, uploadString } from "firebase/storage";
import { ensureAnonymousAuth, getFirebase } from "./firebase";
import { isHttpUrl } from "./payload";

function extensionFor(dataUrl: string): string {
  if (dataUrl.startsWith("data:image/webp")) return "webp";
  if (dataUrl.startsWith("data:image/jpeg")) return "jpg";
  return "png";
}

export async function uploadTeamLogo(gameId: string, side: "home" | "away", logo: string): Promise<string> {
  const value = logo.trim();
  if (!value) return "";
  if (isHttpUrl(value)) return value;
  if (!value.startsWith("data:image/")) return "";
  await ensureAnonymousAuth();
  const { storage } = getFirebase();
  const fileRef = ref(storage, `volleyballGames/${gameId}/${side}.${extensionFor(value)}`);
  await uploadString(fileRef, value, "data_url");
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
