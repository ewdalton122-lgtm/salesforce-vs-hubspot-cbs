// Video fit check: at common desktop sizes, the whole video frame (native controls included) must be
// inside the first screen, below the banner, with nothing on top of it.
// Run after `npm run build`:  npm run check:fit
import { launch, serve } from './_browser.mjs';

const SIZES = [
  [1280, 720],
  [1366, 768],
  [1440, 900],
  [1536, 864],
  [1920, 1080],
  [2560, 1440],
  // Typical inner viewports once browser tabs and toolbars take their share.
  [1280, 632],
  [1440, 789],
  [1512, 830],
];

const { url, stop } = await serve();
const browser = await launch();
let failures = 0;
try {
  for (const [w, h] of SIZES) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h });
    await page.goto(url, { waitUntil: 'networkidle0' });
    const r = await page.evaluate(() => {
      const v = document.querySelector('#top video');
      const banner = document.querySelector('header');
      if (!v) return { error: 'no video' };
      const b = v.getBoundingClientRect();
      const bannerBottom = banner ? banner.getBoundingClientRect().bottom : 0;
      const inset = 24; // past the frame's rounded corners
      const pts = [
        [b.left + inset, b.top + inset],
        [b.right - inset, b.top + inset],
        [b.left + inset, b.bottom - inset],
        [b.right - inset, b.bottom - inset],
        [(b.left + b.right) / 2, (b.top + b.bottom) / 2],
      ];
      const blocked = pts.filter(([x, y]) => document.elementFromPoint(x, y) !== v).map(([x, y]) => {
        const el = document.elementFromPoint(x, y);
        return `${Math.round(x)},${Math.round(y)} → ${el ? el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : '') : 'nothing'}`;
      });
      return {
        box: [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)],
        inView: b.top >= bannerBottom - 0.5 && b.bottom <= innerHeight + 0.5 && b.left >= 0 && b.right <= innerWidth + 0.5,
        ratio: +(b.width / b.height).toFixed(3),
        blocked,
        scrollY,
      };
    });
    const ok = !r.error && r.inView && r.blocked.length === 0 && Math.abs(r.ratio - 16 / 9) < 0.01 && r.scrollY === 0;
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${w}×${h}  video ${r.box?.join(' ')}  ratio ${r.ratio}${r.blocked?.length ? '  blocked: ' + r.blocked.join('; ') : ''}${r.error ? '  ' + r.error : ''}`);
    await page.close();
  }
} finally {
  await browser.close();
  stop();
}
if (failures) {
  console.error(`\n${failures} size(s) failed the video fit check.`);
  process.exit(1);
}
console.log('\nVideo fits the first screen, unobstructed, at every desktop size.');
