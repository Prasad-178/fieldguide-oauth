/** Live evaluation: uses the configured OpenRouter key and incurs API costs.
 * Does not connect accounts or perform provider API operations.
 * Run one case: node --env-file=.env.local --import tsx scripts/evaluate-research.mts dropbox
 */
import { mkdirSync, writeFileSync } from 'node:fs';
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
}finally{writeFileSync(`${dir}/run.json`,JSON.stringify({request:cases[name],events,durationMs:Date.now()-started},null,2));}
