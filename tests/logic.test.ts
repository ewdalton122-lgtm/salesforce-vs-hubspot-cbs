import { describe, expect, it } from 'vitest';
import { cost, simulator, journey, growth, industryById } from '../src/lib/content';
import { computeAll, computeOption, tierJump, type CalcOption } from '../src/lib/calc';
import { creditMath, creditCalendar } from '../src/lib/credits';
import { evaluate, encodeInputs, decodeInputs, type SimInputs } from '../src/lib/simulator';
import { computeHandoffs, computeSystems, tallyUpTo } from '../src/lib/journey';
import { growthCounts } from '../src/lib/growth';
import { numberSources } from '../src/lib/footnotes';
import { footnoteNumbers, pageSourceOrder } from '../src/lib/sourceOrder';

const options = cost.options as CalcOption[];
const base = { salesSeats: 30, serviceSeats: 20, years: 3, includeDataHub: false, includeSfApiAddon: false };
const ref = cost.referenceCheck as Record<string, { annual: number; threeYear: number }>;
const opt = (id: string) => options.find((o) => o.id === id)!;

describe('cost calculator matches cost-calculator.json referenceCheck', () => {
  const cases: Array<[string, string, Partial<typeof base>]> = [
    ['hs-pro', 'hs-pro', {}],
    ['hs-ent', 'hs-ent', {}],
    ['hs-ent+dataHub', 'hs-ent', { includeDataHub: true }],
    ['sf-pro', 'sf-pro', {}],
    ['sf-pro+api', 'sf-pro', { includeSfApiAddon: true }],
    ['sf-core', 'sf-core', {}],
  ];
  for (const [key, id, extra] of cases) {
    it(key, () => {
      const r = computeOption(opt(id), { ...base, ...extra });
      expect(r.annual).toBe(ref[key].annual);
      expect(r.total).toBe(ref[key].threeYear);
    });
  }
  it('onboarding is one-time and per hub with seats', () => {
    const r = computeOption(opt('hs-pro'), { ...base, serviceSeats: 0, years: 1 });
    expect(r.oneTime).toBe(1500);
  });
  it('Salesforce options carry no onboarding fee', () => {
    computeAll(options, base).filter((r) => r.vendor === 'Salesforce').forEach((r) => expect(r.oneTime).toBe(0));
  });
  it('tier jump is $90 -> $150, +67%, vs Pro Suite $100', () => {
    expect(tierJump(options)).toEqual({ from: 90, to: 150, pct: 67, sf: 100 });
  });
});

const A = simulator.assumptions;

describe('AI credit math', () => {
  it('1,000 conversations -> 50,000 credits, ~1,666.67/day, 3 days covered', () => {
    const r = creditMath(1000, A);
    expect(r.creditsNeeded).toBe(50000);
    expect(r.dailyBurn).toBeCloseTo(1666.67, 2);
    expect(r.daysCovered).toBe(3);
  });
  it('2,000 conversations -> 1 day covered', () => {
    expect(creditMath(2000, A)).toMatchObject({ creditsNeeded: 100000, daysCovered: 1 });
  });
  it('100 conversations -> fits the allowance, 30 days', () => {
    expect(creditMath(100, A)).toMatchObject({ creditsNeeded: 5000, daysCovered: 30, exceeds: false });
  });
  it('calendar marks covered days', () => {
    const cal = creditCalendar(3);
    expect(cal.length).toBe(30);
    expect(cal.filter(Boolean).length).toBe(3);
  });
});

describe('Build Your Future simulator', () => {
  const generic = industryById('all').simulatorDefaults as SimInputs;
  const run = (i: Partial<SimInputs>) => evaluate({ ...generic, ...i }, simulator.rules, A);

  it('generic defaults trigger lob, brands, access, field, voice, erp, ai', () => {
    const ids = run({}).findings.map((f) => f.id);
    expect(ids).toEqual(['lob', 'brands', 'access', 'field', 'voice', 'erp', 'ai']);
    expect(ids).not.toContain('users');
    expect(ids).not.toContain('warehouse');
  });
  it('3,000 users triggers the user cap', () => {
    expect(run({ users: 3000 }).findings.map((f) => f.id)).toContain('users');
  });
  it('warehouse toggle triggers Data Hub', () => {
    expect(run({ warehouse: true }).findings.map((f) => f.id)).toContain('warehouse');
  });
  it('100 conversations does not trigger the AI rule; 0 does not either', () => {
    expect(run({ aiConversations: 100 }).findings.map((f) => f.id)).not.toContain('ai');
    expect(run({ aiConversations: 0 }).findings.map((f) => f.id)).not.toContain('ai');
  });
  it('AI finding interpolates days covered', () => {
    const ai = run({ aiConversations: 1000 }).findings.find((f) => f.id === 'ai')!;
    expect(ai.hubspotText).toContain('about 3 days');
  });
  it('a single small business triggers nothing', () => {
    const r = run({ technicians: 0, phone: false, erp: false, dispatch: false, brands: 1, linesOfBusiness: 1, aiConversations: 0, warehouse: false });
    expect(r.findings).toHaveLength(0);
  });
  it('URL state round-trips', () => {
    const i = { ...generic, brands: 9, warehouse: true };
    expect(decodeInputs(encodeInputs(i), generic)).toEqual(i);
  });
  it('every industry default set evaluates without error', async () => {
    const { industries } = await import('../src/lib/content');
    industries.forEach((ind) => expect(() => evaluate(ind.simulatorDefaults as SimInputs, simulator.rules, A)).not.toThrow());
  });
});

describe('Follow the Call', () => {
  it('HubSpot path touches 3 systems with 4 handoffs (computed from journey.json)', () => {
    expect(computeSystems(journey.steps)).toEqual(['HubSpot', 'Marketplace field service app', 'ERP integration (custom or partner)']);
    expect(computeHandoffs(journey.steps)).toBe(4);
  });
  it('native HubSpot steps stay native (fairness)', () => {
    expect(journey.steps.filter((s) => s.hubspot.status === 'native').map((s) => s.n)).toEqual([2, 3, 6]);
  });
  it('running tally', () => {
    expect(tallyUpTo(journey.steps, 2)).toEqual({ systems: 1, handoffs: 0 });
    expect(tallyUpTo(journey.steps, 3)).toEqual({ systems: 2, handoffs: 1 });
  });
});

describe('Cost of growing tower', () => {
  it('after all 7 stages: 11 HubSpot blocks, 7 Salesforce tiles, 3 with license tags', () => {
    expect(growthCounts(growth.stages, 7)).toEqual({ hubspotBlocks: 11, salesforceTiles: 7, salesforceAddOns: 3 });
  });
  it('stage 0 is empty', () => {
    expect(growthCounts(growth.stages, 0)).toEqual({ hubspotBlocks: 0, salesforceTiles: 0, salesforceAddOns: 0 });
  });
});

describe('footnote numbering', () => {
  it('numbers on first appearance, skips positioning and duplicates', () => {
    const m = numberSources(['a', 'positioning', 'b', 'a', 'c']);
    expect([...m.entries()]).toEqual([['a', 1], ['b', 2], ['c', 3]]);
  });
  it('page numbering is contiguous from 1', () => {
    const nums = [...footnoteNumbers.values()];
    expect(nums[0]).toBe(1);
    expect(nums).toEqual(nums.map((_, i) => i + 1));
  });
  it('the social variant leaves the CSM source out and stays contiguous', () => {
    const social = numberSources(pageSourceOrder({ includeCsm: false }));
    expect(social.has('csm-fy27')).toBe(false);
    expect(footnoteNumbers.has('csm-fy27')).toBe(true);
    const nums = [...social.values()];
    expect(nums).toEqual(nums.map((_, i) => i + 1));
  });
});
