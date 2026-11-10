// Captures one still per story act from the live 3D scene, for visitors without WebGL or with
// reduced motion. Writes public/assets/stills/act-{0..6}.webp. Run after `npm run build`, then
// rebuild so the stills ship:  npm run build && npm run stills && npm run build
import { mkdirSync } from 'node:fs';
import { launch, serve } from './_browser.mjs';

const OUT = 'public/assets/stills';
const ACTS = ['act-day-one', 'act-data-model', 'act-cost', 'act-operations', 'act-governance', 'act-ai-data', 'act-finale'];
// Where in each act the scene is complete and the text cards are out of the way.
const FRAC = [0.42, 0.44, 0.44, 0.44, 0.44, 0.46, 0.4];

mkdirSync(OUT, { recursive: true });
const { url, stop } = await serve(5195);
const browser = await launch();
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 956, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle0' });
  for (const [i, id] of ACTS.entries()) {
    await page.evaluate(
      (a, f) => {
        const el = document.getElementById(a);
        const top = el.getBoundingClientRect().top + scrollY;
        scrollTo(0, top + el.offsetHeight * f - innerHeight * 0.6);
      },
      id,
      FRAC[i],
    );
    await new Promise((r) => setTimeout(r, 3200));
    // Hide the scrolling cards and HUD so the still is just the world.
    await page.addStyleTag({ content: '#checks > .relative.z-20 { visibility: hidden !important } #checks .pointer-events-none.absolute.inset-0.z-10 { display: none !important }' });
    await new Promise((r) => setTimeout(r, 300));
    const y = await page.evaluate(() => scrollY);
    // clip is in document coordinates; skip the 56px banner.
    await page.screenshot({ path: `${OUT}/act-${i}.webp`, type: 'webp', quality: 72, clip: { x: 0, y: y + 56, width: 1600, height: 900 } });
    await page.evaluate(() => document.querySelectorAll('style').forEach((s) => s.textContent?.includes('visibility: hidden !important') && s.remove()));
    console.log(`${OUT}/act-${i}.webp`);
  }
} finally {
  await browser.close();
  stop();
}
