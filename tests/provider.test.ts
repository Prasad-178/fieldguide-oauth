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
 await assert.rejects(research({query:'Linear',useCase:'Read issues',audience:'test',auth:'own'},AbortSignal.timeout(1000),()=>{}),/could not pass our checks/);
 assert.equal(calls,3);
});

for (const [status,pattern] of [[401,/authenticate/],[402,/credits/],[403,/does not allow/],[429,/busy/],[500,/unavailable/],[503,/unavailable/]] as const) {
 test(`provider ${status} has an actionable safe error`,async t=>{
  t.mock.method(globalThis,'fetch',async()=>response({error:{message:'PRIVATE_UPSTREAM_DETAIL'}},status));
  await assert.rejects(completion({},AbortSignal.timeout(1000),'research'),(error:unknown)=>{
   assert.ok(error instanceof ResearchError);assert.match(error.message,pattern);assert.doesNotMatch(error.message,/PRIVATE_UPSTREAM_DETAIL/);assert.equal(error.diagnostic?.upstreamStatus,status);return true;
  });
 });
}

test('invalid JSON provider output is rejected with a safe diagnostic',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response('<html>gateway failed PRIVATE</html>',{status:502}));
 await assert.rejects(completion({},AbortSignal.timeout(1000),'research'),(error:unknown)=>error instanceof ResearchError && error.diagnostic?.code==='invalid_provider_response' && !error.message.includes('PRIVATE'));
});

for (const [name,body] of [
 ['empty choices',{choices:[]}],
 ['empty content',{choices:[{message:{content:''}}]}],
 ['truncated content',{choices:[{finish_reason:'length',message:{content:'partial'}}]}],
] as const) {
 test(`rejects ${name}`,async t=>{
  t.mock.method(globalThis,'fetch',async()=>response(body));
  await assert.rejects(completion({},AbortSignal.timeout(1000),'guide'),/incomplete/);
 });
}

for(const [name,usage,annotations,expected] of [
 ['no search',{},[{url_citation:{url:'https://linear.app/docs',content:'Notes'}}],/No live search/],
 ['no citations',{server_tool_use_details:{web_search_requests:1}},[],/usable sources/],
 ['unsafe citation',{server_tool_use_details:{web_search_requests:1}},[{url_citation:{url:'https://127.0.0.1',content:'Notes'}}],/usable sources/],
] as const){
 test(`research refuses ${name} before generating a guide`,async t=>{
  let calls=0;
  t.mock.method(globalThis,'fetch',async()=>{calls++;return response({choices:[{message:{content:'Notes',annotations}}],usage});});
  await assert.rejects(research({query:'Linear',useCase:'Read issues',audience:'test',auth:'own'},AbortSignal.timeout(1000),()=>{}),expected);
  assert.equal(calls,1);
 });
}

test('cancellation reaches the in-flight provider request',async t=>{
 const controller=new AbortController();
 t.mock.method(globalThis,'fetch',async(_url:unknown,init?:RequestInit)=>{
  assert.equal(init?.signal,controller.signal);
  return new Promise<Response>((_resolve,reject)=>init?.signal?.addEventListener('abort',()=>reject(init.signal?.reason),{once:true}));
 });
 const pending=completion({},controller.signal,'research');controller.abort();
 await assert.rejects(pending,(error:unknown)=>error instanceof DOMException && error.name==='AbortError');
});

test('null JSON from a provider is handled as an invalid response',async t=>{
 t.mock.method(globalThis,'fetch',async()=>response(null));
 await assert.rejects(completion({},AbortSignal.timeout(1000),'research'),(error:unknown)=>error instanceof ResearchError && error.diagnostic?.code==='invalid_provider_response');
});


test('one invalid draft is repaired against the same evidence, and both costs are counted',async t=>{
 const fixture=JSON.parse(readFileSync(new URL('../docs/examples/linear.json',import.meta.url),'utf8'));
 const body=Object.fromEntries(Object.keys(guideBody.shape).map(key=>[key,fixture[key]]));
 for(const row of [...body.steps,...body.permissions,...body.prerequisites,...body.blockers,body.effort])row.sourceIds=[1];
 const invalid=structuredClone(body);invalid.steps[0].sourceIds=[15];let calls=0;
 t.mock.method(globalThis,'fetch',async()=>{
  calls++;
  return calls===1?response({choices:[{message:{content:'Notes',annotations:[{url_citation:{url:'https://linear.app/developers',content:'Documentation'}}]}}],usage:{cost:.01,server_tool_use_details:{web_search_requests:1}}}):response({choices:[{message:{content:JSON.stringify(calls===2?invalid:body)}}],usage:{cost:.01}});
 });
 const guide=await research({query:'Linear',useCase:'Read issues',audience:'test',auth:'own'},AbortSignal.timeout(1000),()=>{});
 assert.equal(calls,3);assert.equal(guide.run.costUsd,.03);assert.deepEqual(guide.steps[0].sourceIds,[1]);
});

test('aborting while reading the provider body remains a cancellation',async t=>{
 const controller=new AbortController();
 t.mock.method(globalThis,'fetch',async()=>{
  const result=response({});
  result.json=async()=>{controller.abort();throw controller.signal.reason;};return result;
 });
 await assert.rejects(completion({},controller.signal,'guide'),(error:unknown)=>error instanceof DOMException && error.name==='AbortError');
});
