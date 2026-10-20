import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { providerGuideSchema } from '../src/lib/research/provider-schema';
import { guideBody } from '../src/lib/research/schema';
import { completion, research, ResearchError } from '../src/lib/research/openrouter';

process.env.OPENROUTER_API_KEY='test-only-provider-key';
const response=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});

test('provider schema retains required fields and enums without nested bounded-state constraints',()=>{
 const raw=JSON.stringify(providerGuideSchema);
 for(const key of ['maxItems','minItems','maxLength','minLength','minimum','maximum','format','pattern'])assert.equal(raw.includes(`"${key}":`),false,key);
 const properties=providerGuideSchema.properties as Record<string,Record<string,unknown>>;
 assert.equal(providerGuideSchema.additionalProperties,false);
 assert.deepEqual(properties.status.enum,['documented','needs-clarification','not-confirmed']);
 assert.ok((providerGuideSchema.required as string[]).includes('steps'));
 assert.equal(properties.steps.type,'array');
});

test('schema rejection is classified as a configuration failure without exposing upstream raw data',async t=>{
 t.mock.method(globalThis,'fetch',async()=>response({error:{code:400,message:'Provider returned error',metadata:{raw:'The specified schema produces a constraint that has too many states for serving. PRIVATE',provider_name:'Google AI Studio'}}},400));
 await assert.rejects(completion({},AbortSignal.timeout(1000),'guide'),(error:unknown)=>{
  assert.ok(error instanceof ResearchError);
  assert.deepEqual(error.diagnostic,{code:'provider_request_rejected',stage:'guide',upstreamStatus:400});
  assert.match(error.message,/app issue/);
  assert.doesNotMatch(error.message,/PRIVATE|Try again shortly/);
  return true;
 });
});

test('provider errors inside HTTP 200 responses are not treated as successful completions',async t=>{
 t.mock.method(globalThis,'fetch',async()=>response({error:{code:429,message:'Busy'}}));
 await assert.rejects(completion({},AbortSignal.timeout(1000),'research'),(error:unknown)=>error instanceof ResearchError && error.status===429 && error.diagnostic?.upstreamStatus===429);
});

test('simplifying provider constraints does not let oversized guides pass runtime validation',async t=>{
 const fixture=JSON.parse(readFileSync(new URL('../docs/examples/linear.json',import.meta.url),'utf8'));
 const body=Object.fromEntries(Object.keys(guideBody.shape).map(key=>[key,fixture[key]]));
 body.summary='x'.repeat(301);
 let calls=0;
 t.mock.method(globalThis,'fetch',async()=>++calls===1?response({choices:[{message:{content:'Source notes',annotations:[{url_citation:{url:'https://linear.app/developers',title:'Linear',content:'Official documentation excerpt'}}]}}],usage:{server_tool_use_details:{web_search_requests:1,tool_calls_executed:1}}}):response({choices:[{message:{content:JSON.stringify(body)}}]}));
 await assert.rejects(research({query:'Linear',useCase:'Read issues',audience:'test',auth:'own'},AbortSignal.timeout(1000),()=>{}),/could not be formatted reliably/);
 assert.equal(calls,2);
});
