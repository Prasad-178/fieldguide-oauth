# Fieldguide resume checkpoint — 21 October 2026

Historical pause checkpoint. The owner resumed work; current model, deployment and verification are in [readiness-review.md](readiness-review.md). The notes below describe the state at the pause, not the current release.

## Saved work

- Public app: https://fieldguide-oauth.vercel.app
- Public source: https://github.com/Prasad-178/fieldguide-oauth
- Gmail own-app read-only consent, PKCE exchange and retrieval of an unsent test draft succeeded. Managed Gmail consent was blocked by Google. Slack and Notion remain documentation-based samples.
- Local cost-control candidate: GPT-5.4 Nano default; every model request limits provider pricing to $0.25/M input and $1.50/M output. No automatic premium fallback. Search charges are separate. Stop subsequent requests after $0.20 reported cost, missing billing data, or ten calls. One in-flight call can cross the soft ceiling; this is not a global account cap.
- Fixed document extraction that removed API endpoint/parameter text inside article headers and forms.
- Bounded review JSON to avoid regenerating an entire guide because a review string exceeded the runtime limit.
- Evaluation script records public outputs and supports explicitly labeled saved-discovery replays. No replay/canned fallback exists in production.
- 63 automated tests passed; lint, TypeScript, production build and whitespace checks passed. The final review-prompt change adds checks against conflating bot verification with ordinary user OAuth.

## Model evidence — not acceptance claims

| Trial | Result | Recorded request cost |
| --- | --- | --- |
| Nano, fresh Todoist managed | Withheld after review | $0.11863 |
| DeepSeek V4.1 Flash, fresh Discord | Withheld; protocol problems | $0.06008 |
| GLM-5.3, Discord with saved discovery | Six-step guide; independent review found bot/distribution conflation. Replay is not fresh end-to-end evidence. | $0.01114 |
| GLM-5.3, fresh Dropbox own app | Seven-step guide; still lists missing operation-reference evidence. Manual acceptance pending. | $0.07219 |
| GLM-5.3, fresh Todoist managed | Eight-step guide; manual acceptance pending. | $0.09277 |

All recorded trials in this cost-reduction round total approximately **$0.74**, below the promised $1 round budget. Provider account totals may settle later. GLM-5.3 is a promising candidate, not yet the configured default. Do not describe these results as a measured success rate.

## Exact local evidence

Ignored files are retained locally; no credentials or request headers were captured:

- `.data/evaluations/discord-1792576956875/guide.json` — GLM saved-discovery trial.
- `.data/evaluations/dropbox-1792577034536/guide.json` — fresh own-app trial.
- `.data/evaluations/managed-1792577035527/guide.json` — fresh managed trial.
- Each directory includes source texts, completion outputs and run metadata. `.data/latest-tests.txt` contains the 63-test run.
- `.data/build-submission.py` generates the existing `output/pdf/fieldguide-submission-draft.pdf`. The PDF still has old model/test/credit-limit text; **do not submit that draft**.
- `.data/submission-notes-draft.txt` also needs updating.

## Resume in this order

1. Inspect the final two guides and their source excerpts. Address actual unsupported handoffs, not merely model status. The Dropbox guide's unknown endpoint/root-path details are material; Todoist needs exact SDK/connection/tool instructions reviewed. Keep the owner’s low-cost preference and remaining round budget in view.
2. Select the cheap model and update source, `.env.example`, local configuration and README consistently. Keep all cost ceilings. Production currently still uses the older full GPT-5.4 deployment; **the cheaper configuration is not live yet**.
3. Verify the intended Vercel project, deploy, check the resulting page and signed sharing flow, then promote. Target owner/project: `prasad-sankars-projects/fieldguide-oauth`, project ID `prj_8vngJZGyRMqTIvXcajFP1a4XJuJq`.
4. Finalize the two-page PDF and inspect the rendered pages. Original brief: https://composio.notion.site/APM-Integrations-Take-home-Assignment-3f9f261a6dfe81489ee5e3643151f9d6
5. Upload the final PDF (one file, max 10 MB) to the assignment form, add accurate notes, submit and verify confirmation. Existing form: https://docs.google.com/forms/d/e/1FAIpQLSf8X8G_nnbvKD9g2A3nkic9qo74fw1SXnVLgchgz3D4lMf6lg/viewform . It currently has no upload or submission. User already authorized completing this assignment; emails remain draft-only.

## Working boundaries

Do not inspect `/Users/prasad/Prasad/Burni_Consulting/`. Keep provider keys in ignored environment files and Gmail credentials outside the repo. Do not grant new account access while reviewing guides. The temporary Gmail OAuth harness was stopped after the successful read; no refresh token was requested. Do not recreate it just to repeat completed evidence.
