import { z } from 'zod';
import checksJson from '../content/checks.json';
import sourcesJson from '../content/sources.json';
import sourcesExtraJson from '../content/sources.supplemental.json';
import proofJson from '../content/proof.json';
import questionsJson from '../content/questions.json';
import costJson from '../content/cost-calculator.json';
import sellersJson from '../content/sellers.json';
import industriesJson from '../content/industries.json';
import storyJson from '../content/story.json';
import journeyJson from '../content/journey.json';
import growthJson from '../content/growth.json';
import platformJson from '../content/platform.json';
import demoPathsJson from '../content/demoPaths.json';
import simulatorJson from '../content/simulator.json';
import siteJson from '../content/site.json';
import teamJson from '../content/team.json';

const SourceSchema = z.object({
  label: z.string(),
  url: z.string().url().nullable(),
  asOf: z.string().optional(),
  internal: z.boolean().optional(),
  anonymized: z.boolean().optional(),
  guardrail: z.string().optional(),
});
const SourcesSchema = z.object({ sources: z.record(SourceSchema) });

const PointSchema = z.object({
  label: z.string(),
  source: z.string(),
  guardrail: z.string().optional(),
  stat: z.object({ value: z.number(), suffix: z.string() }).optional(),
});
const CheckSchema = z.object({
  id: z.string(),
  number: z.number(),
  title: z.string(),
  titleAccent: z.string(),
  salesforce: z.object({ headline: z.string(), points: z.array(PointSchema), visual: z.string(), micrositeDetail: z.string().optional() }),
  hubspot: z.object({ headline: z.string(), points: z.array(PointSchema) }),
  askLive: z.string(),
});
const ChecksSchema = z.object({ asOf: z.string(), checks: z.array(CheckSchema).length(5) });

const MetricTuple = z.tuple([z.string(), z.string(), z.number()]);
const ProofSchema = z.object({
  customerSuccessMetrics: z.object({
    source: z.string(),
    global: z.array(MetricTuple),
    industries: z.array(z.object({ industry: z.string(), citationCustomers: z.number(), guardrail: z.string().optional(), metrics: z.array(MetricTuple) })),
    personas: z.array(z.object({ persona: z.string(), label: z.string(), guardrail: z.string().optional(), metrics: z.array(MetricTuple) })),
    citation: z.string().optional(),
  }),
  stories: z.array(
    z.object({
      id: z.string(),
      industry: z.string(),
      descriptor: z.string(),
      stats: z.array(z.object({ value: z.string(), label: z.string() })),
      products: z.array(z.string()),
      source: z.string(),
      guardrail: z.string().optional(),
      image: z.string(),
    }),
  ),
});

const QuestionsSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  framing: z.string(),
  videoAsks: z.array(z.object({ n: z.number(), askHubSpot: z.string(), full: z.string(), salesforce: z.string(), poc: z.boolean() })).length(3),
  topics: z.array(z.object({ id: z.string(), topic: z.string(), askHubSpot: z.string(), salesforce: z.string() })),
  moreQuestions: z.array(z.object({ topic: z.string(), askHubSpot: z.string() })),
});

const CostSchema = z.object({
  asOf: z.string(),
  defaults: z.object({ salesSeats: z.number(), serviceSeats: z.number(), years: z.number() }),
  inputs: z.object({
    salesSeats: z.object({ min: z.number(), max: z.number(), step: z.number() }),
    serviceSeats: z.object({ min: z.number(), max: z.number(), step: z.number() }),
    years: z.object({ options: z.array(z.number()) }),
    includeDataHub: z.object({ default: z.boolean(), label: z.string() }),
    includeSfApiAddon: z.object({ default: z.boolean(), label: z.string() }),
  }),
  options: z.array(
    z.object({
      id: z.string(),
      vendor: z.enum(['HubSpot', 'Salesforce']),
      label: z.string(),
      seatPrice: z.number(),
      onboardingPerHub: z.number().optional(),
      note: z.string().optional(),
      addons: z.record(z.object({ monthly: z.number().optional(), perSeatMonthly: z.number().optional() })).optional(),
    }),
  ),
  // Editor-only fields; the production build strips them (src/lib/stripInternal.ts).
  referenceCheck: z.record(z.union([z.string(), z.object({ annual: z.number(), threeYear: z.number() })])).optional(),
  presentationRules: z.array(z.string()).optional(),
  hiddenCosts: z.object({ title: z.string(), items: z.array(z.string()) }),
});

const SellerSchema = z.object({ name: z.string(), title: z.string(), email: z.string(), phone: z.string(), meetingUrl: z.string() });

const SimDefaults = z.object({
  brands: z.number(), locations: z.number(), users: z.number(), linesOfBusiness: z.number(), technicians: z.number(),
  aiConversations: z.number(), erp: z.boolean(), dispatch: z.boolean(), phone: z.boolean(), warehouse: z.boolean(),
});
const IndustriesSchema = z.object({
  industries: z.array(
    z.object({
      id: z.string(), label: z.string(), short: z.string(), icon: z.string(), photo: z.string(),
      skin: z.enum(['home', 'waste', 'water', 'construction', 'office', 'logistics']),
      objects: z.array(z.string()).min(4), fit: z.string(),
      csmDefault: z.enum(['ecre', 'proserv', 'fieldService', 'customerService', 'global']),
      storyOrder: z.array(z.string()), simulatorDefaults: SimDefaults,
    }),
  ),
});

const FrictionKind = z.enum(['gate', 'app', 'addon', 'limit']);
const StorySchema = z.object({
  dayOne: z.object({ kicker: z.string(), title: z.string(), body: z.string(), verdict: z.string() }),
  acts: z.array(
    z.object({
      checkId: z.string(), scene: z.string(), sfVisual: z.string(), hsVisual: z.string(), verdict: z.string(),
      frictions: z.array(z.object({ label: z.string(), kind: FrictionKind, source: z.string() })),
    }),
  ).length(5),
  finale: z.object({ kicker: z.string(), title: z.string(), body: z.string(), verdict: z.string() }),
  kindLabels: z.record(FrictionKind, z.string()),
});

const JourneySchema = z.object({
  scenarios: z.record(z.string()),
  steps: z.array(
    z.object({
      n: z.number(), title: z.string(),
      salesforce: z.object({ product: z.string(), text: z.string(), source: z.string() }),
      hubspot: z.object({ status: z.enum(['native', 'beta', 'app', 'integration', 'limit']), system: z.string(), text: z.string(), source: z.string() }),
    }),
  ),
});

const GrowthSchema = z.object({
  stages: z.array(
    z.object({
      stage: z.number(), title: z.string(),
      hubspot: z.array(z.object({ label: z.string(), pill: z.string().nullable(), source: z.string() })),
      salesforce: z.object({ label: z.string(), addOn: z.boolean(), source: z.string() }),
    }),
  ),
  closing: z.string(),
});

const PlatformSchema = z.object({
  title: z.string(), titleAccent: z.string(), subtitle: z.string(),
  layers: z
    .array(
      z.object({
        id: z.enum(['data', 'apps', 'agents', 'slack']),
        name: z.string(), tagline: z.string(), detail: z.string(), shot: z.string(), source: z.string(),
        brands: z.array(z.object({ label: z.string(), logo: z.string().nullable(), source: z.string() })).default([]),
      }),
    )
    .length(4),
  examples: z.record(z.record(z.array(z.string()))),
  openRail: z.array(z.object({ label: z.string(), logo: z.string().nullable(), source: z.string() })),
});

const DemoPathsSchema = z.object({ paths: z.record(z.array(z.object({ text: z.string(), source: z.string() }))) });

const SimulatorSchema = z.object({
  assumptions: z.object({ creditsPerConversation: z.number(), includedCredits: z.number(), daysPerMonth: z.number(), tooltip: z.string(), source: z.string() }),
  rules: z.array(
    z.object({
      id: z.string(), check: z.string(), trigger: z.string(), short: z.string(), when: z.string(),
      hubspot: z.object({ text: z.string(), pill: z.string(), source: z.string() }),
      salesforce: z.object({ text: z.string(), source: z.string() }),
    }),
  ),
  emptyState: z.string(),
  honestyNote: z.string(),
});

export const sources = { ...SourcesSchema.parse(sourcesJson).sources, ...SourcesSchema.parse(sourcesExtraJson).sources };
export const checks = ChecksSchema.parse(checksJson);
export const proof = ProofSchema.parse(proofJson);
export const questions = QuestionsSchema.parse(questionsJson);
export const cost = CostSchema.parse(costJson);
export const sellers = z.record(SellerSchema).parse(
  Object.fromEntries(Object.entries(sellersJson).filter(([k]) => !k.startsWith('_'))),
);
export const industries = IndustriesSchema.parse(industriesJson).industries;
export const story = StorySchema.parse(storyJson);
export const journey = JourneySchema.parse(journeyJson);
export const growth = GrowthSchema.parse(growthJson);
export const platform = PlatformSchema.parse(platformJson);
export const demoPaths = DemoPathsSchema.parse(demoPathsJson).paths;
export const simulator = SimulatorSchema.parse(simulatorJson);

const TeamSchema = z.object({
  kicker: z.string(), title: z.string(), titleAccent: z.string(), sub: z.string(), emailSubject: z.string(),
  contacts: z.array(z.object({ name: z.string(), first: z.string(), role: z.string(), focus: z.string(), email: z.string().email(), photo: z.string() })).min(1),
  salesforce: z.object({ label: z.string(), text: z.string(), url: z.string().url() }),
});
export const team = TeamSchema.parse(teamJson);
export const mailto = (emails: string[]) => `mailto:${emails.join(',')}?subject=${encodeURIComponent(team.emailSubject)}`;
export const site = siteJson;

export type Source = z.infer<typeof SourceSchema>;
export type Check = z.infer<typeof CheckSchema>;
export type Industry = (typeof industries)[number];
export type IndustryId = Industry['id'];
export type SimInputs = z.infer<typeof SimDefaults>;
export type FrictionKindT = z.infer<typeof FrictionKind>;

export const checkById = (id: string) => {
  const c = checks.checks.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown check ${id}`);
  return c;
};

export const industryById = (id: string) => industries.find((i) => i.id === id) ?? industries[0];
