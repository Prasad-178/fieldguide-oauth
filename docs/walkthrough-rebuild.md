# Walkthrough-driven rebuild — 21 October 2026

## Why this work is necessary

The user attempted Gmail with Composio managed authentication and could not complete the process using Fieldguide. The previous automated tests demonstrated rendering, request handling and validation, not usable setup instructions. The app is not submission-ready on that evidence alone.

## Agreed scope

- Curated examples: Gmail, Slack and Notion. Replace GitHub as the third example.
- Gmail: investigate both Composio-managed and own provider OAuth flows in the actual browser.
- Unfamiliar apps are a primary acceptance case, not a fallback. The live research path must meet the same instructional standard without selecting a canned guide.
- The brief does not restrict the product to Composio-managed auth. It explicitly asks about creating and approving provider OAuth apps; the managed directory is a starting point. Explain the distinction and keep each chosen route consistent.
- Add a compact before-start summary: difficulty, hands-on effort, approval waiting, prerequisites and nuances, agent preparation, human decisions, and evidence limits. Estimates must state assumptions; unknown waiting periods must remain unknown.

## Instructional standard

Every practical step needs a supported destination, navigation from that destination, actual control/field names, values or clearly identified user inputs, a visible success state, and specific recovery advice. Login-dependent destinations need a navigation fallback. A guide must not hide missing evidence behind generic instructions such as “configure OAuth” or “check scopes”.

Separate registration, consent, real operation testing and external distribution. A connected account is not proof that the requested API operation works. A working test is not provider approval. Stop at material unknowns instead of inventing controls, links, scopes or approval claims.

## Browser observations: Gmail managed

Observed in the signed-in Composio dashboard on 21 October:

1. The initial dashboard was in **For You**, showing personal app connections. This differs from the developer platform. Use the top-left **Switch → Platform**, then select a project.
2. Developer sidebar: **Auth Configs → Create → Gmail → Config Name → Next**.
3. Authentication method is **OAuth 2.0**. Credential choices are **Composio Managed** and **Your Own Credentials**.
4. The Gmail form initially selected 11 scopes, including full mailbox access and contact/profile scopes. Do not imply the default matches a send-only or read-only task.
5. The scope picker supports deselecting entries and typing a custom scope, then choosing **Add scope**. Tested preparation with only `https://www.googleapis.com/auth/gmail.readonly`.
6. Created a test-only config named `fieldguide-gmail-walkthrough`; the resulting detail page showed **Managed**, **Enabled**, and no connected accounts. Creating the config did not connect a mailbox.
7. **Connect Account** opens a separate Google account chooser. The observed authorization request contained only the selected Gmail read-only scope. After account selection, Google displayed **This app is blocked**. No mailbox grant or API operation completed. The official Composio Gmail FAQ says this can happen when the shared OAuth client requests scopes Google has not verified for it; a narrower valid provider scope is not necessarily supported by that shared client. Do not tell users to bypass the block.
8. For custom credentials, the same form asks for **Client id**, **Client secret**, and shows a disabled **Redirect URI** field. The displayed callback was `https://backend.composio.dev/api/v1/auth-apps/add`. Instruct users to copy their displayed value rather than assume a timeless universal callback.

## Browser observations: Gmail own app

1. Google Cloud initially opened an unrelated existing project. Explicitly select the intended project before making changes.
2. Project picker → **New project** → **Project name**, **Parent resource** → **Create**. Created a separate `Fieldguide OAuth Walkthrough` project under **No organization**. No billing setup or credentials were created.
3. Select the newly created project; creation did not automatically switch the page to it.
4. **APIs & Services → Enable APIs and services** opens API Library. Search **Gmail API**. Results also include Gmail MCP and Postmaster APIs; choose **Gmail API — View and manage Gmail mailbox data**.
5. The first in-app library navigation stalled. Opening the already-observed library URL recovered it. A generic “open Google Cloud” link would leave too much work to the user.

6. Clicked **Enable** for Gmail API; the final enabled state remains unverified. The legacy consent-screen entry now leads to **Google Auth Platform** (Overview, Branding, Audience, Clients, Data Access, Verification Center).
7. **Get started** opens App Information → Audience → Contact Information → Finish. Entered the isolated test app name, support/contact email and External audience (Internal is disabled without an organization).
8. Paused before **I agree to the Google API Services: User Data Policy**. The checkbox remains unchecked; no OAuth client credential was created. Browser-use rules require confirmation at the point of accepting a legal agreement. Screenshot stored locally in `.data/walkthrough/google-policy-handoff.jpg`.

## Unfamiliar-app generation rebuild

The first live Dropbox guide returned valid JSON but omitted required OAuth parameters and used only search calls. That is a product-quality failure, not a passing unfamiliar-app evaluation.

Implemented locally:
- Actual server-side retrieval of selected primary pages, plus relevant linked references. Search excerpts and read pages are distinguished. DNS resolution is pinned to public IPv4; private targets, credentials, non-HTTPS destinations and oversized responses are rejected.
- Ordered instructions and visible success checks rather than an accordion hiding all actions.
- A before-start summary of difficulty, estimated effort versus waiting, prerequisites and agent/human responsibility.
- An additional model review of source support, destinations, callback/protocol details, requested operation and launch requirements; up to two corrected drafts and one targeted search for missing evidence.
- A check that navigation destinations occur in evidence rather than merely looking like plausible provider URLs.
- Three real progress stages: research, guide generation, source/instruction review.

The provider-hosted fetch approach was tested and replaced: it could skip reads or return only a model summary. The current reader supplies fetched page text directly, keeps task-relevant excerpts from long pages, and follows references without inventing URLs. Limitations: model review is not independent factual verification, source selection can be wrong, retrieval may fail, and excerpts may omit context. These checks must not be described as guarantees. Browser and live unfamiliar-app tests remain the acceptance evidence.

See `unfamiliar-app-evaluation.md` for live successes, failures, timings and remaining acceptance work.

## Remaining checks

- Complete managed consent only with user approval for the exact account and permissions; run a controlled operation without sending email.
- Continue own-app Google Auth Platform setup, recording any legal agreement or credential handoff as a real boundary.
- The curated rebuild is implemented locally and browser-checked; deploy only after the remaining acceptance checks. Production still has the earlier generic guides.
- Improve evidence gathering and generation for unfamiliar apps. Test fresh apps with varied provider models, ambiguous names, missing OAuth support and missing policy evidence. Inspect destinations and actionability, not just JSON validity.

Source brief: https://composio.notion.site/APM-Integrations-Take-home-Assignment-3f9f261a6dfe81489ee5e3643151f9d6

## Implemented curated slice and UI checks

The local examples are now Gmail, Slack and Notion, with genuine bundled brand marks. Gmail has separate five-step managed and eight-step independent-own-client routes. The managed guide reports the observed Google consent block before the user starts. The own-client guide covers project selection, API enablement, app identity, scopes/test users, client registration, state/callback and token exchange, a task-matching operation, and launch checks.

Slack separates a development workspace installation from external OAuth distribution. Notion uses a public OAuth connection with explicit page selection, not an internal token. Its current developer portal is `https://app.notion.com/developers`. Slack/Notion account setups remain documentation-based, not browser-completed.

The overview separates difficulty, planning estimates, published approval waits, prerequisites, agent preparation and human consent. Numbered actions and a success check are visible by default; the illustration and troubleshooting are secondary. Gmail permissions can be copied. Launch checks now give provider-specific navigation. Managed Slack/Notion requests use live research instead of recycling own-client instructions.

Browser checks on localhost: Gmail managed configuration/scope copy feedback, own-app eight-step navigation and callback instructions, last-step launch content, overview, share-link dialog and copied feedback, and Notion route/brand. At 390 × 844 the document had no horizontal overflow and enabled buttons used pointer cursors. Desktop keeps instruction-panel scrolling and a visible action footer. No provider operation is inferred from checklist clicks. Screenshot: `.data/walkthrough/rebuilt-gmail-instructions.jpg`.

Additional managed dashboard inspection reached Toolkits → Gmail → GMAIL_FETCH_EMAILS → Input schema. Observed `user_id`, `query`, `max_results`, payload and other fields, plus Execute Tool. We did not click Execute Tool or verify its post-connection controls. The guide now states this boundary rather than inventing the next screen. No mailbox read or send occurred.

## Continued own-client walkthrough after user policy acceptance

The user checked the Google API Services User Data Policy checkbox. Continue → Create then displayed **OAuth configuration created!**. The app remains **External / Testing**.

Data Access → Add or remove scopes opens **Update selected scopes**. At **Manually paste scopes**, enter the full Gmail read-only scope, choose **Add to table**, verify the selected row, then **Update → Save**. Google displayed **Data access changes saved!** and placed gmail.readonly under Restricted scopes. This declares requested permissions; no mailbox consent was granted.

Audience → Test users → Add users uses an email-chip field. Commit the typed address (Enter, or a first click that blurs the field), then Save. Verified the dedicated walkthrough account in the table and a count of **1 user (1 test, 0 other)**. It remains Testing; no public publishing was attempted.

Reopened API Library → Gmail API in the same project and confirmed **API Enabled**. Earlier uncertainty about whether Enable completed is resolved.

Clients → Create client → Web application exposes Name, Authorized JavaScript origins and Authorized redirect URIs. Prepared **Fieldguide local Gmail test** with only `http://localhost:8765/oauth/callback` as its redirect. JavaScript origins remain empty because the test exchanges tokens on the local server. A new **Use this client for an AI-powered agent** checkbox is present. Its help says it designates clients for agent actions, including Google MCP tools, and recommends separate clients for agent and standard workflows. It remains unchecked for this standard API test. **Create has not been clicked; credential creation awaits explicit confirmation.**

The user-facing guide now includes these observed navigation details and updated evidence boundaries. Screenshots: `.data/walkthrough/google-client-prepared.jpg` and `.data/walkthrough/gmail-api-enabled.jpg`.

## Local callback tool

`scripts/gmail-walkthrough.mts` is a local-only aid for completing the account walkthrough. It is not part of the deployed app and is excluded from Vercel uploads. It uses Google's official authentication library, binds only to 127.0.0.1:8765, validates Host/Origin and session-bound single-use state, uses PKCE, and requests online read-only access. Tokens remain in memory with a 15-minute session expiry. No refresh token, email sending or automatic mailbox read is requested.

Run: `node --import tsx scripts/gmail-walkthrough.mts`. Open `http://localhost:8765`. After client creation, privately save the web-client JSON outside the repository at `~/.config/fieldguide/gmail-client.json` (restrict file access), or set `GMAIL_WALKTHROUGH_CLIENT_FILE` to its private path. The callback must exactly match the registered URI. Never paste client secrets into chat.

After the user explicitly grants consent, a separate button reads at most one known message with subject `fieldguide-test`, then fetches that message. The page reports boolean subject/content checks without displaying or logging message content, addresses, IDs or tokens. Stop the process to clear local state; Google account grant revocation is a separate action.

Automated test uses a fake Google client and verifies invalid Host/Origin rejection, state mismatch, one-use callback handling, no implicit read on callback, and the bounded read request with private output suppressed. Actual credentials, consent, token exchange and Gmail reads remain untested until the user approves and completes the pending client/consent steps.

Installing the local Google library surfaced existing npm audit findings in the eslint/shadcn development dependency chains. The report names no google-auth-library chain. No forced/downgrade audit fix was applied during this walkthrough.

Validation for this continuation: 55 tests passed, ESLint passed, production build passed and `git diff --check` passed. The local callback homepage was opened in the browser; no Connect action was taken. No deployment, client creation, token exchange, mailbox operation or email send occurred.

## Client creation and consent boundary - 21 October 2026

With the user's approval, Create displayed **OAuth client created**. Download JSON completed despite the browser download observer timing out; the existing file was verified rather than downloading or creating another client. The JSON is stored outside the repository with directory mode 700 and file mode 600. It is excluded from commits, deployment and submission.

The local test exposed two browser-specific harness issues: a stale session/strict-origin rejection and a CSP that blocked the intended redirect to Google. The harness retains Host and Origin checks, uses a same-origin referrer policy, and allows form redirects only to itself and accounts.google.com. A fresh browser run then reached account selection, the developer test-app notice and the exact permission screen: **View your email messages and settings**. Consent has not been granted, and token exchange/mailbox reading are not claimed.

This checkpoint verifies client creation and the authorization request, not the completed mailbox flow. The managed route remains blocked by Google for the tested shared-client read scope.
