# Developer UX review — 20 October 2026

## Method and scope

Comparative desk research of eight developer platforms: Vercel, Stripe, Supabase, Clerk, Resend, Nango, Pipedream and GitHub. Composio's managed OAuth documentation was also checked as the assignment-specific reference. Read public documentation and component guidance. Visually inspected Vercel Input, Resend's Next.js guide and Nango Quickstart in the browser. No private dashboard walkthroughs, interviews, conversion studies or successful provider registrations are claimed.

Prasad's direct feedback: too much text, unclear action, oversized input, generic brand symbols, weak motion, missing pointer cursors and harsh validation. These are observed problems with our preview. Competitor patterns below suggest solutions; they do not prove our version is usable.

## Evidence → product implications

| Reference | Observed pattern | Application to Fieldguide | Tradeoff |
|---|---|---|---|
| [Vercel Input](https://vercel.com/geist/input), [Error](https://vercel.com/geist/error), [Typography](https://vercel.com/geist/typography) | Field-level feedback stays with its input; concise copy explains recovery. Typography has distinct roles. | Keep an associated inline error, readable small text, visible focus, and one primary action. Use one sans family; monospace only for exact technical values. | Do not copy framework-specific component APIs or turn every hint into an alert. |
| [Stripe Checkout quickstart](https://docs.stripe.com/checkout/quickstart), [Workbench](https://docs.stripe.com/workbench/overview) | Quickstart reaches a testable result and includes success, authentication and decline cases. Workbench exposes operational diagnostics. | Every guide needs an expected result and a recovery path. Later research errors should name the failed stage and preserve usable evidence. | A checked task is not proof of a working integration; do not invent a test result. |
| [Supabase Next.js quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) | Framework-specific instructions, numbered steps, exact paths, optional AI tooling and direct links to relevant setup surfaces. | Ask only context that changes guidance; link directly to the destination; make exact scopes and callbacks easy to inspect. | Avoid showing all frameworks and authentication options together. |
| [Clerk Next.js quickstart](https://clerk.com/docs/nextjs/getting-started/quickstart) | Manual steps coexist with an agent prompt, package-manager choices and version-sensitive instructions. The flow ends with creating a first user. | Offer an agent handoff alongside human instructions. Attach compatibility assumptions to the relevant step. | A copied agent prompt must not imply that actions have been performed or authorized. |
| [Resend Next.js guide](https://resend.com/docs/send-with-nextjs) | Prerequisites come before numbered implementation steps; code examples name files; optional resources follow the first outcome. | Surface prerequisite access before the user leaves our app. Keep advanced explanation behind disclosure. | Documentation can tolerate long pages; our guided task view should stay shorter. |
| [Nango Quickstart](https://nango.dev/docs/getting-started/quickstart) | Distinguishes integration creation, account authorization, a function call and run inspection. Provides manual and agent-assisted paths. | Separate provider app registration, end-user consent and observed operation success. Show evidence for each rather than one ambiguous completion status. | Managed OAuth can remove registration work, but not every requirement. |
| [Pipedream Connect Quickstart](https://pipedream.com/docs/connect/quickstart) | Guided initialization leads to a working demo or playground. Verification and next steps are explicit. | Keep the first connection as a distinct milestone; make testing actionable before discussing expansion. | A playground is a follow-up, not a reason to build a large editor for this take-home. |
| [GitHub OAuth app creation](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app) | Exact navigation and field names, including alternatives for first-time users and contextual warnings. | Use provider-specific field labels and include recovery when settings differ. | Provider UIs change; link sources and show when checked. |

[Composio managed OAuth](https://docs.composio.dev/toolkits/managed-auth) is the domain reference: choosing a managed app versus a custom client changes the work. This choice should be understandable before someone follows unnecessary registration instructions.

## Page and component review

| Surface | Current decision | Remaining improvement / acceptance check |
|---|---|---|
| Lookup | Compact input, recognizable app logos, single Find guide action. | App aliases and URL normalization should resolve consistently; unfamiliar apps must enter real research. |
| Validation | 13px desktop / 12px mobile, muted red, icon, matching border, aria-describedby and alert announcement. | Empty submission focuses the field; typing clears feedback; inputs retain text cursor. |
| All controls | Pointer cursor for enabled interactive controls, including portalled dialogs. | Check buttons, anchors, radio labels, accordion triggers and close controls. Disabled controls must not look actionable. |
| Use case | Operation and intended audience determine the path. | Avoid questions that never change the resulting instructions. |
| Guide header | Current provider and context remain visible. | Make test readiness and launch readiness separate, compact summaries. |
| Step navigation | Current step and self-reported progress are distinct. Mobile accessible labels retain the step title. | Changing setup context clears incompatible progress. No backend verification implied. |
| Task card | One action, external destination, optional detail, success check and recovery. | Add short provider-specific prerequisites and meaningful agent/human responsibility. |
| Motion | Staggered nodes, moving connector, small icon motion and completion ticks. Runs once; replay is optional. | Decorative illustration remains labeled. Reduced motion shows the complete diagram immediately. Never animate fake research progress as if it were real. |
| Sources | Readable source panel with explicit limits. | Link individual claims to the documents actually consulted; distinguish official-source evidence, attempted setup and unknowns. |
| Research | Live OpenRouter search and structured guide generation now implemented. | Real stage updates, timeout/retry/cancel, preserved query and sources. Failures do not silently return a sample. |
| Sharing | Context URL excludes personal progress. | Generated guides need stable public access and evidence metadata; localhost links are not a submission deliverable. |
| Completion | Checklist completion does not claim provider approval. | Show remaining launch requirements and where to resolve them. |

## Priorities after this UI pass

1. Real unfamiliar-app investigation and a shareable result: required by the assignment, not a visual enhancement.
2. Evidence quality: attributable sources, checked time, explicit unresolved claims, practical setup observations.
3. Separate hands-on effort from external waiting. Label estimates as estimates; do not present unmeasured time as observed fact.
4. Add a compact prerequisite summary and practical agent handoff.
5. Deployment, repository, README and submission package after end-to-end validation.

Avoid extra landing-page sections, decorative loops, fabricated completion percentages, unnecessary login before reading a guide, and generic confidence scores without evidence. These are design judgments informed by the comparison, not claims about measured competitor outcomes.

## Verification of this pass

`npm run lint` and `npm run build` passed. Browser inspection found pointer cursors on every home-page button and text cursor on the input. Empty submission showed the associated 13px message; mobile showed 12px at 390px width without horizontal overflow. During replay the icon transform changed and ticks appeared sequentially; all three ticks were visible at completion. Reduced-motion mode displayed the final state with halos hidden. No provider action was performed.

## Practical evaluation before delivery

Ask a developer to find a guide, choose the least-privileged operation, identify the next action, explain what blocks external launch, recover from a failed lookup and share the result. Observe where they pause or need help. Track task completion, wrong turns and misunderstood approval claims. Do not invent targets or claim these sessions have already happened.

## Live implementation follow-through

The live backend, signed shareable snapshots, prerequisites, separate effort/wait fields, claim-linked sources and agent handoff are now implemented. See [validation](validation.md) for actual runs and corrections. GitHub registration-form inspection was added after the original desk-research pass; no app was created. Earlier priorities above record the design sequence, not current blockers.
