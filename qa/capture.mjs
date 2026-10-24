import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.join(root, '.playwright');
const html = pathToFileURL(path.join(root, 'verdant-dashboard.html')).href;
const out = path.join(root, 'qa', 'screenshots');
const sizes = [{ name: '1080p', width: 1920, height: 1080 }, { name: '720p', width: 1280, height: 720 }];
const menuNames = ['Apps', 'Media', 'Store', 'Settings', 'System'];
const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--ignore-gpu-blocklist'] });
const performanceResults = [];

await fs.mkdir(out, { recursive: true });
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const snap = (page, size, name) => page.screenshot({ path: path.join(out, `${size.name}-${slug(name)}.png`), animations: 'disabled' });
const key = (page, k) => page.keyboard.press(k);
async function measure(page, size, quality, scene) {
  const sampleKey = `${quality}:${scene}`;
  const start = await page.evaluate(k => (window.__verdantPerf[k] || []).length, sampleKey);
  await page.waitForTimeout(5000);
  const frames = await page.evaluate(arg => (window.__verdantPerf[arg.key] || []).slice(arg.start), { key: sampleKey, start });
  const sorted = frames.slice().sort((a, b) => a - b);
  const avg = frames.length ? frames.reduce((a, b) => a + b, 0) / frames.length : null;
  const p99 = sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * .99))] : null;
  performanceResults.push({ viewport: `${size.width}x${size.height}`, quality, scene, frames: frames.length, averageFrameMs: avg, onePercentLowFrameMs: p99 });
}

// Traverse the dashboard's spatial focus map with real keyboard events.
async function focusItemByKeyboard(page, targetIndex) {
  const graph = await page.evaluate(() => {
    const items = [...document.querySelectorAll('.screen.active [data-nav]')];
    const rects = items.map(el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    return { rects, start: items.indexOf(document.activeElement) };
  });
  if (graph.start < 0 || targetIndex < 0 || targetIndex >= graph.rects.length) return;
  const dirs = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  const next = (i, d) => {
    const a = graph.rects[i]; let best = i, bs = Infinity;
    graph.rects.forEach((b, j) => {
      if (i === j) return;
      const dx = b.x - a.x, dy = b.y - a.y;
      const main = d === 'ArrowUp' ? -dy : d === 'ArrowDown' ? dy : d === 'ArrowLeft' ? -dx : dx;
      const cross = d === 'ArrowUp' || d === 'ArrowDown' ? Math.abs(dx) : Math.abs(dy);
      const score = main > 4 ? main + cross * 2.5 : Infinity;
      if (score < bs) { bs = score; best = j; }
    });
    return best;
  };
  const queue = [[graph.start, []]], seen = new Set([graph.start]);
  while (queue.length) {
    const [i, steps] = queue.shift();
    if (i === targetIndex) { for (const d of steps) await key(page, d); return; }
    for (const d of dirs) { const j = next(i, d); if (!seen.has(j)) { seen.add(j); queue.push([j, [...steps, d]]); } }
  }
}

async function boot(page, size) {
  await page.goto(html, { waitUntil: 'load' });
  await page.waitForTimeout(350);
  await snap(page, size, 'start-gate');
  await key(page, 'Enter');
  await page.waitForTimeout(500); await snap(page, size, 'boot-500ms');
  await page.waitForTimeout(700); await snap(page, size, 'boot-1200ms');
  await page.waitForTimeout(800); await snap(page, size, 'boot-2000ms');
  await page.waitForTimeout(700);
}

async function captureSize(size) {
  const context = await browser.newContext({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await boot(page, size);
  for (let i = 0; i < menuNames.length; i++) {
    await focusItemByKeyboard(page, i); await page.waitForTimeout(250); await snap(page, size, `home-focus-${menuNames[i]}`);
  }
  for (const screen of ['apps', 'media', 'store', 'settings', 'system']) {
    const idx = menuNames.findIndex(n => slug(n) === screen);
    await focusItemByKeyboard(page, idx); await key(page, 'Enter'); await page.waitForTimeout(650);
    const count = await page.locator('.screen.active [data-nav]').count();
    await focusItemByKeyboard(page, 0); await snap(page, size, `${screen}-first-focused`);
    await focusItemByKeyboard(page, count - 1); await snap(page, size, `${screen}-last-focused`);
    await key(page, 'Escape'); await page.waitForTimeout(450);
  }
  await focusItemByKeyboard(page, 1); await key(page, 'Enter'); await page.waitForTimeout(500);
  await key(page, 'Enter'); await page.waitForTimeout(300); await snap(page, size, 'ambient-overlay'); await key(page, 'Escape');
  await focusItemByKeyboard(page, 1); await key(page, 'ArrowRight'); await key(page, 'ArrowRight'); await key(page, 'Enter');
  await page.waitForTimeout(300); await snap(page, size, 'screen-test-overlay'); await key(page, 'Escape'); await key(page, 'Escape');
  await focusItemByKeyboard(page, 3); await key(page, 'Enter'); await page.waitForTimeout(300); await focusItemByKeyboard(page, 1);
  await key(page, 'Escape'); await page.waitForTimeout(400); await snap(page, size, 'home-accent-verdant');
  for (const accent of ['cyan', 'amber', 'violet', 'crimson', 'verdant']) {
    await key(page, 'Enter'); await key(page, 'Escape'); await page.waitForTimeout(500); await snap(page, size, `home-accent-${accent}`);
    await focusItemByKeyboard(page, 3); await key(page, 'Enter'); await page.waitForTimeout(300); await focusItemByKeyboard(page, 1);
  }
  await focusItemByKeyboard(page, 3); await key(page, 'Enter'); await page.waitForTimeout(300); await focusItemByKeyboard(page, 2); await key(page, 'Enter');
  await key(page, 'Escape'); await page.waitForTimeout(400); await snap(page, size, 'home-light-theme');
  await focusItemByKeyboard(page, 3); await key(page, 'Enter'); await page.waitForTimeout(300); await focusItemByKeyboard(page, 2); await key(page, 'Enter'); await key(page, 'Enter');
  await focusItemByKeyboard(page, 3); await page.waitForTimeout(300); await focusItemByKeyboard(page, 4);
  for (const quality of ['high', 'balanced', 'low']) {
    await key(page, 'Escape'); await page.waitForTimeout(500); await snap(page, size, `home-quality-${quality}`); await measure(page, size, quality, 'home');
    await focusItemByKeyboard(page, 0); await key(page, 'Enter'); await page.waitForTimeout(500); await snap(page, size, `apps-quality-${quality}`); await measure(page, size, quality, 'apps'); await key(page, 'Escape');
    if (quality !== 'low') { await focusItemByKeyboard(page, 3); await key(page, 'Enter'); await page.waitForTimeout(300); await focusItemByKeyboard(page, 4); await key(page, 'Enter'); }
  }
  await context.close();
}

for (const size of sizes) await captureSize(size);
await browser.close();
await fs.writeFile(path.join(root, 'qa', 'performance.json'), JSON.stringify(performanceResults, null, 2));
console.log(`Captured screenshots to ${out}`);
