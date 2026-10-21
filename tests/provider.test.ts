import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { providerGuideSchema, guideSchemaForModel } from '../src/lib/research/provider-schema';
import { guideBody } from '../src/lib/research/schema';
import { completion, research, ResearchError } from '../src/lib/research/openrouter';
import { validateDestinations, validateProtocolInstructions } from '../src/lib/research/quality';

process.env.OPENROUTER_API_KEY='test-only-provider-key';
test('OpenAI receives length and array bounds; Gemini retains the compatible shape-only schema',()=>{
 const bounded=JSON.stringify(guideSchemaForModel('openai/gpt-5.4'));
 assert.match(bounded,/maxLength/);assert.match(bounded,/maxItems/);
 assert.deepEqual(guideSchemaForModel('google/gemini-3-flash-preview'),providerGuideSchema);
});
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
 const body=Object.assign(Object.fromEntries(Object.keys(guideBody.shape).map(key=>[key,fixture[key]])),{overview:{difficulty:'Some setup',reason:'OAuth registration and a test are needed.',agentCan:'Prepare callback and test code.',youHandle:'Authorize the test account.'},steps:fixture.steps.map((step:Record<string,unknown>)=>({...step,instructions:['Follow the documented setup instruction.']}))});
 body.summary='x'.repeat(301);
 let calls=0;
 t.mock.method(globalThis,'fetch',async()=>{
  calls++;
  if(calls===1)return sourceResult();
  if(calls===2)return draftResult({sourceIds:[1],gaps:[],identity:"confirmed",identityReason:"The official Linear documentation matches the requested product."});
  return draftResult(body);
 });
 await assert.rejects(research({query:'Linear',useCase:'Read issues',audience:'test',auth:'own'},AbortSignal.timeout(1000),()=>{},readFixture),(error:unknown)=>{
  assert.ok(error instanceof ResearchError);
  assert.match(error.message,/could not pass our checks/);
  assert.match(error.diagnostic?.checks?.[0] ?? '',/summary/);
  return true;
 });
 assert.equal(calls,5);
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


function generatedFixture() {
 const fixture=JSON.parse(readFileSync(new URL('../docs/examples/linear.json',import.meta.url),'utf8'));
 const body=Object.assign(Object.fromEntries(Object.keys(guideBody.shape).map(key=>[key,fixture[key]])),{overview:{difficulty:'Some setup',reason:'OAuth registration and a test are needed.',agentCan:'Prepare callback and test code.',youHandle:'Authorize the test account.'},steps:fixture.steps.map((step:Record<string,unknown>)=>({...step,instructions:['Follow the documented setup instruction.']}))});
 for(const row of [...body.steps,...body.permissions,...body.prerequisites,...body.blockers,body.effort])row.sourceIds=[1];
 for(const step of body.steps)step.url='https://linear.app/developers';
 return guideBody.parse(body);
}
const sourceResult=()=>response({choices:[{message:{content:'Notes',annotations:[{url_citation:{url:'https://linear.app/developers',content:'Documentation'}}]}}],usage:{cost:.01,server_tool_use_details:{web_search_requests:1,tool_calls_executed:1}}});
const draftResult=(body:unknown)=>response({choices:[{message:{content:JSON.stringify(body)}}],usage:{cost:.01}});
const readFixture=async()=>({url:'https://linear.app/developers',content:'Official documentation fixture for source pipeline tests.'});
const request={query:'Linear',useCase:'Read issues',audience:'test',auth:'own'} as const;

test('one invalid draft is repaired against the same evidence, reviewed, and every cost is counted',async t=>{
 const body=generatedFixture();const invalid=structuredClone(body);invalid.steps[0].sourceIds=[15];let calls=0;
 t.mock.method(globalThis,'fetch',async()=>{
  calls++;
  if(calls===1)return sourceResult();
  if(calls===2)return draftResult({sourceIds:[1],gaps:[],identity:"confirmed",identityReason:"The official Linear documentation matches the requested product."});
  if(calls===5)return draftResult({issues:[]});
  return draftResult(calls===3?invalid:body);
 });
 const guide=await research(request,AbortSignal.timeout(1000),()=>{},readFixture);
 assert.equal(calls,5);assert.equal(guide.run.costUsd,.05);assert.equal(guide.run.toolCalls,1);assert.equal(guide.run.pageReads,1);assert.deepEqual(guide.steps[0].sourceIds,[1]);
});

test('failed documentation fetches cannot produce a documented guide from search snippets',async t=>{
 let calls=0;
 t.mock.method(globalThis,'fetch',async()=>{
  calls++;
  if(calls===1)return sourceResult();
  if(calls===2)return draftResult({sourceIds:[1],gaps:[],identity:"confirmed",identityReason:"The official Linear documentation matches the requested product."});
  return draftResult(generatedFixture());
 });
 await assert.rejects(research(request,AbortSignal.timeout(1000),()=>{},async()=>{throw new Error('Page unavailable');}),/could not pass our checks/);
 assert.equal(calls,5);
});

test('semantic review researches a missing detail, then repairs the draft',async t=>{
 const body=generatedFixture();let calls=0;let reviews=0;
 t.mock.method(globalThis,'fetch',async(_url:unknown,init?:RequestInit)=>{
  calls++;const sent=JSON.parse(init!.body as string);const schema=sent.response_format?.json_schema?.name;
  if(!schema)return sourceResult();
  if(schema==='documentation_selection')return draftResult({sourceIds:[1],gaps:[],identity:'confirmed',identityReason:'Exact product found.'});
  if(schema==='walkthrough_review')return draftResult({issues:++reviews===1?['The token exchange omits the required encoding and grant_type.']:[]});
  if(reviews)assert.match(init!.body as string,/grant_type/);
  return draftResult(body);
 });
 const guide=await research(request,AbortSignal.timeout(1000),()=>{},readFixture);
 assert.equal(calls,7);assert.equal(guide.appName,body.appName);assert.equal(guide.status,'documented');assert.equal(guide.run.searches,2);
});

test('repeated failed source reviews do not publish the flawed walkthrough',async t=>{
 let calls=0;
 t.mock.method(globalThis,'fetch',async(_url:unknown,init?:RequestInit)=>{
  calls++;const schema=JSON.parse(init!.body as string).response_format?.json_schema?.name;
  if(!schema)return sourceResult();
  if(schema==='documentation_selection')return draftResult({sourceIds:[1],gaps:[],identity:'confirmed',identityReason:'Exact product found.'});
  if(schema==='walkthrough_review')return draftResult({issues:['The claimed approval duration has no primary source.']});
  return draftResult(generatedFixture());
 });
 const guide=await research(request,AbortSignal.timeout(1000),()=>{},readFixture);
 assert.equal(guide.status,'not-confirmed');assert.equal(guide.steps[0].kind,'clarify');assert.match(guide.unknowns[0],/approval duration/);
 assert.equal(calls,9);
});

test('plausible but unevidenced destinations are rejected',()=>{
 const body=generatedFixture();
 validateDestinations(body,[{url:'https://linear.app/developers',content:'Docs'}]);
 body.steps[0].url='https://linear.app/settings/invented';
 assert.throws(()=>validateDestinations(body,[{url:'https://linear.app/developers',content:'Docs'}]),/absent/);
 validateDestinations(body,[{url:'https://linear.app/developers',content:'Open [settings](https://linear.app/settings/invented).'}]);
 body.steps[0].url='https://linear.app/settings/invented/extra';
 assert.throws(()=>validateDestinations(body,[{url:'https://linear.app/developers',content:'Open https://linear.app/settings/invented'}]),/absent/);
});

test('aborting while reading the provider body remains a cancellation',async t=>{
 const controller=new AbortController();
 t.mock.method(globalThis,'fetch',async()=>{
  const result=response({});
  result.json=async()=>{controller.abort();throw controller.signal.reason;};return result;
 });
 await assert.rejects(completion({},controller.signal,'guide'),(error:unknown)=>error instanceof DOMException && error.name==='AbortError');
});


test('ambiguous app identity asks for the official website without inventing setup steps',async t=>{
 let calls=0;let reads=0;
 t.mock.method(globalThis,'fetch',async()=>++calls===1?sourceResult():draftResult({sourceIds:[],gaps:[],identity:'ambiguous',identityReason:'Multiple products have this name.'}));
 const guide=await research({...request,query:'Flow'},AbortSignal.timeout(1000),()=>{},async()=>{reads++;return readFixture();});
 assert.equal(calls,2);assert.equal(reads,0);assert.equal(guide.status,'needs-clarification');assert.equal(guide.steps[0].kind,'clarify');assert.match(guide.summary,/official website/);
});


test('raw OAuth parameters must include the full request endpoint in visible instructions',()=>{
 const body=generatedFixture();body.steps[0].instructions=['Set response_type to code.','Use the registered redirect_uri.'];
 assert.throws(()=>validateProtocolInstructions(body),/full request URL/);
 body.steps[0].instructions.unshift('Open https://provider.org/oauth/authorize with these query parameters.');
 assert.doesNotThrow(()=>validateProtocolInstructions(body));
});

test('managed research reads current broker contracts even when search returns provider docs only',async t=>{
 const read:string[]=[];const body=generatedFixture();body.status='not-confirmed';
 t.mock.method(globalThis,'fetch',async(_url:unknown,init?:RequestInit)=>{
  const sent=JSON.parse(init!.body as string);const schema=sent.response_format?.json_schema?.name;
  if(!schema)return sourceResult();
  if(schema==='documentation_selection')return draftResult({sourceIds:[1],gaps:[],identity:'confirmed',identityReason:'Exact product found.'});
  if(schema==='walkthrough_review')return draftResult({issues:[]});
  if(schema==='oauth_setup_guide'){
   const evidence=JSON.parse(sent.messages[1].content).evidence;
   assert.ok(evidence.some((s:{url:string;retrieved:boolean})=>s.url.endsWith('/manually-authenticating') && s.retrieved));
   assert.ok(evidence.some((s:{url:string;retrieved:boolean})=>s.url.endsWith('/controlling-scopes') && s.retrieved));
  }
  return draftResult(body);
 });
 const guide=await research({...request,auth:'managed'},AbortSignal.timeout(1000),()=>{},async url=>{read.push(url);return {url,content:'Current primary documentation fixture.'};});
 assert.equal(read.length,5);assert.equal(guide.run.pageReads,5);
 assert.equal(guide.status,'not-confirmed','broker docs alone must not silently change provider support to documented');
});

test('managed walkthroughs cannot call an undefined SDK session or mix languages',()=>{
 const body=generatedFixture();
 body.steps[0].instructions=["Call session.authorize('todoist').","Read redirectUrl or redirect_url."];
 assert.throws(()=>validateProtocolInstructions(body),/undefined client or session/);
 body.steps[0].instructions.unshift("import { Composio } from '@composio/core'; const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY }); const session = await composio.create('test-user');");
 assert.throws(()=>validateProtocolInstructions(body),/mixes Python and TypeScript/);
 body.steps[0].instructions[2]='Read redirectUrl.';
 assert.doesNotThrow(()=>validateProtocolInstructions(body));
});


test('every provider request carries token-price ceilings while retaining strict-output requirements',async t=>{
 t.mock.method(globalThis,'fetch',async(_url:unknown,init?:RequestInit)=>{
  const body=JSON.parse(String(init?.body));
  assert.deepEqual(body.provider,{require_parameters:true,max_price:{prompt:0.25,completion:1.5}});
  assert.equal(body.reasoning.effort,'low');
  assert.equal('temperature' in body,false);
  return draftResult({ok:true});
 });
 await completion({model:'openai/gpt-5.4-nano',temperature:0,provider:{require_parameters:true}},AbortSignal.timeout(1000),'guide');
});

for(const [name,cost] of [['reported ceiling',0.21],['missing billing data',undefined]] as const){
 test(`research stops follow-up paid calls after ${name}`,async t=>{
  let calls=0;
  t.mock.method(globalThis,'fetch',async()=>{
   calls++;
   const result=await sourceResult().json();result.usage.cost=cost;
   return response(result);
  });
  await assert.rejects(research(request,AbortSignal.timeout(1000),()=>{},readFixture),(error:unknown)=>error instanceof ResearchError && error.diagnostic?.code==='research_cost_limit');
  assert.equal(calls,1);
 });
}


test('DeepSeek trials explicitly disable unbounded thinking',async t=>{
 t.mock.method(globalThis,'fetch',async(_url:unknown,init?:RequestInit)=>{
  const body=JSON.parse(String(init?.body));
  assert.deepEqual(body.reasoning,{enabled:false});
  assert.deepEqual(body.provider.max_price,{prompt:0.25,completion:1.5});
  return draftResult({ok:true});
 });
 await completion({model:'deepseek/deepseek-v4.1-flash'},AbortSignal.timeout(1000),'guide');
});


test('operation evidence uncertainty cannot be presented as a documented test',()=>{
 const body=generatedFixture();
 const step=body.steps.find(step=>step.kind==='test')!;
 step.evidence='documented';
 step.detail='The official endpoint reference was not retrieved; root-path semantics remain unconfirmed.';
 assert.throws(()=>validateProtocolInstructions(body),/test admits unconfirmed/);
 step.evidence='unknown';
 assert.throws(()=>validateProtocolInstructions(body),/unknown operation test/);
 body.status='not-confirmed';
 step.instructions=['Read the official endpoint reference before executing the operation.'];
 assert.doesNotThrow(()=>validateProtocolInstructions(body));
});
