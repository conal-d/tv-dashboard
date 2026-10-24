import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.join(root, '.playwright');
const html = pathToFileURL(path.join(root, 'verdant-dashboard.html')).href;
const out = path.join(root, 'qa', 'screenshots');
const sizes = [{ name: '1080p', width: 1920, height: 1080 }, { name: '720p', width: 1280, height: 720 }];
const blades = ['Memory', 'Music', 'Xbox Live', 'Settings'];
const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--ignore-gpu-blocklist'] });
const performanceResults = [];

await fs.mkdir(out, { recursive: true });
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const snap = (page, size, name) => page.screenshot({ path: path.join(out, `${size.name}-${slug(name)}.png`), animations: 'disabled' });
const key = (page, k) => page.keyboard.press(k);

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

async function enterBlade(page, index) {
  await focusItemByKeyboard(page, index);
  await key(page, 'Enter');
  await page.waitForTimeout(700);
}

async function captureSize(size) {
  const context = await browser.newContext({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await boot(page, size);

  for (let i = 0; i < blades.length; i++) {
    await focusItemByKeyboard(page, i);
    await page.waitForTimeout(350);
    await snap(page, size, `home-focus-${blades[i]}`);
  }

  for (const [screen, blade] of [['apps', 0], ['media', 1], ['store', 2], ['settings', 3]]) {
    await enterBlade(page, blade);
    const count = await page.locator('.screen.active [data-nav]').count();
    await focusItemByKeyboard(page, 1); await snap(page, size, `${screen}-first-focused`);
    await focusItemByKeyboard(page, count - 1); await snap(page, size, `${screen}-last-focused`);
    await key(page, 'Escape'); await page.waitForTimeout(500);
  }

  await enterBlade(page, 3);
  await focusItemByKeyboard(page, 2); await key(page, 'Enter'); await page.waitForTimeout(600);
  const systemCount = await page.locator('.screen.active [data-nav]').count();
  await focusItemByKeyboard(page, 1); await snap(page, size, 'system-first-focused');
  await focusItemByKeyboard(page, systemCount - 1); await snap(page, size, 'system-last-focused');
  await key(page, 'Escape'); await page.waitForTimeout(500);
  await key(page, 'Escape'); await page.waitForTimeout(500);

  await enterBlade(page, 1);
  await focusItemByKeyboard(page, 1); await key(page, 'Enter'); await page.waitForTimeout(350);
  await snap(page, size, 'ambient-overlay'); await key(page, 'Escape');
  await focusItemByKeyboard(page, 1); await key(page, 'ArrowRight'); await key(page, 'ArrowRight'); await key(page, 'Enter');
  await page.waitForTimeout(350); await snap(page, size, 'screen-test-overlay'); await key(page, 'Escape');
  await key(page, 'Escape'); await page.waitForTimeout(450);

  await key(page, 'f'); await page.waitForTimeout(200); await snap(page, size, 'frame-time-overlay'); await key(page, 'f');
  let currentQuality = 'high';
  const qualityOrder = ['high', 'balanced', 'low'];
  for (const quality of qualityOrder) {
    await enterBlade(page, 3);
    await focusItemByKeyboard(page, 2); // Quality is the second setting after Sound.
    const steps = (qualityOrder.indexOf(quality) - qualityOrder.indexOf(currentQuality) + qualityOrder.length) % qualityOrder.length;
    for (let n = 0; n < steps; n++) await key(page, 'Enter');
    currentQuality = quality;
    await key(page, 'Escape'); await page.waitForTimeout(450);
    await snap(page, size, `home-quality-${quality}`);
    await measure(page, size, quality, 'home');
    await enterBlade(page, 0); await snap(page, size, `memory-quality-${quality}`); await measure(page, size, quality, 'apps');
    await key(page, 'Escape'); await page.waitForTimeout(400);
  }
  await context.close();
}

for (const size of sizes) await captureSize(size);
await browser.close();
await fs.writeFile(path.join(root, 'qa', 'performance.json'), JSON.stringify(performanceResults, null, 2));
console.log(`Captured screenshots to ${out}`);
