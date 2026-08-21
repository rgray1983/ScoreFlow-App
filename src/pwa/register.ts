import { registerSW } from "virtual:pwa-register";

function unregisterLegacyWorker() {
  if (!("serviceWorker" in navigator)) return;
  void navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      const script = registration.active?.scriptURL || registration.waiting?.scriptURL || registration.installing?.scriptURL || "";
      if (script.includes("service-worker.js")) void registration.unregister();
    }
  });
}

export function registerPwa() {
  unregisterLegacyWorker();
  if (import.meta.env.DEV) return;
  registerSW({ immediate: true });
}
