# Fieldguide

Find the next step in OAuth setup. Choose a Gmail, Slack or GitHub sample, or research another app by name or website. Guides separate setup work, a controlled connection test, and external launch requirements.

Live: **https://fieldguide-oauth.vercel.app** · [Source repository](https://github.com/Prasad-178/fieldguide-oauth) (currently private; reviewers need access).

Built for the Composio APM integrations take-home with Next.js, React, TypeScript, shadcn/Radix, Tailwind, Motion and OpenRouter.

## Run locally

Requires Node.js 20.18.1+ (validated on Node 24) and an OpenRouter account with access to the selected model and web tools.

```sh
npm ci
cp .env.example .env.local
```

Set `OPENROUTER_API_KEY` in `.env.local`. Generate a private signing value with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` and save it as `GUIDE_SIGNING_SECRET`. Keep it stable across deployments so shared guides remain valid. Never commit either value.

```sh
npm run dev -- --port 3017
```

Open http://localhost:3017. Samples work without credentials; live research requires the two server variables. `OPENROUTER_MODEL` defaults to `openai/gpt-5.4-mini`. No separate search API key or database is required.

## Try it

1. Compare Gmail's send/read permissions and approval requirements with Slack or GitHub.
2. Search for **Linear** and describe **reading issues in a test workspace**. Choose your intended audience and client ownership.
3. Watch actual research stages, inspect step citations, open success/recovery details, and check launch requirements.
4. Share the guide and reopen its link. It preserves the researched snapshot, not personal checklist progress.
5. Try an unclear app name. The app should ask for clarification or return an explicit research error, never silently show a prewritten sample.

Use “Refresh research” within a sample to investigate its current requirements. Marking a step done is self-reported; Fieldguide does not connect accounts or verify provider approval.

## How it works

`POST /api/research` validates context, then:

1. Searches for the requested product, operation and approval requirements. An identity check asks for the official website when the product is ambiguous.
2. Selects primary sources, reads up to four pages, and follows up to two relevant documentation links. The server checks public HTTPS destinations, pins DNS resolution to public IPv4 addresses and rechecks redirects. It sends no cookies or credentials. Long documents keep the introduction and task-relevant excerpts.
3. Generates ordered instructions, an effort/ownership overview, success checks and recovery steps. Zod validates bounds, citation references and destination links.
4. Reviews the draft against the page text for missing handoffs, unsupported claims and operation/launch gaps. One targeted search can retrieve up to two additional pages. Up to three drafts are allowed. Unresolved review findings become a `not-confirmed` result with the unsupported walkthrough withheld.

This is model-assisted review, not proof of correctness. Search excerpts are distinguished from pages actually read. The same pipeline handles unfamiliar apps; recorded example outputs are never selected as hidden fallbacks.

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

Current status: **rebuild in progress; not submission-ready after hands-on feedback**. Production still has the earlier sample guides. See [the walkthrough findings](docs/walkthrough-rebuild.md).

Run an unfamiliar-app evaluation (uses paid OpenRouter requests, no account actions):

```sh
node --env-file=.env.local --import tsx scripts/evaluate-research.mts dropbox
```

Other cases: `discord`, `spotify`, `managed`, `ambiguous`, `unsupported`. Outputs and public source excerpts are saved under ignored `.data/evaluations/`. Inspect instruction quality separately from HTTP/JSON success.

Read [the validation report](docs/validation.md), [developer UX research](docs/developer-ux-review.md), and actual generated [Linear](docs/examples/linear.json) / [Notion](docs/examples/notion.json) / [Airtable](docs/examples/airtable.json) examples. These JSON files are recorded outputs, not fallbacks used by the live endpoint.

## Deployment

`vercel.json` declares Next.js. Add `OPENROUTER_API_KEY` and `GUIDE_SIGNING_SECRET` as sensitive production environment variables in the intended Vercel project, then deploy. Local `.env*`, raw research artifacts and development files are excluded from uploads. Never expose keys with a `NEXT_PUBLIC_` prefix.

## Limitations

- This is a focused take-home, not a complete 100-provider library or production OAuth platform.
- Pages may be inaccessible, incomplete or changed; task-relevant excerpts may omit context. The reader does not execute JavaScript and currently requires public IPv4. Model source selection and review can still be wrong. Citations do not prove correctness.
- Live research is nondeterministic. Recorded successful examples are evidence of those runs, not a pass rate.
- A dedicated Gmail managed auth configuration and Google Cloud test project were created during the browser walkthrough. Google blocked the managed read-only consent attempt; own-app setup paused at the User Data Policy agreement. No client secret, mailbox grant, token exchange, API operation or approval was completed.
- Sample guidance is dated 20 October 2026. Generated guides show their own timestamps; neither updates automatically after sharing.
- In-process limits allow six research requests per IP per 15 minutes and two active requests per server instance. They are not a durable global quota. The deployed Vercel project also has a published firewall rule limiting POST /api/research to six requests per IP per 15 minutes. Tool/output caps reduce individual request cost; they do not impose an account spending cap.
- Cancellation aborts the local provider request, but cannot guarantee that already-started provider work stops or is unbilled.
- No usability interviews or full accessibility audit were conducted. Browser checks and direct user feedback informed the UI.

Brand SVGs are bundled from Iconify's SVG Logos collection (GilBarbara, CC0). No runtime logo service is required.
