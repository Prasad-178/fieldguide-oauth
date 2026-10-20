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
