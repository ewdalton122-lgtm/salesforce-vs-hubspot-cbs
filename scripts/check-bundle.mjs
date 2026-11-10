// Fails if editor-only guidance from the content JSON made it into the built site.
// Run after `npm run build`:  npm run check:bundle
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Field names may appear in the schema code; their values must not.
const BANNED = ['#marketinglegal', 'presentationRules:[', 'guardrail:"', '_note:"', 'Do NOT publish', 'decks are Confidential', 'Never claim Salesforce', 'seller guide', "Don't state an allotment", 'Recheck beta status'];
const dir = 'dist/assets';
let bad = 0;
for (const f of readdirSync(dir).filter((f) => /\.(js|css|html)$/.test(f))) {
  const text = readFileSync(join(dir, f), 'utf8');
  for (const b of BANNED) if (text.includes(b)) (bad++, console.error(`FAIL  ${f} contains "${b}"`));
}
if (bad) process.exit(1);
console.log('Bundle check passed: no editor-only guidance in dist/.');
