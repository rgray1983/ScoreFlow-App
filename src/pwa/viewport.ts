export function isStandaloneDisplay(
  nav: { standalone?: boolean; userAgent?: string } = typeof navigator === "undefined" ? {} : navigator,
  media: { matches: boolean } | null = typeof window === "undefined"
    ? null
    : window.matchMedia?.("(display-mode: standalone), (display-mode: fullscreen)") ?? null
): boolean {
  return Boolean(nav.standalone || media?.matches);
}

export function applyStandaloneShell(
  root: { classList: { toggle: (name: string, force?: boolean) => unknown } } = document.documentElement,
  standalone = isStandaloneDisplay()
): boolean {
  root.classList.toggle("scoreflow-standalone", standalone);
  return standalone;
}
