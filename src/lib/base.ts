export function viteBase(): string {
  const value = import.meta.env?.BASE_URL;
  return typeof value === "string" && value.length ? value : "/";
}

export function routerBasename(): string | undefined {
  const base = viteBase().replace(/\/$/, "");
  return base || undefined;
}

export function withBase(path: string, base = viteBase()): string {
  if (!path || /^(https?:|data:|blob:)/i.test(path)) return path;
  const clean = path.replace(/^\//, "");
  return base.endsWith("/") ? `${base}${clean}` : `${base}/${clean}`;
}
