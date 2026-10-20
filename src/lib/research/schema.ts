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
  })).min(1).max(7),
  blockers: z.array(z.object({ title: short, detail: text, sourceIds: refs })).max(5),
  unknowns: z.array(short).max(6),
  agentBrief: z.string().min(1).max(1800),
}).strict();
export type GuideBody = z.infer<typeof guideBody>;
export const savedGuide = guideBody.extend({
  version: z.literal(1),
  request: researchInput,
  generatedAt: z.string().datetime(),
  sources: z.array(sourceSchema).min(1).max(15),
  run: z.object({ model: z.string(), searches: z.number(), toolCalls: z.number(), costUsd: z.number().nullable(), durationMs: z.number() }),
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
  body.steps = body.steps.map(s => ({ ...s, url: safePublicUrl(s.url) && !/^https:\/\/api\./.test(s.url) && !/\/oauth\/(token|authorize)(?:[/?#]|$)/.test(s.url) ? s.url : "" }));
  return body;
}
