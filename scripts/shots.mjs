// Responsive screenshots for QA. Writes to .shots/ (git-ignored).
//   npm run shots                 first screen + full page at 360, 768, 1024, 1440
//   npm run shots -- story        also captures each act of the 3D story at 1440×900
import { mkdirSync } from 'node:fs';
import { launch, serve } from './_browser.mjs';

const OUT = '.shots';
mkdirSync(OUT, { recursive: true });
const WIDTHS = [
  [360, 780],
  [768, 1024],
  [1024, 768],
  [1440, 900],
];
const story = process.argv.includes('story');

const { url, stop } = await serve(5192);
const browser = await launch();
const errors = [];
try {
  for (const [w, h] of WIDTHS) {
    const page = await browser.newPage();
    page.on('pageerror', (e) => errors.push(`${w}: ${e.message}`));
    page.on('console', (m) => m.type() === 'error' && errors.push(`${w}: ${m.text()}`));
    await page.setViewport({ width: w, height: h });
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: `${OUT}/first-${w}.png` });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (overflow > 0) errors.push(`${w}: horizontal overflow of ${overflow}px`);
    for (const id of ['intro', 'reality', 'platform', 'build', 'proof', 'prove-it', 'contact', 'sources']) {
      await page.evaluate((i) => document.getElementById(i)?.scrollIntoView({ block: 'start' }), id);
      await new Promise((r) => setTimeout(r, 700));
      await page.screenshot({ path: `${OUT}/${w}-${id}.png` });
    }
    await page.close();
  }

  if (story) {
    const page = await browser.newPage();
    page.on('pageerror', (e) => errors.push(`story: ${e.message}`));
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(url, { waitUntil: 'networkidle0' });
    const acts = ['act-day-one', 'act-data-model', 'act-cost', 'act-operations', 'act-governance', 'act-ai-data', 'act-finale'];
    for (const [i, id] of acts.entries()) {
      for (const f of [0.3, 0.55]) {
        await page.evaluate(
          (a, frac) => {
            const el = document.getElementById(a);
            if (!el) return;
            const top = el.getBoundingClientRect().top + scrollY;
            scrollTo(0, top + el.offsetHeight * frac - innerHeight * 0.6);
          },
          id,
          f,
        );
        await new Promise((r) => setTimeout(r, 2200));
        await page.screenshot({ path: `${OUT}/story-${i}-${Math.round(f * 100)}.png` });
      }
    }
    await page.close();
  }
} finally {
  await browser.close();
  stop();
}
if (errors.length) {
  console.error('Issues:\n' + errors.join('\n'));
  process.exitCode = 1;
} else console.log(`Screenshots in ${OUT}/`);
