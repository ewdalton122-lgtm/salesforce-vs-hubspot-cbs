export type CalcOption = {
  id: string;
  vendor: 'HubSpot' | 'Salesforce';
  label: string;
  seatPrice: number;
  onboardingPerHub?: number;
  addons?: Record<string, { monthly?: number; perSeatMonthly?: number }>;
};

export type CalcInputs = {
  salesSeats: number;
  serviceSeats: number;
  years: number;
  includeDataHub: boolean;
  includeSfApiAddon: boolean;
};

export type CalcResult = {
  id: string;
  vendor: CalcOption['vendor'];
  label: string;
  annual: number;
  oneTime: number;
  total: number;
};

/**
 * cost-calculator.json formula:
 * annual = seats * seatPrice * 12 + addonMonthly * 12 + addonPerSeatMonthly * seats * 12
 * total  = annual * years + onboardingPerHub * hubs   (one-time, HubSpot only; hubs = hubs with seats > 0)
 */
export function computeOption(opt: CalcOption, inp: CalcInputs): CalcResult {
  const seats = inp.salesSeats + inp.serviceSeats;
  let addonMonthly = 0;
  let addonPerSeatMonthly = 0;
  const flags: Record<string, boolean> = { includeDataHub: inp.includeDataHub, includeSfApiAddon: inp.includeSfApiAddon };
  for (const [flag, a] of Object.entries(opt.addons ?? {})) {
    if (!flags[flag]) continue;
    addonMonthly += a.monthly ?? 0;
    addonPerSeatMonthly += a.perSeatMonthly ?? 0;
  }
  const annual = seats * opt.seatPrice * 12 + addonMonthly * 12 + addonPerSeatMonthly * seats * 12;
  const hubs = (inp.salesSeats > 0 ? 1 : 0) + (inp.serviceSeats > 0 ? 1 : 0);
  const oneTime = opt.vendor === 'HubSpot' ? (opt.onboardingPerHub ?? 0) * hubs : 0;
  return { id: opt.id, vendor: opt.vendor, label: opt.label, annual, oneTime, total: annual * inp.years + oneTime };
}

export function computeAll(options: CalcOption[], inp: CalcInputs): CalcResult[] {
  return options.map((o) => computeOption(o, inp));
}

/** The tier jump the cost check headlines: HubSpot's entry tier seat price vs. the tier with the capabilities. */
export function tierJump(options: CalcOption[]) {
  const pro = options.find((o) => o.id === 'hs-pro');
  const ent = options.find((o) => o.id === 'hs-ent');
  const sf = options.find((o) => o.id === 'sf-pro');
  if (!pro || !ent || !sf) throw new Error('cost-calculator.json is missing hs-pro, hs-ent or sf-pro');
  return { from: pro.seatPrice, to: ent.seatPrice, pct: Math.round(((ent.seatPrice - pro.seatPrice) / pro.seatPrice) * 100), sf: sf.seatPrice };
}

export const usd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
