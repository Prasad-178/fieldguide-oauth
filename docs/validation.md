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

## Broader regression pass — 21 October 2026

The Asana schema fix was verified on production via the API (6 steps, 4 sources, 19.484 seconds), and by clicking **Try research again** in the browser (7 steps). Inspecting content, rather than merely checking HTTP success, then exposed more issues:

- An Asana draft described token acquisition as its operation test. Research now explicitly looks for the requested API operation and generation instructions require its observable result. The final local Asana run returned task records as its success criterion (7 sources, 20.051 seconds). This is prompt guidance plus manual inspection, **not** a universal semantic guarantee.
- Managed Slack/Notion originally returned custom-client setup. Both research stages now explicitly interpret managed as **Composio-managed OAuth**, search Composio sources and distinguish managed production concerns from custom-app Marketplace review. A runtime provenance check also refuses a documented managed setup without a Composio-cited setup/connection step. This checks minimum evidence provenance, not full factual entailment.
- Asana's `oauth_authorize` / `oauth_token` URLs escaped the original endpoint filter. Known endpoint forms now become prose-only instructions, while legitimate Slack app settings and Notion authorization documentation remain clickable.
- Changing a shared-link fragment in the same tab could show the prior snapshot. Shared-guide loading now observes hash changes, aborts stale verification, clears old results/checklist state and verifies the new token. Browser regression: valid Asana snapshot → invalid token showed the invalid-link error and no old guide.
- Offline browser requests exposed raw “Failed to fetch”. They now retain the form and offer an actionable connection error. Provider `null` JSON and cancellation during response-body reading are handled explicitly.
- Intermittent citation validation failures occurred. The generator now makes at most one corrected draft using the same evidence and full validation; both generation costs are included. A second invalid draft remains an error. No unvalidated fallback is displayed, and there is no automatic retry for HTTP/provider failures.

### Live cases inspected

| Input | Outcome after relevant correction | Remaining limits |
|---|---|---|
| Asana / read workspace tasks / external users / own app | Completed; operation test checks returned task records; public distribution distinguished from optional listing | No Asana account or API operation was executed. |
| Slack / send channel message / external users / managed | Completed; Composio managed configuration, consent, message test and workspace policy check; 17.242 seconds | The guide is documentation synthesis; exact dashboard labels can drift. |
| Discord website URL / read profile / testing / own app | Completed; `identify` scope and profile retrieval test; 15.881 seconds | No Discord OAuth connection performed. |
| Notion / read selected pages / testing / managed | Initial draft rejected for citation mismatch; subsequent run completed with Composio sources; 13.023 seconds | Output explicitly leaves the exact read endpoint/tool response unconfirmed; this is incomplete operation detail, not proof of a complete integration. |
| Mercury / read account information | Initial provider 429; later attempts returned no recorded search and were refused | App identity was **not** resolved; this remains an unsuccessful ambiguous-name experience. Use an official URL. |
| QuasarLoom7391 / read tasks | No recorded live search; result refused | No fabricated guide was shown. Does not prove the app does not exist. |

Selected outputs are in `examples/asana.json`, `examples/slack-managed.json`, `examples/notion-managed.json` and `examples/discord.json`. These are illustrative captured runs, not guaranteed output for future requests. During diagnostic runs, provider response/body failures also occurred; the app must still handle provider availability and timeouts. This small, iteratively corrected sample is not a reliability benchmark or success-rate estimate.

### Automated and browser results

36 automated tests passed. Coverage now includes provider 400/401/402/403/429/500/503, errors inside HTTP 200, invalid/null JSON, empty/truncated content, missing search/evidence, bounded draft correction, input validation, NDJSON error delivery, server deadline, cancellation before and during a request, source references, managed provenance, navigation endpoints, and signed-snapshot integrity. Tests use fake provider responses; they neither spend API credits nor alter external accounts. ESLint, the production build and `git diff --check` passed.

Browser checks: Asana retry, instructions/step completion, share creation and reload (0 checked in the shared copy), result-heading focus, same-tab invalid-token rejection, cancellation with both inputs preserved, offline error with inputs preserved, and GitHub's curated managed/public route. At 390×844 the generated guide had no horizontal overflow and its primary action ended at y=832; tapping it changed the checklist to 1/7. Earlier desktop viewport and reduced-motion checks above remain relevant.

A full provider integration, independent fact-check of every generated claim, large repeated-trial benchmark, and developer usability study remain undone. We do not equate passing offline tests with verified OAuth setup or public-launch approval.

### Production confirmation after the broader pass

Code commit `8d1daee` deployed successfully as `dpl_8ePBhoJFjqoAmagTvXoYWo2525Y3`. On the production alias, Asana / read workspace tasks / external users / own app completed with six steps, eight sources, three reported searches/tool calls, 20.517 seconds and reported cost $0.03134339. The test success check was an HTTP 200 with returned task objects. In the production browser, an existing signed Asana link loaded with zero checklist progress; changing its fragment to an invalid token removed the old guide and displayed the invalid-link error. Direct missing/invalid-token verification requests both returned HTTP 400. No provider accounts or OAuth apps were changed.
