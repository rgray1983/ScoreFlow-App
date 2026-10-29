import { test as base, expect } from "@playwright/test";

export const test = base.extend<{ firebaseIsolation: void }>({
  firebaseIsolation: [async ({ context }, use) => {
    const productionCalls: string[] = [];
    await context.route((url) => url.protocol === "https:" &&
      /(^|\.)(googleapis\.com|firebaseio\.com|firebaseapp\.com|firebasestorage\.app)$/.test(url.hostname), (route) => {
      productionCalls.push(route.request().url());
      return route.abort("blockedbyclient");
    });
    await use();
    expect(productionCalls, "E2E must use demo-scoreflow emulators, never production Firebase").toEqual([]);
  }, { auto: true }]
});

export { expect };
