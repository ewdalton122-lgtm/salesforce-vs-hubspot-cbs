import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { checks, cost, simulator, journey, growth, industries, industryById, platform, sources, story, storyFor, journeyStepsFor, growthStagesFor, pointsFor, fillObjects } from '../src/lib/content';
import { computeTco, tcoVerdict, tierJump, type TcoInputs } from '../src/lib/calc';
import { creditMath, creditCalendar } from '../src/lib/credits';
import { BASELINE, evaluate, encodeInputs, decodeInputs, hasScenario, TRIGGERS, type SimInputs } from '../src/lib/simulator';
import { computeHandoffs, computeSystems, tallyUpTo } from '../src/lib/journey';
import { growthCounts } from '../src/lib/growth';
import { numberSources } from '../src/lib/footnotes';
import { footnoteNumbers, pageSourceOrder } from '../src/lib/sourceOrder';

const none = Object.fromEntries(cost.needs.map((n) => [n.id, false]));
const defaultNeeds = Object.fromEntries(cost.needs.map((n) => [n.id, n.default]));
const base: TcoInputs = { salesSeats: 30, serviceSeats: 20, years: 3, needs: none, pack: 'growth' };
// The fixture is editor-only and stripped from the bundle, so read it from the source file.
const ref = JSON.parse(readFileSync('src/content/cost-calculator.json', 'utf8')).referenceCheck as Record<string, number>;
const tco = (extra: Partial<TcoInputs> = {}) => computeTco(cost, { ...base, ...extra });

describe('bundle vs. stack matches cost-calculator.json referenceCheck', () => {
  it('one Salesforce license', () => expect(tco().salesforce).toBe(ref.salesforce));
  it('HubSpot top tier, no add-ons', () => expect(tco().hubspot).toBe(ref['hubspot-none']));
  it('HubSpot + sync + second sandbox', () => expect(tco({ needs: { ...none, sync: true, sandbox: true } }).hubspot).toBe(ref['hubspot-sync-sandbox']));
  it('HubSpot with the default needs', () => expect(tco({ needs: defaultNeeds }).hubspot).toBe(ref['hubspot-defaults']));
  it('onboarding is one-time and per hub with users', () => {
    expect(tco({ serviceSeats: 0, years: 1 }).stack.find((l) => l.id === 'onboarding')!.amount).toBe(3500);
  });
  it('the stack adds up to the HubSpot total', () => {
    const r = tco({ needs: defaultNeeds });
    expect(r.stack.reduce((s, l) => s + l.amount, 0)).toBe(r.hubspot);
  });
  it('tier jump is $90 -> $150, +67%', () => {
    expect(tierJump(cost.tierJump)).toEqual({ from: 90, to: 150, pct: 67 });
  });
});

describe('the cost verdict stays honest', () => {
  it('says "under" only when Salesforce really costs less, and never claims cheaper overall', () => {
    const { salesSeats: s, serviceSeats: v, years } = cost.inputs;
    const combos = [none, defaultNeeds, Object.fromEntries(cost.needs.map((n) => [n.id, true]))];
    let under = 0;
    let more = 0;
    for (let sales = s.min; sales <= s.max; sales += 13)
      for (let service = v.min; service <= v.max; service += 17)
        for (const y of years.options)
          for (const needs of combos)
            for (const pack of ['base', 'growth', 'scaled']) {
              const inp = { salesSeats: sales, serviceSeats: service, years: y, needs, pack };
              const r = computeTco(cost, inp);
              const vd = tcoVerdict(cost, r, y);
              expect(vd.text).not.toMatch(/cheaper|lowest|always|overall/i);
              if (vd.kind === 'under') {
                under++;
                expect(r.salesforce).toBeLessThanOrEqual(r.hubspot);
                expect(vd.text).toMatch(/^For what you picked/);
                expect(vd.text).toMatch(/at list\.$/);
              } else {
                more++;
                expect(r.salesforce).toBeGreaterThan(r.hubspot);
                expect(vd.perUserMonth * r.seats * r.months).toBeGreaterThanOrEqual(r.salesforce - r.hubspot);
                expect(vd.text).not.toMatch(/under/);
              }
            }
    expect(under).toBeGreaterThan(0);
    expect(more).toBeGreaterThan(0);
  });
  it('the defaults show the scoped "under" verdict', () => {
    const r = tco({ needs: defaultNeeds });
    expect(tcoVerdict(cost, r, 3)).toMatchObject({ kind: 'under', diff: 39400 });
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
  it('the day-one baseline triggers nothing', () => {
    expect(evaluate(BASELINE, simulator.rules, A).findings).toHaveLength(0);
  });
  it('each control lights exactly its own tile from the baseline', () => {
    const moves: Array<[Partial<SimInputs>, string]> = [
      [{ brands: 2 }, 'brands'], [{ accessTeams: 2 }, 'access'], [{ users: 2525 }, 'users'], [{ linesOfBusiness: 2 }, 'lob'],
      [{ technicians: 5 }, 'field'], [{ aiConversations: 200 }, 'ai'], [{ phone: true }, 'voice'], [{ erp: true }, 'erp'], [{ warehouse: true }, 'warehouse'],
    ];
    for (const [move, id] of moves) expect(evaluate({ ...BASELINE, ...move }, simulator.rules, A).findings.map((f) => f.id)).toEqual([id]);
    expect(new Set(moves.map(([, id]) => id)).size).toBe(Object.keys(TRIGGERS).length);
  });
  it('only a link with scenario keys overrides the baseline', () => {
    expect(hasScenario('')).toBe(false);
    expect(hasScenario('seller=x')).toBe(false);
    expect(hasScenario(encodeInputs(BASELINE))).toBe(true);
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

describe('industry tailoring', () => {
  const FIELD_WORDS = /technician|dispatch|\bcrews?\b|\btrucks?\b|field service|work order|hvac|\bpickups?\b|in the field/i;
  const OFFICE_WORDS = /\bmatters?\b|candidates?|placements?|job orders?|\bintake\b|\bshippers?\b|\bloads?\b/i;

  /** Every line the story, the call, the growth stack, the check cards and the hidden costs show for one industry. */
  const copyFor = (id: string) => {
    const ind = industryById(id);
    const told = storyFor(ind);
    const lines: string[] = [told.finaleBody, (journey.scenarios as Record<string, string>)[id] ?? journey.scenarios.all];
    told.acts.forEach((a) => lines.push(a.scene, a.sfVisual, a.hsVisual, a.verdict, ...a.frictions.map((f) => f.label)));
    journeyStepsFor(ind).forEach((s) => lines.push(s.title, s.salesforce.product, s.salesforce.text, s.hubspot.system, s.hubspot.text));
    growthStagesFor(ind).forEach((s) => lines.push(s.title, s.salesforce.label, ...s.hubspot.map((h) => h.label)));
    checks.checks.forEach((c) => lines.push(fillObjects(c.salesforce.headline, ind)));
    checks.checks.forEach((c) => [...pointsFor(c.salesforce.points, ind), ...pointsFor(c.hubspot.points, ind)].forEach((p) => lines.push(p.label)));
    cost.hiddenCosts.items.filter((h) => ind.field || !cost.hiddenCosts.fieldOnly.includes(h)).forEach((h) => lines.push(h));
    cost.excluded.filter((e) => ind.field || !e.fieldOnly).forEach((e) => lines.push(e.label));
    Object.values(platform.examples[id] ?? {}).forEach((l) => lines.push(...l));
    return lines;
  };

  for (const ind of industries.filter((i) => !i.field)) {
    it(`${ind.label}: no field-service wording`, () => {
      expect(copyFor(ind.id).filter((l) => FIELD_WORDS.test(l))).toEqual([]);
    });
  }

  for (const ind of industries.filter((i) => i.field && i.id !== 'all')) {
    it(`${ind.label}: no staffing, legal or logistics wording in its own story and call`, () => {
      const own = [
        ...Object.values(story.byIndustry[ind.id]?.acts ?? {}).flatMap((a) => Object.values(a)),
        story.byIndustry[ind.id]?.finaleBody ?? '',
        ...Object.values(journey.byIndustry[ind.id] ?? {}).flatMap((v) => [v.title ?? '', v.salesforce?.text ?? '', v.hubspot?.text ?? '']),
        (journey.scenarios as Record<string, string>)[ind.id],
      ];
      expect(own.filter((l) => OFFICE_WORDS.test(l))).toEqual([]);
    });
  }

  it('check cards name each industry\'s own objects', () => {
    expect(fillObjects(checks.checks[0].salesforce.headline, industryById('all'))).toBe('Build your real business: projects, work orders, job orders, matters, SOWs and how they connect.');
    expect(fillObjects('{objects}', industryById('proserv'))).toBe('matters, engagements, SOWs, intake, time & billing');
  });

  it('every industry has its own story scenes and call', () => {
    for (const ind of industries.filter((i) => i.id !== 'all')) {
      expect(Object.keys(story.byIndustry[ind.id]?.acts ?? {})).toHaveLength(5);
      expect((journey.scenarios as Record<string, string>)[ind.id]).toBeTruthy();
    }
  });

  it('office paths stay fair: native HubSpot steps render as native, systems and handoffs are computed', () => {
    const legal = journeyStepsFor(industryById('proserv'));
    expect(computeSystems(legal)).toEqual(['HubSpot', 'ERP integration (custom or partner)']);
    expect(computeHandoffs(legal)).toBe(2);
    const staffing = journeyStepsFor(industryById('staffing'));
    expect(computeSystems(staffing)).toEqual(['HubSpot', 'Applicant tracking system', 'ERP integration (custom or partner)']);
    expect(computeHandoffs(staffing)).toBe(4);
  });

  it('office growth stack keeps the same block counts', () => {
    expect(growthCounts(growthStagesFor(industryById('proserv')), 7)).toEqual({ hubspotBlocks: 11, salesforceTiles: 7, salesforceAddOns: 3 });
  });

  it('every industry-variant source is numbered', () => {
    const ids = new Set(pageSourceOrder());
    for (const ind of industries) {
      journeyStepsFor(ind).forEach((s) => {
        if (s.salesforce.source in sources) expect(ids.has(s.salesforce.source)).toBe(true);
        if (s.hubspot.source in sources) expect(ids.has(s.hubspot.source)).toBe(true);
      });
      growthStagesFor(ind).forEach((s) => expect(ids.has(s.salesforce.source)).toBe(true));
    }
  });
});
