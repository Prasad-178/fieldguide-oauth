import { researchInput } from "@/lib/research/schema";
import { research, ResearchError } from "@/lib/research/openrouter";
import { signGuide } from "@/lib/research/share";
import { readLimitedText } from "@/lib/research/request";

export const maxDuration = 300;
const limits = new Map<string,{ count: number; reset: number }>();
let active = 0;
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({error:"Use the research form on this site."},{status:403});
  let raw: string;
  try { raw = await readLimitedText(request,2000); }
  catch { return Response.json({error:"Keep the app name and task short."},{status:413}); }
  let input;
  try { input = researchInput.parse(JSON.parse(raw)); }
  catch { return Response.json({error:"Add an app name and a short description of what you want to do."},{status:400}); }
  if (!process.env.OPENROUTER_API_KEY || !process.env.GUIDE_SIGNING_SECRET) return Response.json({error:"Live research is not configured. The site owner needs to finish setup."},{status:503});
  if (request.signal.aborted) return new Response(null,{status:499});
  const now = Date.now();
  for (const [key,value] of limits) if (value.reset < now) limits.delete(key);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const limit = limits.get(ip) ?? { count:0, reset:now+15*60*1000 };
  if (limit.count >= 6 || active >= 2) return Response.json({error:"Research is busy or you’ve reached the demo limit. Try again in 15 minutes."},{status:429,headers:{"Retry-After":"900"}});
  limit.count++; limits.set(ip,limit); active++;
  const controller = new AbortController();
  const abort = () => controller.abort();
  request.signal.addEventListener("abort",abort,{once:true});
  if (request.signal.aborted) controller.abort();
  const timeout = setTimeout(abort,240000);
  const signal = controller.signal;
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(output) {
      const send = (value: unknown) => { if (!signal.aborted) output.enqueue(encoder.encode(JSON.stringify(value)+"\n")); };
      try {
        const guide = await research(input,signal,(stage,detail)=>send({type:"progress",stage,detail}));
        send({type:"complete",guide,token:signGuide(guide)});
      } catch (error) {
        // Diagnostic categories only: never log inputs, keys, source text or raw provider errors.
        if (!request.signal.aborted) console.error("research_failed", error instanceof ResearchError ? { code:error.diagnostic?.code, stage:error.diagnostic?.stage, upstreamStatus:error.diagnostic?.upstreamStatus, status:error.status } : { code:signal.aborted?"timeout":"unexpected" });
        if (!request.signal.aborted) {
          const message = signal.aborted ? "Research took too long. Try a more specific app name or website." : error instanceof ResearchError ? error.message : "Research could not finish. Your input is preserved; try again.";
          try { output.enqueue(encoder.encode(JSON.stringify({type:"error",message})+"\n")); } catch {}
        }
      } finally {
        active--; clearTimeout(timeout); request.signal.removeEventListener("abort",abort);
        try { output.close(); } catch {}
      }
    },
    cancel() { controller.abort(); },
  });
  return new Response(stream,{headers:{"Content-Type":"application/x-ndjson","Cache-Control":"no-store","X-Accel-Buffering":"no"}});
}
