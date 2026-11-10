export type Need = {
  id: string;
  label: string;
  hubspot: string;
  monthly?: number;
  packs?: { id: string; label: string; credits: number; monthly: number }[];
};

export type TcoConfig = {
  salesforce: { seatPrice: number; extras: string[] };
  hubspot: { seatPrice: number; onboardingPerHub: number };
  needs: Need[];
};

export type TcoInputs = {
  salesSeats: number;
  serviceSeats: number;
  years: number;
  needs: Record<string, boolean>;
  pack: string;
};

export type StackLine = { id: string; amount: number; monthly?: number };

export type TcoResult = {
  seats: number;
  months: number;
  hubs: number;
  salesforce: number;
  hubspot: number;
  stack: StackLine[];
};

export const needMonthly = (n: Need, pack: string) => (n.packs ? (n.packs.find((p) => p.id === pack) ?? n.packs[0]).monthly : (n.monthly ?? 0));

/**
 * cost-calculator.json formula:
 * salesforce = seats * seatPrice * 12 * years
 * hubspot    = seats * seatPrice * 12 * years + onboardingPerHub * hubs (one-time) + sum(need monthly) * 12 * years
 */
export function computeTco(cfg: TcoConfig, inp: TcoInputs): TcoResult {
  const seats = inp.salesSeats + inp.serviceSeats;
  const months = inp.years * 12;
  const hubs = (inp.salesSeats > 0 ? 1 : 0) + (inp.serviceSeats > 0 ? 1 : 0);
  const stack: StackLine[] = [
    { id: 'seats', amount: seats * cfg.hubspot.seatPrice * months },
    { id: 'onboarding', amount: hubs * cfg.hubspot.onboardingPerHub },
    ...cfg.needs.filter((n) => inp.needs[n.id]).map((n) => {
      const monthly = needMonthly(n, inp.pack);
      return { id: n.id, amount: monthly * months, monthly };
    }),
  ];
  return {
    seats,
    months,
    hubs,
    salesforce: seats * cfg.salesforce.seatPrice * months,
    hubspot: stack.reduce((s, l) => s + l.amount, 0),
    stack,
  };
}

export type Verdict =
  | { kind: 'under'; diff: number; pct: number; text: string }
  | { kind: 'more'; perUserMonth: number; text: string };

const list = (items: string[]) => (items.length < 3 ? items.join(' and ') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);

/** Scoped to the user's picks and list prices; never an overall "cheaper" claim. */
export function tcoVerdict(cfg: TcoConfig, r: TcoResult, years: number): Verdict {
  const yrs = `${years} ${years === 1 ? 'year' : 'years'}`;
  if (r.salesforce <= r.hubspot) {
    const diff = r.hubspot - r.salesforce;
    return {
      kind: 'under',
      diff,
      pct: Math.round((diff / r.hubspot) * 100),
      text: `For what you picked, one Salesforce license comes in ${usd(diff)} under the HubSpot stack over ${yrs}, at list.`,
    };
  }
  const perUserMonth = Math.ceil((r.salesforce - r.hubspot) / (r.seats * r.months));
  return {
    kind: 'more',
    perUserMonth,
    text: `About $${perUserMonth} more per user per month at list, and the license includes ${list(cfg.salesforce.extras)}. None of them are in the HubSpot total.`,
  };
}

/** HubSpot's entry tier seat vs. the top tier, where custom objects, sandboxes and field-level permissions live. */
export function tierJump({ entrySeat, topSeat }: { entrySeat: number; topSeat: number }) {
  return { from: entrySeat, to: topSeat, pct: Math.round(((topSeat - entrySeat) / entrySeat) * 100) };
}

export const usd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
