# Assignment readiness review

Reviewed 21 October 2026 against the original live brief:
https://composio.notion.site/APM-Integrations-Take-home-Assignment-3f9f261a6dfe81489ee5e3643151f9d6

The brief asks for a focused working slice: a few varied apps, live generation for unfamiliar apps, source/setup checks, a working URL and a source repository with decisions and limitations. It does not require all 100 guides, paid accounts or completed provider approvals.

## Delivered scope

- Public app: https://fieldguide-oauth.vercel.app
- Public source: https://github.com/Prasad-178/fieldguide-oauth
- Gmail: own versus managed credentials, read versus send scopes, testing versus public verification. Own-app read-only consent, local PKCE token exchange and Gmail messages.list/messages.get succeeded against an unsent test draft. The subject matched and message content was returned. No email was sent; no refresh token was requested. The temporary harness was stopped.
- Managed Gmail: dedicated configuration created and consent attempted; Google blocked the shared-client route. No managed mailbox connection is claimed.
- Slack and Notion: varied, source-backed sample guides. Their account setups were not executed.
- Guidance includes visible ordered actions, destinations, success/recovery checks, effort/waiting, prerequisites and agent/human responsibility. Checklist completion is self-reported.
- Live research uses the same search, primary-page retrieval, generation and review pipeline for unfamiliar apps. Recorded examples are not runtime fallbacks.

## Lower-cost model and controls

The deployed default is `z-ai/glm-5.3`. OpenRouter's model catalog on 21 October listed starting prices of $0.079/M input and $1.40/M output; provider prices and search charges can vary. Every completion enforces maximum provider prices of $0.25/M input and $1.50/M output. There is no automatic premium fallback.

After reported research cost reaches $0.20, billing data is absent, or ten calls have started, further paid requests stop. One in-flight call can cross the soft ceiling. Search fees are separate from token prices and count in provider-reported usage. IP/concurrency limits and the Vercel firewall reduce abuse but are not a durable global account budget.

Earlier Nano, Gemini Flash Lite and DeepSeek trials were not reliable enough to treat as acceptance evidence. GLM-5.3 produced a fresh Todoist managed guide in 82.8 seconds for $0.09277. The generated Python session, authorization, polling and tool-execution calls were checked against current Composio reference excerpts. Managed permission scope names and full operation response fields remain uncertain; no Todoist account connection or task read was executed.

A fresh Dropbox result took 87.6 seconds and $0.07219, but manual review found required operation details marked uncertain inside a supposedly documented test. That output is not a successful instruction-quality verdict. A regression check now rejects such explicit contradictions and the prompt requires unsupported operations to become reference-verification steps. This remains a conservative text check plus model review, not semantic proof. A Discord saved-discovery trial also conflated bot verification with ordinary OAuth; the review instructions were corrected. Replays are not fresh end-to-end evidence.

## Implementation verification

64 automated tests passed, including request validation, cancellation, unsafe URLs/redirects, source references, SDK/protocol contracts, signed snapshots, cost limits, document extraction and the local callback harness. Lint, TypeScript and the production build passed. `git diff --check` passed. The production dependency audit previously reported zero findings; nine high findings remain in development tooling, not silently dismissed or force-upgraded.

Specific fixes from live evaluation: retain endpoint/parameter text inside article headers and forms; resolve relative Markdown links; follow operation references; bound review output lengths; distinguish product identity from missing docs; reject undefined/mixed SDK examples and raw OAuth parameters without a request URL.

## Deployment

Runtime revision `669bed1`; deployment `dpl_EsN5ATZJQbMyiRDkQwYdb3P1hbCm`:
https://fieldguide-oauth-ksy28jjab-prasad-sankars-projects.vercel.app

Production build completed, homepage returned HTTP 200 and malformed API input returned the expected validation error. The deployment was promoted to the public domain. Preview protection remains enabled. No provider keys or Gmail client credentials are included in the repository or submission.

## Limits

The document reader cannot render JavaScript and requires public IPv4. Source excerpts can omit needed detail; model generation and review can both be wrong. No unfamiliar-app pass rate is claimed. Samples are dated and shared snapshots do not refresh themselves. Signed links detect modification, not factual errors, and have no individual revocation. No usability interviews or complete accessibility audit were performed.

## Final production browser check

A fresh public-UI request for Discord basic-profile access (test audience, own app) completed with GLM-5.3: 93.089 seconds, five searches, seven primary-page reads and $0.068799155 reported cost. It produced nine steps. The shared snapshot reopened in a separate browser tab with 0/9 personal checks, and the signature-verification endpoint returned HTTP 200. No second research call was needed to share or reopen it.

Manually checked the scope declaration, authorization URL, state/issuer checks, form-encoded token exchange and identify-scoped user response against Discord's current OAuth, platform permissions and user-resource documentation. Portal field labels and public-distribution policy remain explicit unknowns. No Discord account was created or connected.

Recorded outputs: [Discord production guide](examples/discord-live.json) and [Todoist managed guide](examples/todoist-managed.json). These are review artifacts, not runtime fallbacks. Local screenshot: `.data/walkthrough/production-discord-shared.jpg`.

## Submission receipt

Submitted on 21 October 2026 through the assignment's Google Form. The confirmation page displayed: **“Your response has been recorded.”**

Submitted the two-page `fieldguide-submission.pdf` with the public app/source links and final notes distinguishing executed walkthroughs from documentation checks and unverified behavior. No separate email was sent.

Local receipt screenshot: `output/submission-confirmation.png`. Local submitted PDF: `output/pdf/fieldguide-submission.pdf`. Both are retained outside version control; the PDF was uploaded to the form.

