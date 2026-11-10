import { creditMath, type CreditAssumptions } from './credits';

export type SimInputs = {
  brands: number;
  locations: number;
  users: number;
  linesOfBusiness: number;
  technicians: number;
  aiConversations: number;
  erp: boolean;
  dispatch: boolean;
  phone: boolean;
  warehouse: boolean;
};

export type SimRule = {
  id: string;
  check: string;
  hubspot: { text: string; pill: string; source: string };
  salesforce: { text: string; source: string };
};

type Ctx = SimInputs & { creditsNeeded: number; includedCredits: number };

// Typed predicates, keyed by rule id. The trigger strings in simulator.json document these.
export const TRIGGERS: Record<string, (c: Ctx) => boolean> = {
  lob: (c) => c.linesOfBusiness >= 2,
  brands: (c) => c.brands >= 2,
  access: (c) => c.brands >= 2 || c.linesOfBusiness >= 2,
  users: (c) => c.users > 2500,
  field: (c) => c.technicians > 0,
  voice: (c) => c.phone === true,
  erp: (c) => c.erp === true || c.dispatch === true,
  warehouse: (c) => c.warehouse === true,
  ai: (c) => c.aiConversations > 0 && c.creditsNeeded > c.includedCredits,
};

export type Finding = SimRule & { hubspotText: string };

export function evaluate(inputs: SimInputs, rules: SimRule[], a: CreditAssumptions) {
  const credits = creditMath(inputs.aiConversations, a);
  const ctx: Ctx = { ...inputs, creditsNeeded: credits.creditsNeeded, includedCredits: a.includedCredits };
  const findings: Finding[] = [];
  for (const r of rules) {
    const pred = TRIGGERS[r.id];
    if (!pred) throw new Error(`No trigger predicate for simulator rule "${r.id}"`);
    if (!pred(ctx)) continue;
    const n = credits.daysCovered;
    findings.push({ ...r, hubspotText: r.hubspot.text.replace('{daysCovered} days', `${n} ${n === 1 ? 'day' : 'days'}`).replace('{daysCovered}', String(n)) });
  }
  const counts: Record<string, number> = {};
  for (const f of findings) counts[f.hubspot.pill] = (counts[f.hubspot.pill] ?? 0) + 1;
  return { findings, counts, credits };
}

const KEYS: Array<[keyof SimInputs, string]> = [
  ['brands', 'b'], ['locations', 'l'], ['users', 'u'], ['linesOfBusiness', 'lob'], ['technicians', 't'],
  ['aiConversations', 'ai'], ['erp', 'erp'], ['dispatch', 'd'], ['phone', 'p'], ['warehouse', 'w'],
];

export function encodeInputs(i: SimInputs): string {
  const p = new URLSearchParams();
  for (const [k, short] of KEYS) {
    const v = i[k];
    p.set(short, typeof v === 'boolean' ? (v ? '1' : '0') : String(v));
  }
  return p.toString();
}

export function decodeInputs(qs: string, fallback: SimInputs): SimInputs {
  const p = new URLSearchParams(qs);
  const out: SimInputs = { ...fallback };
  for (const [k, short] of KEYS) {
    const raw = p.get(short);
    if (raw === null) continue;
    if (typeof fallback[k] === 'boolean') (out[k] as boolean) = raw === '1';
    else {
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 0) (out[k] as number) = Math.round(n);
    }
  }
  return out;
}
