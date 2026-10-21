import test from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../src/app/api/research/route';
import { ResearchError } from '../src/lib/research/openrouter';

process.env.OPENROUTER_API_KEY='test-only-provider-key';
process.env.GUIDE_SIGNING_SECRET='test-only-signing-key-not-a-real-secret-12345';
const input={query:'Asana',useCase:'Read tasks',audience:'public',auth:'own'};
let ip=0;
const request=(body:unknown=input,extra:RequestInit={})=>new Request('https://fieldguide.test/api/research',{method:'POST',body:JSON.stringify(body),headers:{'Content-Type':'application/json','x-forwarded-for':`test-${ip++}`},...extra});

test('invalid requests never reach the paid provider',async t=>{
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;throw new Error('must not call');});
 assert.equal((await POST(request({}))).status,400);
 assert.equal((await POST(request(input,{headers:{origin:'https://foreign.test'}}))).status,403);
 assert.equal((await POST(request('x'.repeat(2100)))).status,413);
 assert.equal(calls,0);
});

test('provider failure is delivered as an NDJSON error, with no saved guide or raw details',async t=>{
 t.mock.method(console,'error',()=>{});
 t.mock.method(globalThis,'fetch',async()=>Response.json({error:{message:'PRIVATE'}},{status:402}));
 const response=await POST(request());
 assert.equal(response.status,200);assert.match(response.headers.get('content-type')||'',/ndjson/);
 const events=(await response.text()).trim().split('\n').map(line=>JSON.parse(line));
 assert.equal(events[0].type,'progress');assert.equal(events.at(-1).type,'error');
 assert.match(events.at(-1).message,/credits/);
 assert.equal(events.some(event=>event.type==='complete'||event.token),false);
 assert.doesNotMatch(JSON.stringify(events),/PRIVATE/);
});

test('the server deadline aborts upstream work and returns a timeout message',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});t.mock.method(console,'error',()=>{});
 let upstreamSignal:AbortSignal|undefined;
 t.mock.method(globalThis,'fetch',async(_url:unknown,init?:RequestInit)=>{
  upstreamSignal=init?.signal ?? undefined;
  return new Promise<Response>((_resolve,reject)=>upstreamSignal?.addEventListener('abort',()=>reject(upstreamSignal?.reason),{once:true}));
 });
 const response=await POST(request());const result=response.text();
 t.mock.timers.tick(240001);
 const text=await result;
 assert.equal(upstreamSignal?.aborted,true);assert.match(text,/Research took too long/);assert.doesNotMatch(text,/"type":"complete"/);
});

test('stopping the response stream aborts the provider request',async t=>{
 t.mock.method(console,'error',()=>{});
 let upstreamSignal:AbortSignal|undefined;
 t.mock.method(globalThis,'fetch',async(_url:unknown,init?:RequestInit)=>{
  upstreamSignal=init?.signal ?? undefined;
  return new Promise<Response>((_resolve,reject)=>upstreamSignal?.addEventListener('abort',()=>reject(upstreamSignal?.reason),{once:true}));
 });
 const response=await POST(request());
 await response.body!.cancel();
 assert.equal(upstreamSignal?.aborted,true);
});

test('an already cancelled request never starts paid research',async t=>{
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;throw new Error('must not call');});
 const controller=new AbortController();controller.abort();
 const response=await POST(request(input,{signal:controller.signal}));
 assert.equal(response.status,499);assert.equal(calls,0);
});


test('detailed validation diagnostics stay out of API responses and server logs',async t=>{
 const logged:unknown[]=[];
 t.mock.method(console,'error',(...args:unknown[])=>{logged.push(args);});
 t.mock.method(globalThis,'fetch',async()=>{throw new ResearchError('No guide was published.',502,{code:'guide_validation_failed',stage:'guide',checks:['PRIVATE_INPUT_IN_DIAGNOSTIC']});});
 const response=await POST(request());
 assert.doesNotMatch(await response.text(),/PRIVATE_INPUT/);
 assert.doesNotMatch(JSON.stringify(logged),/PRIVATE_INPUT/);
 assert.match(JSON.stringify(logged),/guide_validation_failed/);
});
