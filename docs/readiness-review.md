# Assignment readiness review

Reviewed 21 October 2026 against the original live Notion brief:
https://composio.notion.site/APM-Integrations-Take-home-Assignment-3f9f261a6dfe81489ee5e3643151f9d6

Status: **not submission-ready**. Prasad's hands-on Gmail review found missing links and insufficient instructions. The earlier assessment below describes implementation coverage, not validated usability. A walkthrough and unfamiliar-app research rebuild is in progress; see `walkthrough-rebuild.md`. Nothing submitted.

| Requirement | Current evidence | Assessment |
| --- | --- | --- |
| Working experience | https://fieldguide-oauth.vercel.app | Deployed and exercised on production |
| A few varied real apps | Gmail, Slack, GitHub sample guides; additional captured live outputs | Covered; 100 guides explicitly not required |
| Name/website input and live unfamiliar-app generation | OpenRouter research and sourced generation; live Asana, Discord, Linear, Airtable and other runs | Implemented; ambiguous names and provider failures remain weaknesses |
| Shareable actionable guide | Signed snapshots, next actions, source links, success/recovery details | Implemented and browser checked |
| Effort, waiting, requirements, blockers, agent/human boundaries | Guide fields, launch panels and agent handoff | Covered with uncertainty; no universal approval-time promises |
| Evidence and corrections | docs/validation.md and docs/examples | Documented; 36 automated checks, browser checks and source inspection |
| Practical setup investigation | GitHub OAuth registration form inspected read-only | Limited evidence; a real guided setup walkthrough would strengthen the submission |
| Source and short README | Private GitHub repository, local setup, decisions and limitations | README ready; reviewer access unresolved |
| Submission package | Form previously inspected: one file, maximum 10 MB | Upload document still needs preparation; no upload or submission made |

The brief allows a focused working slice, does not require paid accounts or completed provider approvals, and asks for a sample checked against real sources or setup attempts. Our limited practical setup work must remain explicit. Passing software tests does not establish every generated claim's factual correctness.

## Prasad's review session

1. Open the home page and choose Gmail. Compare send vs read and test vs external-user contexts. Check whether the next action and launch implications are understandable without coaching.
2. Live research: Asana; task `Read tasks from a user's workspace`; External users; My own OAuth app. Inspect one source, the actual task-reading test and launch requirements.
3. Live research: Slack; task `Send a message to a channel`; External users; Composio managed. Confirm that the guide explains the managed connection instead of requiring a developer-owned Slack app.
4. Share a generated guide and reopen it in a new tab. Check that the same guide returns and personal checklist progress is empty.
5. Optional: research a new provider by its official website. Record confusing instructions or an error verbatim, plus app/task/audience/auth choices.

The demo allows six research requests per IP per 15 minutes. Reviewing samples and reopening saved guides do not invoke new paid research. No provider registration or consent is needed to test the Fieldguide experience itself.

Before submitting: address material review feedback, make the source accessible to the intended reviewers (public repository or explicit reviewer access, by Prasad's choice), prepare the upload document with app/repository links and honest evidence/limitations, then obtain explicit submission instruction.

## Latest local checkpoint — 21 October 2026

Gmail managed and own-client instructions are rebuilt with visible ordered actions, real destinations, success/recovery checks and an effort/ownership summary. Slack and Notion replace the earlier generic examples; GitHub is removed from the sample set. Local browser checks cover the overview, step navigation, scope-copy feedback, share dialog, responsive layout and actual brand marks.

**Still not submission-ready.** Live unfamiliar-app tests found remaining false positives from model review (Todoist), incomplete primary operation evidence (Dropbox), and incomplete public rollout context (Spotify). Wikipedia's no-OAuth public summary request was independently executed successfully, but that single case is not a general pass. See `unfamiliar-app-evaluation.md` for exact artifacts and failures.

Google own-app walkthrough awaits the user's review of the User Data Policy in the isolated test project. Managed read-only consent was blocked by Google. Neither route has completed a mailbox grant or controlled mailbox operation. No submission, new deployment or outbound email was performed at this checkpoint; production still shows the earlier version.
