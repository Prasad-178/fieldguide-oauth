# Assignment readiness review

Reviewed 21 October 2026 against the original live brief:
https://composio.notion.site/APM-Integrations-Take-home-Assignment-3f9f261a6dfe81489ee5e3643151f9d6

**Status: rebuilt experience deployed; submission pending.** Do not claim full unfamiliar-app acceptance yet. The new full GPT-5.4 pipeline reached live generation/review, but the final Todoist and Asana trials stopped with OpenRouter HTTP 402. Earlier runs exposed both factual/actionability gaps and timeout/shape failures. These are recorded rather than counted as passes.

## Requirement check

| Brief requirement | Current evidence | Remaining work |
| --- | --- | --- |
| Working experience | https://fieldguide-oauth.vercel.app; rebuilt Gmail instructions verified in the public browser; home HTTP 200 and invalid API request HTTP 400 | Verify a complete full-model research and shared-link run after credit restoration |
| A few varied apps | Gmail (managed and own), Slack (workspace/distribution), Notion (public OAuth and page selection) | Slack/Notion remain documentation-based, not completed account setups |
| Unfamiliar apps live | Search, direct primary-page retrieval, link following, structured guide and source review; full GPT-5.4 now the default | Current stronger-model acceptance is incomplete; no canned fallback is used |
| Useful setup and launch guidance | Visible ordered actions, destinations, success/recovery checks, effort/waiting, prerequisites and agent/human summary | Source-backed instructions can still be wrong; reviewers should inspect citations |
| Practical investigation | Gmail managed configuration created, consent blocked; own Google project/API/identity/scope/test user/client created, consent and token exchange completed, known test draft retrieved through Gmail API | Read fixture was an unsent draft; no send, refresh-token or public-approval test |
| Repeatability and evidence | 58 automated tests; lint/build/diff check; history secret scan; production dependency audit reports zero findings | Nine high findings remain in development tooling; no forced breaking dependency changes applied |
| Source and README | Public GitHub repository with setup instructions, decisions and limits; anonymous GitHub API confirms private=false | Source access complete |
| Submission | Form confirmed: one file, max 10 MB; short PDF draft prepared locally | No upload, form submission or email sent |

## Model and reliability decisions

The user requested a stronger model. Default/local configuration is now `openai/gpt-5.4`, used for search, generation and review. The production environment does not override the default. OpenAI receives bounded structured-output schemas; other providers retain the earlier compatible shape-only schema with runtime validation. The request deadline is 240 seconds within a 300-second function duration. These changes need final successful live acceptance after credit restoration.

Relative links in Markdown documentation are now resolved before link following. Managed research reads four current Composio session/authentication references. Documented SDK instructions cannot use an undefined Composio client/session or mix Python and TypeScript result fields. Product identity is distinguished from missing SDK/protocol documentation.

OpenRouter returned HTTP 402 during the final Todoist and Asana reviews. A subsequent read-only account check showed approximately $1.15 remaining on the latest check, so this is insufficient credit for the requested work, not a verified zero balance. No new paid trials were started after that finding. Do not present partial requests as completed guides.

## Deployed revision

Latest runtime revision: `b85cf04`. Deployment: `dpl_xep88QQyW6xAKhetcceNCA5bjyUJ`, built on 21 October 2026. This includes the successful own-app read evidence and route-specific status labels.
The public domain resolves to the rebuilt deployment. Preview protection remains enabled; CLI verification used Vercel's supported authenticated curl. No production credentials are included in the repository or PDF.

## Final acceptance sequence

1. Restore sufficient OpenRouter credits. Run one complete unfamiliar own-app guide and one managed guide; inspect every critical instruction, not just status/JSON.
2. Exercise a generated guide's share/verification flow on production and check the model/run details.
3. Source access is confirmed. Update the PDF with the final evidence, upload it to https://forms.gle/ELMyW4DF2pp8yT7k9 and submit only the complete package.

The Gmail own-app walkthrough is now complete for the tested read-only operation. After explicit user approval, Google consent and the local PKCE token exchange succeeded. An unsent draft with subject `fieldguide-test` was created through the existing Gmail connector, then retrieved by the independent local OAuth client using messages.list and messages.get. The result confirmed a matching subject and returned content, without logging message text, IDs or tokens. No email was sent, and no refresh token was requested. This does not verify sending, external-user approval, refresh handling or the blocked managed-client route.
