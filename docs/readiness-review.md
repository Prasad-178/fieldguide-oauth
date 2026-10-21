# Assignment readiness review

Reviewed 21 October 2026 against the original live brief:
https://composio.notion.site/APM-Integrations-Take-home-Assignment-3f9f261a6dfe81489ee5e3643151f9d6

**Status: paused at the owner's request; submission pending.** See [the resume checkpoint](CHECKPOINT.md). The public app still runs deployment `dpl_xep88QQyW6xAKhetcceNCA5bjyUJ` with the previous full GPT-5.4 default. Lower-cost configuration and spending controls are saved in the working revision but have not been deployed. Fresh GLM-5.3 Dropbox and Todoist runs returned structured guides; manual instruction acceptance and production sharing checks remain. A `documented` model status is not an independent quality verdict.

## Requirement check

| Brief requirement | Current evidence | Remaining work |
| --- | --- | --- |
| Working experience | https://fieldguide-oauth.vercel.app; rebuilt Gmail instructions verified in the public browser; home HTTP 200 and invalid API request HTTP 400 | Review the latest low-cost guides, deploy the chosen configuration and verify sharing |
| A few varied apps | Gmail (managed and own), Slack (workspace/distribution), Notion (public OAuth and page selection) | Slack/Notion remain documentation-based, not completed account setups |
| Unfamiliar apps live | Search, direct primary-page retrieval, link following, structured guide and source review; low-cost model candidate under validation | Current low-cost model acceptance is incomplete; no canned fallback is used |
| Useful setup and launch guidance | Visible ordered actions, destinations, success/recovery checks, effort/waiting, prerequisites and agent/human summary | Source-backed instructions can still be wrong; reviewers should inspect citations |
| Practical investigation | Gmail managed configuration created, consent blocked; own Google project/API/identity/scope/test user/client created, consent and token exchange completed, known test draft retrieved through Gmail API | Read fixture was an unsent draft; no send, refresh-token or public-approval test |
| Repeatability and evidence | 63 automated tests; lint/build/diff check; history secret scan; production dependency audit reports zero findings | Nine high findings remain in development tooling; no forced breaking dependency changes applied |
| Source and README | Public GitHub repository with setup instructions, decisions and limits; anonymous GitHub API confirms private=false | Source access complete |
| Submission | Form confirmed: one file, max 10 MB; short PDF draft prepared locally | No upload, form submission or email sent |

## Model and reliability decisions

After the owner requested lower spending, the candidate default was changed from full GPT-5.4 to `openai/gpt-5.4-nano`. This cost-control revision is being validated before deployment. All requests carry provider token-price ceilings ($0.25/M input, $1.50/M output), with no automatic premium fallback. Search-tool charges are separate. A soft $0.20 per-research ceiling and ten-call limit stop further requests; unknown billing data also stops further calls. A single in-flight call can cross the soft ceiling. These are not account-wide caps.

The low-cost trials exposed two avoidable retry causes, now corrected: the document reader removed article headers/forms that contained endpoint and parameter documentation, and review JSON allowed strings longer than runtime validation permitted. Article content is retained while navigation and interactive controls are removed; review bounds are now specified in the response schema.

Direct checks of Nano, Gemini Flash Lite and DeepSeek Flash did not establish broad unfamiliar-app reliability. DeepSeek without thinking was inexpensive but still produced material protocol mistakes. Withheld or failed outputs are not passes. Saved-discovery diagnostic runs are explicitly distinguished from fresh end-to-end research. See the evaluation record for current results.

Relative Markdown links are resolved before link following. Managed research reads four current Composio session/authentication references. Documented SDK instructions cannot use an undefined Composio client/session or mix Python and TypeScript result fields. Product identity is distinguished from missing SDK/protocol documentation.

## Deployed revision

Latest runtime revision: `b85cf04`. Deployment: `dpl_xep88QQyW6xAKhetcceNCA5bjyUJ`, built on 21 October 2026. This includes the successful own-app read evidence and route-specific status labels.
The public domain resolves to the rebuilt deployment. Preview protection remains enabled; CLI verification used Vercel's supported authenticated curl. No production credentials are included in the repository or PDF.

## Final acceptance sequence

1. Resume only after the owner asks. Inspect the fresh GLM-5.3 Dropbox and Todoist outputs against their saved primary pages. Dropbox still lists material operation-reference gaps despite its generated `documented` status; do not count that as a complete walkthrough.
2. Choose the inexpensive model based on instruction quality, then deploy the cost controls. Keep the token-price ceilings and soft budget; do not reinstate full GPT-5.4 or start unbounded comparisons.
3. Verify a generated guide's signed share flow on production. Update the PDF with actual evidence and limitations, then upload and submit the complete package to https://forms.gle/ELMyW4DF2pp8yT7k9. No email send is authorized.

The Gmail own-app walkthrough is now complete for the tested read-only operation. After explicit user approval, Google consent and the local PKCE token exchange succeeded. An unsent draft with subject `fieldguide-test` was created through the existing Gmail connector, then retrieved by the independent local OAuth client using messages.list and messages.get. The result confirmed a matching subject and returned content, without logging message text, IDs or tokens. No email was sent, and no refresh token was requested. This does not verify sending, external-user approval, refresh handling or the blocked managed-client route.
