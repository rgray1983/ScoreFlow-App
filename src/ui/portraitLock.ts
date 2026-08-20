import { useEffect } from "react";

type LockableOrientation = {
  lock?: (type: string) => Promise<void>;
  unlock?: () => void;
};

function orientationApi(): LockableOrientation | undefined {
  if (typeof screen === "undefined") return undefined;
  return screen.orientation as LockableOrientation | undefined;
}

export async function lockPortraitOrientation(): Promise<boolean> {
  const orientation = orientationApi();
  if (typeof orientation?.lock !== "function") return false;
  try {
    await orientation.lock("portrait");
    return true;
  } catch {
    try {
      await orientation.lock("portrait-primary");
      return true;
    } catch {
      return false;
    }
  }
}

export function unlockOrientation(): void {
  try {
    orientationApi()?.unlock?.();
  } catch {
    // Browsers throw if nothing is locked, including Safari.
  }
}

export function usePortraitLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    void lockPortraitOrientation().then((locked) => {
      if (cancelled && locked) unlockOrientation();
    });
    return () => {
      cancelled = true;
      unlockOrientation();
    };
  }, [active]);
}
