export function legacyLivePath(search: string | URLSearchParams): string | null {
  const params = typeof search === "string"
    ? new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
    : search;
  const game = params.get("game")?.trim() ?? "";
  if (!game) return null;
  if (params.get("mode") === "scorer") return "/match";
  return `/g/${game}`;
}
