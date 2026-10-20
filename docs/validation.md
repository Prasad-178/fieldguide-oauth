# Validation — 20 October 2026

## What was actually run

| Check | Observation | Limit |
|---|---|---|
| Live Linear research: read issues, own client, public audience | 6 steps, 4 sources; reported 1 search and 2 tool calls; 20.285 seconds; reported model/tool cost $0.0176987 | No Linear account was connected; review requirements remained explicitly unresolved. |
| Live Notion research in browser | 6 steps, 4 sources; reported 1 search and 1 tool call; 18.833 seconds; reported cost $0.0156775 | Sources are retrieved excerpts. No independent page-fetch count is claimed. |
| Unknown identity: “Fictional QuasarLoom7391” | The model did not report a live search; the server rejected the result and returned a readable error | This proves the no-search guard ran, not that the product's nonexistence was established. |
| Shared Notion snapshot | Opened a shared link, verified it, recovered the same guide, and started with an empty checklist | A shared link contains public guide content; it is not an access-controlled document. |
| Step interaction | Expanded instructions; marked step 1 done; moved to step 2 with 1/6 progress | Progress is self-reported, with no provider-side verification. |
| Mobile | 390 × 844 viewport, document width 390, bottom action visible, step navigation scrollable | Functional inspection, not a device-lab or assistive-technology audit. |

Reported cost is OpenRouter's response metadata for those runs, not total project billing. Real outputs are saved in `examples/linear.json` and `examples/notion.json`. No API keys, source-page dumps or signed share tokens are included.

## Corrections made after inspecting outputs

The first Linear result ended at obtaining a token and exposed a bare token endpoint as a navigation button. Both are poor setup guidance:

- The generation contract now requires a separate controlled-operation test and launch check.
- Runtime validation rejects a documented guide missing either kind of step.
- API/token/authorization endpoints are removed from navigation destinations; instructions still describe the relevant server-side operation.
- A subsequent live Linear run included both test and launch steps.

Citation checks validate reference existence and required references. They do **not** validate every factual statement against its excerpt. We explicitly retain that limitation.

## Practical provider inspection

Opened the signed-in GitHub **Register a new OAuth application** form. Observed application name, homepage URL, optional description, redirect URI input, “Add redirect URI”, device-flow option, and a checked “Expire user access tokens” option. The interface also exposed a wildcard redirect option.

No fields were submitted. No OAuth app, client secret, token or account connection was created. This is registration-form inspection, not a successful setup attempt. The guide asks the developer to verify owner and exact callback configuration and does not promise universal settings.

Reference: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app

## Automated checks

The Node test suite checks:

1. Unsafe link schemes, credentials, IP literals and local destinations.
2. Input length and strict request fields.
3. Missing citations and required test/launch steps.
4. Misleading API endpoints in navigation.
5. Signed snapshot round trip without personal checklist state.
6. Tampering, wrong signing key and oversized share tokens.
7. Bounded decompression.
8. Byte-limited request reading, including missing Content-Length and multibyte text.

Run `npm test`, `npm run lint` and `npm run build`. These checks do not call paid APIs. Live model runs above are separately recorded and are not deterministic test fixtures.

## Useful next validation

Ask several developers to use an unfamiliar provider guide without coaching. Observe whether they choose the correct permission, identify a public-launch blocker, recover from an error and distinguish “marked done” from “verified”. Collect corrections and expand provider-specific checks before increasing coverage.

## Final local checks

Eight tests passed; ESLint and the production build passed. Direct endpoint checks returned 400 for an empty research request, 403 for a foreign Origin, 413 for an oversized body and 400 for an edited share token. Browser inspection confirmed that source links and run details open correctly. No provider-account actions were performed.

## Production deployment

Deployed to https://fieldguide-oauth.vercel.app in Prasad Sankar’s Vercel project. The landing page and research form returned HTTP 200 without authentication. A real Airtable research request on the deployed API returned six steps, four sources, one search and three reported tool calls in 28.056 seconds; reported cost was $0.0243484. The saved snapshot verified successfully on the deployed server and rendered in the browser. See `examples/airtable.json`.

Cancellation was exercised in the local browser: Stop research returned to an editable form with both inputs preserved. This does not establish whether already-started upstream work was billed.

Vercel's published, active “Research demo limit” rule matches only POST `/api/research`, at six requests per IP per 900 seconds. Rule configuration was inspected; no load test or distributed-abuse test was performed.

`npm audit --omit=dev` reported zero vulnerabilities. The full audit reported nine high-severity entries arising from a braces stack-exhaustion advisory through development-only ESLint/shadcn tooling. npm suggested incompatible major downgrades; none were forced. These remain open development-tooling advisories, not a clean full-dependency audit. Advisory: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm.

The source repository is private pending the owner's sharing choice. No submission form or email was sent.

## Loading and viewport layout — 21 October 2026

Replaced text-only route fallbacks with layout-shaped skeletons, including shared-snapshot verification. Browser verification temporarily paused the real verification request: the guide skeleton rendered 18 placeholders, announced its loading state, and stopped pulsing under reduced-motion emulation. The request was then resumed and the actual guide rendered.

Desktop uses a viewport-height app shell at widths above 900px and heights of at least 600px. Navigation and step actions stay visible; the instruction panel and step list can scroll independently. At 1366 × 768, expanding Slack instructions kept document height at 768. At 1280 × 650, the generated Airtable guide kept document height at 650 and the instructions were keyboard-focusable for Page Down. At 390 × 844, natural page scrolling remained, document width was 390, and the action bar ended at viewport height 844. Shorter desktop windows also fall back to document scrolling to preserve access.

Reduced header height and guide spacing; moved step actions out of animated/scrolling content. Lint and production build passed. These checks do not establish a full accessibility audit.

## Asana provider-format rejection — 21 October 2026

A user request for `asana`, task `read tasks from a user's workspace`, external users, own OAuth app failed. Production request logs contained no upstream diagnostic because the NDJSON stream had already returned HTTP 200 and the caught error was not logged. A direct reproduction captured the actual failure: research returned HTTP 200 and four sources; structured generation returned HTTP 400 from Google AI Studio, rejecting the schema for too many constraint states. This was a request-format bug, not evidence of an invalid app name or exhausted API credits.

The provider schema now retains object structure, required properties, types and enums, but leaves array/string/number limits to the unchanged Zod runtime validator. The generation prompt also specifies size limits. The full guide is still rejected if it violates application bounds or citation rules; no validation was disabled. Provider errors now distinguish rejected requests from temporary service failures, recognize error bodies inside HTTP 200 responses, and log safe stage/status/category diagnostics without prompts, source excerpts, keys or raw upstream payloads.

The same request completed locally after the change: seven steps, four sources, 19.650 seconds and reported cost $0.01916793. Twelve tests passed, including provider schema compatibility, rejection diagnostics, HTTP-200 error handling and runtime rejection of oversized generated guides. Lint and build passed. Earlier live successes were insufficient to detect this provider compatibility failure; a few successful runs are not a reliability estimate.

Implementation reference: [Gemini structured-output limitations](https://ai.google.dev/gemini-api/docs/structured-output); [OpenRouter error formats](https://openrouter.ai/docs/api_reference/errors-and-debugging).
