# Fieldguide

Find the next step in OAuth setup. Choose a Gmail, Slack or GitHub sample, or research another app by name or website. Guides separate setup work, a controlled connection test, and external launch requirements.

Live: **https://fieldguide-oauth.vercel.app** · [Source repository](https://github.com/Prasad-178/fieldguide-oauth) (currently private; reviewers need access).

Built for the Composio APM integrations take-home with Next.js, React, TypeScript, shadcn/Radix, Tailwind, Motion and OpenRouter.

## Run locally

Requires Node.js 20.9+ (validated on Node 24) and an OpenRouter account with access to the selected model and web tools.

```sh
npm ci
cp .env.example .env.local
```

Set `OPENROUTER_API_KEY` in `.env.local`. Generate a private signing value with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` and save it as `GUIDE_SIGNING_SECRET`. Keep it stable across deployments so shared guides remain valid. Never commit either value.

```sh
npm run dev -- --port 3017
```

Open http://localhost:3017. Samples work without credentials; live research requires the two server variables. `OPENROUTER_MODEL` defaults to `google/gemini-2.5-flash`. No separate search API key or database is required.

## Try it

1. Compare Gmail's send/read permissions and approval requirements with Slack or GitHub.
2. Search for **Linear** and describe **reading issues in a test workspace**. Choose your intended audience and client ownership.
3. Watch actual research stages, inspect step citations, open success/recovery details, and check launch requirements.
4. Share the guide and reopen its link. It preserves the researched snapshot, not personal checklist progress.
5. Try an unclear app name. The app should ask for clarification or return an explicit research error, never silently show a prewritten sample.

Use “Refresh research” within a sample to investigate its current requirements. Marking a step done is self-reported; Fieldguide does not connect accounts or verify provider approval.

## How it works

`POST /api/research` validates context, then runs two server-side OpenRouter stages (with at most one additional corrected guide draft):

1. **Investigate:** the model uses web search/fetch with bounded tool calls. Returned URL annotations form the evidence registry. A run without a reported search or usable source excerpts is rejected.
2. **Structure:** the model writes a typed guide from those excerpts. The provider receives a simplified shape schema; Zod enforces the full response bounds afterward; documented steps and permissions need source references, and a documented guide must include a controlled test and launch check. An invalid draft gets one correction attempt against the same evidence; a second invalid draft is rejected. Managed setup additionally requires a Composio-cited setup or connection step.

The client receives real stage changes over NDJSON. There is no fabricated percentage counter. A 150-second timeout, cancellation, input preservation and readable failures support recovery.

The server compresses and signs each guide. `/shared#guide=…` contains the snapshot; verification uses a POST request so the fragment is absent from server access-log URLs. Anyone with the link can read its contents. Signatures detect editing; they do not certify factual accuracy. Changing the signing secret invalidates existing links.

## Decisions

- **One action at a time:** short instructions, provider destinations, expandable detail, a success check and recovery. Launch blockers remain separate from checklist completion.
- **Context changes the answer:** intended operation, test/public audience and managed/own client affect permissions and setup.
- **Evidence has limits:** citations identify retrieved material; explicit unknowns cover missing policy evidence. Hands-on estimates and external waiting are separate.
- **No account automation:** the agent can prepare code and instructions. The developer handles login, consent, secrets and account changes.
- **No database for this slice:** signed links keep shared snapshots portable across server instances. Long links, no central deletion and signing-key rotation are explicit tradeoffs.

## Validation and evidence

```sh
npm test
npm run lint
npm run build
```

Read [the validation report](docs/validation.md), [developer UX research](docs/developer-ux-review.md), and actual generated [Linear](docs/examples/linear.json) / [Notion](docs/examples/notion.json) / [Airtable](docs/examples/airtable.json) examples. These JSON files are recorded outputs, not fallbacks used by the live endpoint.

## Deployment

`vercel.json` declares Next.js. Add `OPENROUTER_API_KEY` and `GUIDE_SIGNING_SECRET` as sensitive production environment variables in the intended Vercel project, then deploy. Local `.env*`, raw research artifacts and development files are excluded from uploads. Never expose keys with a `NEXT_PUBLIC_` prefix.

## Limitations

- This is a focused take-home, not a complete 100-provider library or production OAuth platform.
- Search excerpts can omit important details; the model can still misinterpret a source. Citation-ID checks do not prove a claim is supported. Verify provider requirements before acting.
- Live research is nondeterministic. Recorded successful examples are evidence of those runs, not a pass rate.
- No OAuth registration, token exchange, account connection or approval was completed. GitHub's registration form was inspected read-only.
- Sample guidance is dated 20 October 2026. Generated guides show their own timestamps; neither updates automatically after sharing.
- In-process limits allow six research requests per IP per 15 minutes and two active requests per server instance. They are not a durable global quota. The deployed Vercel project also has a published firewall rule limiting POST /api/research to six requests per IP per 15 minutes. Tool/output caps reduce individual request cost; they do not impose an account spending cap.
- Cancellation aborts the local provider request, but cannot guarantee that already-started provider work stops or is unbilled.
- No usability interviews or full accessibility audit were conducted. Browser checks and direct user feedback informed the UI.

Brand SVGs are bundled from Iconify's SVG Logos collection (GilBarbara, CC0). No runtime logo service is required.
