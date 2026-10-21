/** Live evaluation: uses the configured OpenRouter key and incurs API costs.
 * Does not connect accounts or perform provider API operations.
 * Run one case: node --env-file=.env.local --import tsx scripts/evaluate-research.mts dropbox
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { research, ResearchError } from '../src/lib/research/openrouter';
import { retrieveDocument } from '../src/lib/research/documents';
import type { ResearchInput } from '../src/lib/research/schema';
const cases:Record<string,ResearchInput>={
 asana:{query:"https://asana.com",useCase:"Read tasks from a user’s workspace",audience:"public",auth:"own"},
 discord:{query:"Discord",useCase:"Read the connected user’s basic profile",audience:"test",auth:"own"},
 dropbox:{query:'Dropbox',useCase:'List files in my integration app folder',audience:'public',auth:'own'},
 spotify:{query:'Spotify',useCase:'Read the current user’s saved tracks',audience:'public',auth:'own'},
 ambiguous:{query:'Flow',useCase:'Read tasks from a user’s workspace',audience:'public',auth:'own'},
 managed:{query:'Todoist',useCase:'Read my active tasks',audience:'test',auth:'managed'},
 unsupported:{query:'https://www.wikipedia.org',useCase:'Read public encyclopedia articles',audience:'test',auth:'own'},
};
const name=process.argv[2];
if(!cases[name])throw new Error(`Choose a case: ${Object.keys(cases).join(', ')}`);
const dir=`.data/evaluations/${name}-${Date.now()}`;
mkdirSync(dir,{recursive:true});
// Capture public research outputs for local diagnosis/replay. Never save headers,
// API keys or raw requests. These files stay in ignored .data/.
const upstreamFetch=globalThis.fetch;let completionCount=0;
const replayDir=process.env.EVAL_REPLAY_DIR;
const replayCount=Number(process.env.EVAL_REPLAY_CALLS ?? 0);
let providerRequests=0;
globalThis.fetch=async(...args:Parameters<typeof fetch>)=>{
 if(String(args[0])==='https://openrouter.ai/api/v1/chat/completions' && replayDir && ++providerRequests<=replayCount) {
  const saved=JSON.parse(readFileSync(`${replayDir}/completion-${providerRequests}.json`,'utf8'));
  const body={model:saved.model,choices:saved.choices,usage:{...saved.usage,cost:0}};
  writeFileSync(`${dir}/completion-${++completionCount}.json`,JSON.stringify({...body,replayedFrom:replayDir},null,2));
  return new Response(JSON.stringify(body),{status:saved.status ?? 200,headers:{'Content-Type':'application/json'}});
 }
 const response=await upstreamFetch(...args);
 if(String(args[0])==='https://openrouter.ai/api/v1/chat/completions') {
  const raw=await response.text();
  let record;
  try {
   const body=JSON.parse(raw);
   record={status:response.status,model:body.model,choices:body.choices,usage:body.usage};
  } catch {
   record={status:response.status,contentType:response.headers.get('content-type'),unparsedBody:raw.slice(0,2000)};
  }
  writeFileSync(`${dir}/completion-${++completionCount}.json`,JSON.stringify(record,null,2));
  return new Response(raw,{status:response.status,headers:{'Content-Type':response.headers.get('content-type') ?? 'application/json'}});
 }
 return response;
};
const events:unknown[]=[];let pages=0;
const started=Date.now();
try{
 const guide=await research(cases[name],AbortSignal.timeout(240000),(stage,detail)=>{events.push({stage,detail,elapsedMs:Date.now()-started});console.log(detail);},async(url,signal)=>{
  const doc=await retrieveDocument(url,signal);
  writeFileSync(`${dir}/source-${++pages}.json`,JSON.stringify({requestedUrl:url,...doc},null,2));return doc;
 });
 writeFileSync(`${dir}/guide.json`,JSON.stringify(guide,null,2));
 console.log(JSON.stringify({artifact:dir,status:guide.status,steps:guide.steps.length,run:guide.run,unknowns:guide.unknowns},null,2));
}catch(error){
 const message=error instanceof Error?error.message:'Unknown error';events.push({error:message,diagnostic:error instanceof ResearchError?error.diagnostic:undefined});console.log(JSON.stringify({artifact:dir,error:message,diagnostic:error instanceof ResearchError?error.diagnostic:undefined}));process.exitCode=1;
}finally{writeFileSync(`${dir}/run.json`,JSON.stringify({request:cases[name],replayedDiscovery:replayDir?{directory:replayDir,calls:replayCount}:undefined,events,durationMs:Date.now()-started},null,2));}
