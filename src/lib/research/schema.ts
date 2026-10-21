import { z } from "zod";

export function safePublicUrl(value: string): boolean {
  try {
    const u = new URL(value);
    const host = u.hostname.toLowerCase();
    return u.protocol === "https:" && !u.username && !u.password && !u.port && host.includes(".") &&
      !host.startsWith("[") && !/^\d+(\.\d+){3}$/.test(host) &&
      !/(^|\.)(localhost|local|internal|test|invalid|example|onion)$/.test(host) &&
      !host.endsWith(".example.com") && host !== "example.com";
  } catch { return false; }
}
const short = z.string().min(1).max(300);
const text = z.string().min(1).max(1200);
const refs = z.array(z.number().int().min(1).max(15)).max(6);
export const researchInput = z.object({
  query: z.string().trim().min(2).max(160),
  useCase: z.string().trim().min(3).max(300),
  audience: z.enum(["test", "public"]),
  auth: z.enum(["own", "managed"]),
}).strict();
export type ResearchInput = z.infer<typeof researchInput>;
export const sourceSchema = z.object({
  id: z.number().int().positive(), title: z.string().max(300), url: z.string().refine(safePublicUrl),
  evidence: z.enum(["retrieved", "search-excerpt"]),
});
export const guideBody = z.object({
  appName: z.string().min(1).max(80),
  officialWebsite: z.string().max(300),
  status: z.enum(["documented", "needs-clarification", "not-confirmed"]),
  summary: short,
  // Optional for older signed snapshots; required for every newly generated guide.
  overview: z.object({
    difficulty: z.enum(["Straightforward", "Some setup", "Complex", "Not confirmed"]),
    reason: short, agentCan: short, youHandle: short,
  }).optional(),
  effort: z.object({ handsOn: short, waiting: short, basis: short, sourceIds: refs }),
  prerequisites: z.array(z.object({ title: short, detail: short, sourceIds: refs })).max(5),
  permissions: z.array(z.object({ name: z.string().max(100), reason: short, sourceIds: refs })).max(6),
  steps: z.array(z.object({
    kind: z.enum(["setup", "permissions", "connect", "test", "launch", "clarify"]),
    title: z.string().max(90), action: short, detail: text,
    actor: z.enum(["you", "agent", "both"]),
    evidence: z.enum(["documented", "recommendation", "unknown"]),
    destination: z.string().max(90), url: z.string().max(500),
    successCheck: short, recovery: short, sourceIds: refs,
    instructions: z.array(short).min(1).max(8).optional(),
  })).min(1).max(12),
  blockers: z.array(z.object({ title: short, detail: text, sourceIds: refs })).max(5),
  unknowns: z.array(short).max(6),
  agentBrief: z.string().min(1).max(1800),
}).strict();
export type GuideBody = z.infer<typeof guideBody>;
export const generationGuideBody = guideBody.required({ overview: true }).extend({
  steps: z.array(guideBody.shape.steps.element.required({ instructions: true })).min(1).max(12),
});
export const savedGuide = guideBody.extend({
  version: z.literal(1),
  request: researchInput,
  generatedAt: z.string().datetime(),
  sources: z.array(sourceSchema).min(1).max(15),
  run: z.object({ model: z.string(), searches: z.number(), toolCalls: z.number(), pageReads:z.number().int().min(0).max(12).optional(), costUsd: z.number().nullable(), durationMs: z.number() }),
});
export type SavedGuide = z.infer<typeof savedGuide>;

export function validateEvidence(body: GuideBody, sourceIds: number[]): GuideBody {
  const known = new Set(sourceIds);
  if (body.status === "documented" && (!["test", "launch"].every(kind => body.steps.some(s => s.kind === kind)))) throw new Error("A complete guide needs a controlled test and launch checks.");
  const rows = [...body.steps, ...body.prerequisites, ...body.permissions, ...body.blockers, body.effort];
  if (rows.some(row => row.sourceIds.some(id => !known.has(id)))) throw new Error("Guide references a source that was not retrieved.");
  if (body.steps.some(s => s.evidence === "documented" && !s.sourceIds.length)) throw new Error("A documented step has no supporting source.");
  if (body.permissions.some(p => !p.sourceIds.length)) throw new Error("A permission has no supporting source.");
  if (body.officialWebsite && !safePublicUrl(body.officialWebsite)) body.officialWebsite = "";
  body.steps = body.steps.map(s => ({ ...s, actor: s.actor === "agent" && ["connect","test"].includes(s.kind) ? "both" : s.actor, url: safeGuideDestination(s.url) ? s.url : "" }));
  return body;
}

// A documentation link can live on api.slack.com, but a parameterless OAuth
// request is never a useful navigation button. Keep protocol calls in prose.
export function safeGuideDestination(value: string): boolean {
  if (!safePublicUrl(value)) return false;
  const url = new URL(value);
  const path = url.pathname.toLowerCase();
  if (/^\/api(?:\/|$)/.test(path)) return false;
  if (/(?:^|\/)(?:oauth(?:2|v2)?[_/-])?(?:token|authorize|access_token)(?:\/|$)/.test(path)) return false;
  if (/\/oauth(?:2|v2)?\/(?:v\d+\/)?(?:access|token|authorize|auth)(?:\/|$)/.test(path)) return false;
  if (url.hostname.startsWith("api.") && !(url.hostname === "api.slack.com" && /^\/(?:apps|docs|methods|scopes|authentication|concepts)(?:\/|$)/.test(path))) return false;
  return true;
}

// A provider's own OAuth docs cannot establish Composio-managed support.
// This is a minimum provenance check, not semantic proof of source claims.
export function validateManagedEvidence(body: GuideBody, input: ResearchInput, sources: {id:number;url:string}[]): void {
  if (input.auth !== "managed" || body.status !== "documented") return;
  const managedIds = new Set(sources.filter(s => {
    const host = new URL(s.url).hostname;
    return host === "composio.dev" || host.endsWith(".composio.dev");
  }).map(s => s.id));
  const supported = body.steps.some(s => ["setup","connect"].includes(s.kind) && /composio/i.test(`${s.title} ${s.action} ${s.detail}`) && s.sourceIds.some(id => managedIds.has(id)));
  if (!supported) throw new Error("Managed setup requires Composio evidence.");
}
