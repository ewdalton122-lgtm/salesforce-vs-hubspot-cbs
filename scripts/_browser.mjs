// Shared Puppeteer setup: uses a globally installed puppeteer-core with a local Chrome,
// so the project doesn't download a browser.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);

export function loadPuppeteer() {
  const candidates = ['puppeteer-core', '/opt/homebrew/lib/node_modules/puppeteer-core', '/usr/local/lib/node_modules/puppeteer-core'];
  for (const c of candidates) {
    try {
      return require(c);
    } catch {
      /* try the next one */
    }
  }
  throw new Error('puppeteer-core not found. Install it globally: npm i -g puppeteer-core');
}

// Managed Chrome installs can block DevTools automation by policy, so prefer Chrome for Testing
// (installed by `npx playwright install chromium`) and fall back to the system Chrome.
function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const cache = join(homedir(), 'Library/Caches/ms-playwright');
  if (existsSync(cache)) {
    const dirs = readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse();
    for (const d of dirs) {
      const p = join(cache, d, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
      if (existsSync(p)) return p;
    }
  }
  return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
}
export const CHROME = findChrome();

export async function launch() {
  const puppeteer = loadPuppeteer();
  return puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    userDataDir: `/tmp/sfhs-shots-${Date.now()}`,
    args: ['--no-sandbox', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--mute-audio'],
  });
}

/** Starts `vite preview` on the given port unless BASE_URL is set; returns { url, stop }. */
export async function serve(port = 5191) {
  if (process.env.BASE_URL) return { url: process.env.BASE_URL, stop: () => {} };
  const child = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], { stdio: 'pipe' });
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('vite preview did not start')), 20000);
    child.stdout.on('data', (d) => {
      if (String(d).includes(String(port))) {
        clearTimeout(t);
        resolve();
      }
    });
    child.on('exit', (code) => reject(new Error(`vite preview exited with ${code}`)));
  });
  return { url: `http://localhost:${port}/`, stop: () => child.kill() };
}
