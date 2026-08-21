export function shouldBlockZoomGesture(touchCount: number): boolean {
  return touchCount > 1;
}

export function lockPageZoom(target: Pick<Document, "addEventListener"> = document): void {
  const block = (event: Event) => event.preventDefault();
  target.addEventListener("gesturestart", block);
  target.addEventListener("gesturechange", block);
  target.addEventListener("gestureend", block);
  target.addEventListener(
    "touchmove",
    (event) => {
      if (shouldBlockZoomGesture((event as TouchEvent).touches?.length ?? 0)) {
        event.preventDefault();
      }
    },
    { passive: false }
  );
}
