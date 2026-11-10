# Salesforce vs. HubSpot: Built to Scale

A customer-facing compete microsite for consumer business services: waste and recycling, water, facilities, HVAC and home services, construction and AEC, staffing, legal and professional services, and logistics. The v4 master video is the hero; under it, a scroll-driven 3D story called **Two Futures** runs the same business on Salesforce (left, glowing blue) and on HubSpot (right, neutral gray) through the five checks.

Content follows the Mesh build kit v4 (`docs/MICROSITE_BUILD_SPEC.md`). Every factual claim carries a numbered source.

## Run it

```bash
npm install
npm run dev          # http://localhost:5190
npm test             # content guardrails + logic (Vitest)
npm run build        # type-check + production build to dist/
npm run preview      # serve dist/ on http://localhost:5191
```

QA scripts (need a Chrome; see "Browser for QA scripts" below):

```bash
npm run build && npm run check:fit   # video fits the first screen, unobstructed, at 9 desktop sizes
npm run shots                        # screenshots at 360/768/1024/1440 into .shots/ (git-ignored)
npm run shots -- story               # plus every act of the 3D story
npm run stills                       # re-capture the fallback stills (see below)
```

## What's on the page

| Section | Route anchor | What it does |
|---|---|---|
| Video | `#top` | The v4 master. The whole 16:9 frame, native controls included, fits the first desktop screen with nothing on top of it. A "See the 5 checks" cue lights in the last 15 seconds. |
| Intro | `#intro` | Hero line from the video, transcript toggle, the five checks. |
| Reality | `#reality` | Pick your business. The choice re-skins the 3D world, the call scenario, the platform examples, the simulator defaults, the proof tab and the story order. |
| Two Futures | `#checks` | Sticky 3D scene with a progress stepper, a "checks met" counter and a HubSpot friction tally. Seven acts: day one, the five checks, the finale. Each check has a Salesforce-first comparison, footnotes and "Ask HubSpot to show it live." The cost act holds the growth stack and the tier-jump calculator (disclaimer always visible). The operations act holds Follow the Call. |
| Platform | `#platform` | Drag-to-rotate layer stack (Data 360, Customer 360 apps, Agentforce, Slack), product shots, industry examples, "open by design" rail. |
| Build your future | `#build` | Size it to your business; findings appear Salesforce-first, and a 30-day credit calendar shows when HubSpot agents pause. The scenario is saved in the URL. |
| Proof | `#proof` | Customer Success Metrics tabs (exact values with n) and nine anonymized customer stories. |
| Prove it | `#prove-it` | "Ask HubSpot" flip cards (the three video asks, with demo paths on the back), the five topics and more questions, and a link to the printable checklist at `#/checklist`. |
| Close and sources | `#contact`, `#sources` | Seller card or fallback, numbered sources, legal text. |

The 3D code (three.js and react-three-fiber) loads only when the visitor nears the story, so the first load is about 160 KB gzipped (JS and CSS) plus the video poster.

## Update a fact

1. Edit the JSON in `src/content/` (`checks.json`, `cost-calculator.json`, `story.json`, `journey.json`, `growth.json`, `platform.json`, `simulator.json`, `proof.json`, `questions.json`, `site.json`).
2. Every claim names a source id. Add or update it in `sources.json` (kit sources) or `sources.supplemental.json` (sources this build added), with an `asOf` month.
3. Run `npm test`. The tests fail if a source id doesn't resolve, an internal or anonymized source has a public link, the check order or the video asks drift from v4, a CSM value changes, or banned phrasing appears ("can't", "cheaper", "nothing rolls up", "no billing", "no business units", relative dates, customer names, HubSpot orange or files, trackers, Google Fonts).
4. Footnote numbers are assigned automatically in page order.
5. Editor-only fields (`_note`, `guardrail`, `presentationRules`, `distribution`, `citation`, `referenceCheck` and similar) stay in the JSON for editors, but the production build strips them (`src/lib/stripInternal.ts`) so they never reach the browser. `npm run check:bundle` fails the deploy if any of that guidance shows up in `dist/`.

Edition names and seat prices live only in `cost-calculator.json`, and render only in the cost act's calculator.

## Variants and settings

- **Social variant:** add `?v=social` to the URL. It plays the social cut of the video and hides the Customer Success Metrics (and their source) per the CSM distribution rules.
- **Seller contact:** add sellers to `src/content/sellers.json` and link with `?seller=<key>`. Placeholder values in `[brackets]` are hidden; with no seller, the close shows the checklist and replay buttons.
- **Video:** files live in `public/assets/video/`. Paths, poster and the cue timing are in `site.json` → `video`. Both v4 files are already web-optimized (faststart). The captions are burned into the video, so the caption track is available but off by default.
- **Analytics:** none. `track()` in `src/lib/env.ts` is a no-op unless an approved tool sets `window.__SF_ANALYTICS__`.

## Motion, accessibility and fallbacks

- Reduced motion or no WebGL: the story shows captured stills of each act (`public/assets/stills/`) with all the text; smooth scrolling and counters are off.
- Re-capture stills after changing the 3D scene: `npm run build && npm run stills && npm run build`.
- Phones (portrait) stack the two worlds front to back under a high camera and hide the 3D labels; the cards carry the text.
- Keyboard: skip link, visible focus rings, tabs, accordions and flip cards are buttons; live regions announce the story step and simulator results.

## Browser for QA scripts

The scripts use `puppeteer-core` (global install) with a local Chrome. Managed Chrome installs can block DevTools automation by policy ("DevTools remote debugging is disallowed by the system admin"), so the scripts prefer **Chrome for Testing** from Playwright's cache (`npx playwright install chromium`) and fall back to the system Chrome. Override with `CHROME_PATH=/path/to/chrome`.

## QA results (Nov 9, 2026)

- `npm test`: 48 tests pass (content guardrails, calculator reference values, credit math, simulator rules, journey handoffs, growth counts, footnote numbering).
- `npm run build`: clean type-check and build. Initial JS about 156 KB gzipped plus 10 KB CSS; the 3D chunks (about 245 KB gzipped) are lazy.
- `npm run check:fit`: the video frame is fully visible, 16:9 and unobstructed (corners and center hit-tested) at 1280×720, 1366×768, 1440×900, 1536×864, 1920×1080, 2560×1440, 1280×632, 1440×789 and 1512×830.
- `npm run shots`: no horizontal overflow and no console errors at 360, 768, 1024 and 1440 px. Reduced motion and `?v=social` checked by hand.

## Before launch

- [ ] **#marketinglegal:** the CSM citation format for video and web, the "xx customers" bracket fill (the site uses the counts from the v4 script), whether embedding the video on this page counts as web or social use, and sign-off on the HubSpot-directed "Ask HubSpot" close.
- [ ] **SE readiness:** an SE confirms all three "Ask HubSpot" asks can be shown live in a services demo org.
- [ ] **CI review** of the final comparative copy.
- [ ] **Recheck** HubSpot prices, tiers and the voice-agent beta status, then update `asOf` dates.
- [ ] **Customer stories:** re-confirm every metric on the live stories (especially the roofing and home services story). Names and logos stay off unless Customer Marketing approves.
- [ ] **CSM mapping:** home services, HVAC, facilities, waste and water have no industry cut; they default to the Field service teams persona tab, which is never relabeled as an industry.
- [ ] **Professional Services cut scope:** confirm with the cut owner whether legal, consulting or staffing self-classified there. Until then the site doesn't claim it.
- [ ] **Source links:** confirm the public Salesforce Help links for account hierarchies and MuleSoft flows.
- [ ] Keep the repo private or the URL unlisted until CI has reviewed it.

## Deploy

`.github/workflows/deploy.yml` tests, builds, runs the bundle check and publishes `dist/` to GitHub Pages on every push to `main`. The build uses a relative base, so it works at any Pages path. The social preview image in `index.html` points at the live URL; update it if the repo name changes.

## Confidentiality

- The internal seller guide (Prove It Live) is not in this repo. Only public Salesforce demo-path capabilities appear on the site.
- CSM report decks are confidential; only the cleared statistics are used, with exact values and n.
- No customer names or logos, and no HubSpot logo, color or UI.
