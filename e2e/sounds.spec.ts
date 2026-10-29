import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

// Exercise real decoding and real Web Audio sources. Observe scheduling without
// pretending browser tests verify a phone speaker, mute switch or physical audio.
async function observeAudio(page: Page) {
  await page.addInitScript(() => {
    const state = window as typeof window & { soundStarts: { cue: string; when: number }[] };
    state.soundStarts = [];
    const bytes = new WeakMap<ArrayBuffer, string>();
    const buffers = new WeakMap<AudioBuffer, string>();
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      const url = String(args[0]);
      if (url.includes('/sounds/')) {
        const original = response.arrayBuffer.bind(response);
        response.arrayBuffer = async () => { const data = await original(); bytes.set(data, url.split('/').pop()!.replace('.mp3', '')); return data; };
      }
      return response;
    };
    const decode = AudioContext.prototype.decodeAudioData;
    AudioContext.prototype.decodeAudioData = function(data: ArrayBuffer) {
      const cue = bytes.get(data) || 'unknown';
      return decode.call(this, data).then((buffer) => { buffers.set(buffer, cue); return buffer; });
    };
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function(when = 0, offset = 0, duration?: number) {
      state.soundStarts.push({ cue: this.buffer ? buffers.get(this.buffer) || 'unknown' : 'missing', when });
      if (duration === undefined) start.call(this, when, offset); else start.call(this, when, offset, duration);
    };
  });
}
test.beforeEach(({ page }) => { page.setDefaultTimeout(15000); });

const starts = (page: Page) => page.evaluate(() => (window as typeof window & { soundStarts: { cue: string; when: number }[] }).soundStarts.map(s => s.cue));
async function enable(page: Page) {
  await page.getByRole('button', { name: 'Sound settings', exact: true }).click();
  await page.getByRole('button', { name: 'Enable sound', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Sound on' })).toBeVisible();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
}
async function add(page: Page, side = 'Team 1') {
  await page.getByRole('button', { name: `Add point to ${side}`, exact: true }).click();
}

test('sound cues, milestones, mute, reload and independent viewer playback', async ({ page, browser }, info) => {
  test.setTimeout(120000);
  await observeAudio(page);
  await page.goto('/match');
  await add(page);
  expect(await starts(page)).toEqual([]);
  await page.getByRole('button', { name: 'Share Live', exact: true }).click();
  await expect(page.getByText('Online', { exact: true })).toBeVisible({ timeout: 20000 });
  const url = await page.getByLabel('Viewer link').inputValue();
  await page.getByTestId('share-close').click();
  const viewerContext = await browser.newContext();
  const productionCalls: string[] = [];
  await viewerContext.route(u => u.protocol === 'https:' && /(^|\.)(googleapis\.com|firebaseio\.com|firebaseapp\.com|firebasestorage\.app)$/.test(u.hostname), r => { productionCalls.push(r.request().url()); return r.abort(); });
  try {
    const viewer = await viewerContext.newPage(); await observeAudio(viewer);
    await viewer.goto(url);
    await viewer.getByRole('button', { name: 'Watch Live Score' }).click();
    await viewer.getByLabel('Chat name').fill('Sound Fan');
    await viewer.getByRole('button', { name: 'Start Chatting' }).click();
    await enable(page);
    await add(page); // 2-0
    await expect.poll(() => starts(page)).toEqual(['point']);
    await expect(viewer.getByTestId('home-score')).toHaveText('2');
    expect(await starts(viewer)).toEqual([]);
    await enable(viewer);
    for (let n = 3; n <= 8; n++) {
      await add(page);
      await expect(viewer.getByTestId('home-score')).toHaveText(String(n));
    }
    await expect.poll(() => starts(viewer)).toEqual(['point','point','heating-up','point','point','point','on-fire','point']);
    const sequence = await viewer.evaluate(() => (window as typeof window & { soundStarts: {cue:string;when:number}[] }).soundStarts);
    expect(sequence[2].when).toBeGreaterThan(sequence[1].when);
    expect(sequence[6].when).toBeGreaterThan(sequence[5].when);
    for (const kind of ['ace', 'kill', 'block']) {
      await page.getByRole('button', { name: 'Highlight call for Team 2', exact: true }).click();
      await page.getByRole('button', { name: `${kind}! +1`, exact: true }).click();
      await expect.poll(async () => (await starts(viewer)).at(-1)).toBe(kind);
      await expect.poll(async () => (await starts(page)).at(-1)).toBe(kind);
    }
    const before = (await starts(viewer)).length;
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(viewer.getByTestId('away-score')).toHaveText('2');
    expect((await starts(viewer)).length).toBe(before);
    await page.getByTestId('timeouts-home').getByRole('button').first().click();
    await expect.poll(async () => (await starts(viewer)).at(-1)).toBe('timeout');
    await expect.poll(async () => (await starts(page)).at(-1)).toBe('timeout');
    await page.getByRole('button', { name: 'End timeout', exact: true }).click();
    await viewer.getByRole('button', { name: 'Sound settings', exact: true }).click();
    await viewer.getByLabel('Volume').focus();
    await viewer.getByLabel('Volume').press('Home');
    for (let i = 0; i < 7; i++) await viewer.getByLabel('Volume').press('ArrowRight');
    await viewer.getByRole('button', { name: 'Mute sound', exact: true }).click();
    await viewer.getByRole('button', { name: 'Done', exact: true }).click();
    const muted = (await starts(viewer)).length;
    await add(page); await expect(viewer.getByTestId('home-score')).toHaveText('9');
    expect((await starts(viewer)).length).toBe(muted);
    await viewer.reload(); await viewer.getByRole('button', { name: 'Watch Live Score' }).click();
    expect(await starts(viewer)).toEqual([]);
    await viewer.getByRole('button', { name: 'Sound settings', exact: true }).click();
    await expect(viewer.getByLabel('Volume')).toHaveValue('35');
    await expect(viewer.getByRole('button', { name: 'Enable sound', exact: true })).toBeVisible();
    await viewer.getByRole('button', { name: 'Done', exact: true }).click();
    await enable(viewer);
    expect(await starts(viewer)).toEqual([]);
    await viewerContext.setOffline(true);
    await expect(viewer.getByText("Offline", {exact:true})).toBeVisible();
    await add(page); await page.waitForTimeout(100);
    await viewerContext.setOffline(false);
    await expect(viewer.getByTestId('home-score')).toHaveText('10');
    expect(await starts(viewer)).toEqual([]);
    await add(page); await expect.poll(() => starts(viewer)).toEqual(['point']);
    // Scorer offline sounds work locally; restoring its queued score is quiet remotely.
    await page.context().setOffline(true); await add(page);
    await expect(page.getByTestId('home-score')).toHaveText('12');
    const remoteBefore = (await starts(viewer)).length;
    await page.context().setOffline(false);
    await expect(viewer.getByTestId('home-score')).toHaveText('12', { timeout: 20000 });
    expect((await starts(viewer)).length).toBe(remoteBefore);
    await page.reload();
    await expect(page.getByTestId('share-close')).toBeVisible({timeout:20000});
    await page.getByTestId('share-close').click();
    expect(await starts(page)).toEqual([]);
    await page.getByRole('button', { name: 'Sound settings', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Enable sound', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    for (const target of [page, viewer]) for (const size of [{width:320,height:568},{width:390,height:844},{width:844,height:390}]) {
      await target.setViewportSize(size);
      const button = target.getByRole('button', {name:'Sound settings',exact:true});
      const box = await button.boundingBox(); expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x+box!.width).toBeLessThanOrEqual(size.width);
      await button.click();
      await expect(target.getByRole('button',{name:'Enable sound',exact:true}).or(target.getByRole('button',{name:'Mute sound',exact:true}))).toBeVisible();
      await target.screenshot({path:info.outputPath(`sound-${target===page?'scorer':'viewer'}-${size.width}x${size.height}.png`)});
      await target.getByRole('button',{name:'Done',exact:true}).click();
    }
    expect(productionCalls).toEqual([]);
  } finally { await viewerContext.close(); }
});

test('a missing audio file fails quietly, scoring stays usable, and enabling can retry', async ({ page }) => {
  await observeAudio(page);
  await page.route('**/sounds/kill.mp3', route => route.fulfill({ status: 404, body: '' }));
  await page.goto('/match');
  await page.getByRole('button', {name:'Sound settings',exact:true}).click();
  await page.getByRole('button', {name:'Enable sound',exact:true}).click();
  await expect(page.getByText('Sound unavailable. Try enabling it again.',{exact:true})).toBeVisible();
  await page.getByRole('button', {name:'Done',exact:true}).click();
  await add(page);
  await expect(page.getByTestId('home-score')).toHaveText('1');
  expect(await starts(page)).toEqual([]);
  await page.unroute('**/sounds/kill.mp3');
  await enable(page);
  await add(page);
  await expect.poll(() => starts(page)).toEqual(['point']);
});
