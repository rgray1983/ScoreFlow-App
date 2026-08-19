export function createGameId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

export function isGameId(value: string): boolean {
  return /^[a-f0-9]{32}$/i.test(value.trim());
}

export function viewerPath(gameId: string): string {
  return `/g/${gameId}`;
}

export function viewerUrl(gameId: string, origin = typeof location === "undefined" ? "" : location.origin): string {
  return `${origin}${viewerPath(gameId)}`;
}
