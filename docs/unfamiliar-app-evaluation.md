# Unfamiliar-app evaluation — 21 October 2026

Status: research pipeline improved locally; **not a blanket readiness verdict**. Nothing deployed or submitted in this rebuild. Gmail/Slack/Notion sample instructions are rebuilt locally; account walkthroughs remain incomplete.

## What changed

- Resolve product identity before generating setup instructions.
- Select primary sources and retrieve their actual text. Follow relevant documentation links and perform one additional search for review gaps.
- Keep relevant sections of long API/toolkit references instead of cutting off everything after the introduction.
- Generate visible numbered instructions, observable success checks, recovery advice and a before-start summary.
- Validate source IDs, evidenced destination URLs and full URLs for raw OAuth requests. Mark connection/operation steps as requiring human involvement.
- Review source support and instruction completeness; allow two corrected drafts. Withhold unresolved operational instructions rather than presenting them as verified.
- Show retrieved-page versus search-excerpt evidence and actual review progress. Preserve input and cancellation behavior.

The default is now `openai/gpt-5.4-mini`, configurable with `OPENROUTER_MODEL`. Gemini 2.5 Flash repeatedly selected third-party instructions as primary evidence in this test, including an irrelevant broker callback. A full GPT-5.4 trial exceeded the 150-second deadline. This is a practical choice from these observations, not a general model benchmark.

## Live results and discoveries

These runs happened during iteration, so they are not comparable repeated trials or a pass-rate estimate. All read public documentation only; no provider OAuth login, token exchange or operation was executed.

| Case | Observed result | Assessment |
| --- | --- | --- |
| Dropbox, list app-folder files, own OAuth/public | Initial guide omitted protocol parameters; provider-hosted fetch sometimes skipped page reading. Later run returned an eight-step clarification guide but asked for endpoint/scope research and audience information already supplied. | Failed usability acceptance. Triggered direct retrieval, targeted gap research and explicit checks against redundant questions. Full-model trial timed out. |
| Spotify, saved tracks, own OAuth/public | Later CLI run produced nine steps from seven read pages in ~94 s; browser run produced eight steps with consent, callback, token exchange and a one-track API test. | Substantially more actionable, but manual review found a missing full authorization URL in the browser run, an irrelevant managed-auth blocker and redundant questions. Added explicit protocol validation and route-specific prompting afterward. Account eligibility and public rollout still require user checks. |
| Todoist, active tasks, Composio managed | Early output could not establish the exact operation and connection inputs; unfinished walkthrough was withheld. | Correctly avoided a false completion claim, but not useful enough. Fixed long-page extraction and duplicate reference selection; this route needs a fresh end-to-end check. |
| Flow, read tasks | Earlier run drifted toward a product. After identity gating, returned one clarification step asking for the official website in ~23 s. | Appropriate handling of ambiguous identity. No invented setup or account action. |
| Wikipedia, public article reading | Review rejected the unauthenticated route as an auth-mode mismatch. | Product failure: public-data tasks may need no OAuth. Corrected generation/review instructions to allow a clearly explained, source-backed no-OAuth finding. Needs retest. |
| Discord, basic profile, own OAuth/test | Seven steps; five pages read; ~87 s; reported cost $0.1844. Full authorization/token URLs, form encoding, client auth, state/issuer checks, `identify` and GET `/api/v10/users/@me` supplied. | Functional protocol path is actionable on inspection. Exact portal labels remain explicitly unverified, and approval waiting is not invented. A real account walkthrough was not performed. |

Raw generated guides, run events and fetched public-document excerpts are in ignored `.data/evaluations/`. Specific runs:

- `discord-1792566443707`
- `spotify-1792565730879`
- `ambiguous-1792566034945`
- `managed-1792565602147`
- `unsupported-1792566131058`
- `dropbox-1792565511391`

The sources and recorded guides are evidence, not canned fallback responses used by the application.

## UI findings

The first browser run showed prerequisites occupying the entire step panel. They now live in **Before you start**, leaving the current action and numbered instructions visible. The summary includes difficulty, effort/waiting, prerequisites, agent preparation and human responsibilities. Screenshot: `.data/walkthrough/research-layout.jpg`.

## Automated verification

54 tests passed, including safe public-document addressing, extraction of late-page operations, identity clarification, source/destination validation, raw protocol URL checks, review-driven repair, cancellation, malformed/provider responses and signed snapshots. Lint and production build are checked separately. These checks do not establish the correctness of every generated claim.

## Remaining acceptance work

1. Re-run the routes that still failed instructional quality after the latest changes, and inspect them against their primary sources.
2. Complete the Gmail walkthrough as far as account/consent authorization permits. Own-app setup is paused before Google's User Data Policy checkbox; managed read-only consent was blocked by Google.
3. Continue the actual provider walkthroughs; curated Gmail/Slack/Notion instructions are now rebuilt and browser-checked locally.
4. Verify responsive layout and a fresh shared snapshot of the final implementation, then deploy and repeat the critical checks on production.
5. Prepare submission material and reviewer source access only after the working slice meets the brief.

A model review is another check, not a guarantee. Do not claim universal app coverage, successful account setup, provider approval or submission readiness from these results.

## Further live trials and failure analysis

Managed requests now read three current Composio broker references even when search finds only toolkit pages. This avoids assuming legacy custom callbacks apply to the current managed session API. Reviews explicitly check consistent SDK language/method names, execution arguments, duplicate questions and whether a test retrieves the requested data.

- `managed-1792567191734`: reported documented, but manual inspection failed it for mixed SDK field casing/methods and an unsupported execution contract. This is a false positive from model review, not acceptance evidence.
- `unsupported-1792567192655`: withheld after review found that bare page metadata did not satisfy article-content reading.
- Medium-reasoning experiments (`managed-1792567529205`, `unsupported-1792567528211`, `managed-1792567687779`, `unsupported-1792567688754`, `managed-1792568029773`) exhausted output budgets or the 150-second deadline. Reverted to low reasoning, retained stronger source checks and increased the bounded review output allowance. No infinite retry or silent success fallback was added.
- `unsupported-1792568029773`: exhausted three validation attempts. Validation diagnostics now retain the final check failure for debugging instead of blaming the user's task.
- `unsupported-1792568133107`: 35.2 seconds, six pages read, reported cost $0.07734, five documented steps. Explicit no-OAuth route using the public summary endpoint, User-Agent, a concrete Earth example and policy checks. Manual public API request returned HTTP 200, title Earth and a nonempty 938-character article extract. This verifies a public article summary read, not full-article retrieval or an authenticated flow.

These iterations used different settings and are not a reliability estimate. A successful public read does not resolve the remaining managed/OAuth failures.

### Final local checkpoint

- `managed-1792568133109`: six steps, seven pages, 90.7 s, $0.24454. The model again reported documented, but manual review still failed it: vague session construction, alternative SDK field casing, unclear direct-tool execution prerequisites, and questions already answered by test/read-only context. Do not present this as an accepted managed flow.
- `spotify-1792568261451`: seven steps, six pages, 47.6 s, $0.08448. Full authorize/token methods, encoding, client authentication, state check and saved-track request are present. Still asks about a public audience already supplied, does not fully establish public-app eligibility or all development-account prerequisites, and lacks a practical account walkthrough. Better protocol guidance; not full public-launch acceptance.
- `dropbox-1792568261451`: seven pages, 94.3 s, $0.18469; not-confirmed. After corrections, review still found missing primary scope evidence, incomplete state handling and an underspecified optional PKCE branch. The walkthrough was withheld. The fetched HTTP reference did not supply the needed operation detail. Needs a better primary reference retrieval path, not weaker checks.

No further paid runs were started after this batch. The next engineering work should target these concrete failures: (1) retrieve complete primary operation references when pages are script-rendered or empty; (2) produce one runnable, source-supported managed SDK example, with constructor and connection completion; (3) promote rollout eligibility and prerequisites into the overview and remove already-answered questions. Changing model effort alone did not solve these problems.

Local verification: 54 automated tests, lint, production build and diff whitespace checks. API logs retain only diagnostic categories; full bounded validation checks are available in the local evaluation artifact, never sent to the browser or normal server logs. These checks establish implementation behavior, not provider instruction correctness.
