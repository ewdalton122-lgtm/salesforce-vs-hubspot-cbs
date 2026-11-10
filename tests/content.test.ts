import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { sources, checks, proof, questions } from '../src/lib/content';

const ROOT = join(__dirname, '..');
const CONTENT = join(ROOT, 'src/content');
const SKIP_KEYS = new Set(['_note', 'guardrail', 'presentationRules', 'phrasing', 'note', 'distribution', 'aiNote', 'citation']);

type Hit = { file: string; path: string; value: string };

function walk(node: unknown, file: string, path: string, out: Hit[]) {
  if (typeof node === 'string') out.push({ file, path, value: node });
  else if (Array.isArray(node)) node.forEach((n, i) => walk(n, file, `${path}[${i}]`, out));
  else if (node && typeof node === 'object')
    for (const [k, v] of Object.entries(node)) if (!SKIP_KEYS.has(k)) walk(v, file, path ? `${path}.${k}` : k, out);
}

const files = readdirSync(CONTENT).filter((f) => f.endsWith('.json'));
const strings: Hit[] = [];
for (const f of files) walk(JSON.parse(readFileSync(join(CONTENT, f), 'utf8')), f, '', strings);
const mainStrings = strings.filter((s) => s.file !== 'cost-calculator.json' && s.file !== 'sources.json' && s.file !== 'sources.supplemental.json');

function sourceRefs(): Hit[] {
  const refs: Hit[] = [];
  for (const f of files) {
    if (f.startsWith('sources')) continue;
    const visit = (n: unknown, p: string) => {
      if (Array.isArray(n)) n.forEach((x, i) => visit(x, `${p}[${i}]`));
      else if (n && typeof n === 'object')
        for (const [k, v] of Object.entries(n)) {
          if (k === 'source' && typeof v === 'string') refs.push({ file: f, path: p, value: v });
          else visit(v, `${p}.${k}`);
        }
    };
    visit(JSON.parse(readFileSync(join(CONTENT, f), 'utf8')), '');
  }
  return refs;
}

describe('content integrity', () => {
  it('every source id resolves in sources.json or sources.supplemental.json', () => {
    const missing = sourceRefs().filter((r) => !(r.value in sources));
    expect(missing).toEqual([]);
  });
  it('internal and anonymized sources never carry a public link', () => {
    for (const [id, s] of Object.entries(sources)) if (s.internal || s.anonymized) expect(s.url, id).toBeNull();
  });
  it('five checks in the v4 order', () => {
    expect(checks.checks.map((c) => c.id)).toEqual(['data-model', 'cost', 'operations', 'governance', 'ai-data']);
  });
  it('the three video asks match the v4 video', () => {
    expect(questions.videoAsks.map((q) => q.askHubSpot)).toEqual([
      'Can you build our real objects, live?',
      'Can you run quote to service in one system?',
      'Can your AI use all our data, with guardrails?',
    ]);
  });
  it('CSM hero values are exact (ECRE 99% / 60%)', () => {
    const ecre = proof.customerSuccessMetrics.industries.find((i) => i.industry.startsWith('Engineering'))!;
    expect(ecre.metrics[0]).toEqual(['99%', 'Achieved positive ROI', 369]);
    expect(ecre.metrics[1]).toEqual(['60%', 'Percent ROI achieved', 367]);
  });
  it('every pricing claim file carries asOf', () => {
    expect(checks.asOf).toBeTruthy();
    for (const [id, s] of Object.entries(sources)) if (id.startsWith('hs-pricing') || id.startsWith('sf-pricing')) expect(s.asOf, id).toBeTruthy();
  });
});

describe('copy guardrails (main experience)', () => {
  const banned: Array<[string, RegExp]> = [
    ['"can\'t" absence claims', /\bcan[’']t\b/i],
    ['"nothing rolls up"', /nothing rolls up/i],
    ['"cheaper"', /cheaper/i],
    ['"no billing" (Revenue Hub exists)', /\bno (native )?billing\b|doesn[’']t (offer|have) billing/i],
    ['"no business units" (Teams exists)', /\bno business units\b/i],
    ['relative dates', /\blast (week|quarter|month)\b|\brecently\b|\bthis (july|year)\b/i],
    ['edition names', /Pro Suite|Starter Suite|HubSpot (Professional|Enterprise)|Sales Hub (Professional|Enterprise)|\b(Professional|Enterprise) (tier|plan|edition)\b/],
    ['per-seat prices', /\$\d[\d,.]*\s*(\/|per)\s*(user|seat)/i],
    ['customer names', /Feazel|Uni Recycle|Adecco|Axis Water|CPI Security|Grout Guy|Equipter|Boutique Recruiting|Broughton|Fisher & Paykel/],
    ['"Agentforce ARR $1.5B"', /1\.5B/],
  ];
  // HubSpot's own billing policy from its catalog, not an absence claim.
  const allowed = new Set(['checks.json checks[1].hubspot.points[1].label']);
  for (const [name, re] of banned) {
    it(`no ${name}`, () => {
      const hits = mainStrings
        .filter((s) => re.test(s.value) && !allowed.has(`${s.file} ${s.path}`))
        .map((s) => `${s.file} ${s.path}: ${s.value}`);
      expect(hits).toEqual([]);
    });
  }
});

describe('brand guardrails', () => {
  const codeFiles: string[] = [];
  const collect = (dir: string) => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) collect(p);
      else if (/\.(css|tsx?|html|svg)$/.test(f)) codeFiles.push(p);
    }
  };
  collect(join(ROOT, 'src'));
  collect(join(ROOT, 'public'));
  codeFiles.push(join(ROOT, 'index.html'));

  it('no HubSpot orange anywhere in code, CSS or SVG assets', () => {
    const hits = codeFiles.filter((f) => /#ff7a59|#ff5c35|#ff8f59|#f57722/i.test(readFileSync(f, 'utf8'))).map((f) => relative(ROOT, f));
    expect(hits).toEqual([]);
  });
  it('no HubSpot logo or sprocket asset', () => {
    const hits = codeFiles.filter((f) => /hubspot/i.test(f.split('/').pop()!)).map((f) => relative(ROOT, f));
    expect(hits).toEqual([]);
  });
  it('no analytics or tracker scripts', () => {
    const hits = codeFiles
      .filter((f) => /googletagmanager|google-analytics|gtag\(|hotjar|segment\.com|fonts\.googleapis/i.test(readFileSync(f, 'utf8')))
      .map((f) => relative(ROOT, f));
    expect(hits).toEqual([]);
  });
});
