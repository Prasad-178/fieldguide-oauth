import test from 'node:test';
import assert from 'node:assert/strict';
import {request} from 'node:http';
import type {AddressInfo} from 'node:net';
import type {OAuth2Client} from 'google-auth-library';
import {createWalkthrough,ORIGIN} from '../scripts/gmail-walkthrough.mjs';

test('local walkthrough rejects foreign origins and callback replay; reads only after explicit action',async t=>{
 let exchanges=0;let reads=0;let state='';
 const fake={
  generateCodeVerifierAsync:async()=>({codeVerifier:'test-verifier',codeChallenge:'test-challenge'}),
  generateAuthUrl:(options:{state:string;access_type:string})=>{state=options.state;assert.equal(options.access_type,'online');return 'https://accounts.google.com/test-consent';},
  getToken:async(options:{codeVerifier:string})=>{assert.equal(options.codeVerifier,'test-verifier');exchanges++;return {tokens:{access_token:'PRIVATE_TOKEN',scope:'https://www.googleapis.com/auth/gmail.readonly'}};},
  setCredentials:()=>{},
  request:async(options:{url:string;params:Record<string,unknown>})=>{
   reads++;
   if(reads===1){assert.equal(options.params.maxResults,1);assert.equal(options.params.q,'subject:fieldguide-test');return {data:{messages:[{id:'known-id'}]}};}
   assert.match(options.url,/messages\/known-id$/);return {data:{payload:{headers:[{name:'Subject',value:'fieldguide-test'}],body:{data:'PRIVATE_BODY'}}}};
  },
 } as unknown as OAuth2Client;
 const server=createWalkthrough(()=>fake);await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>server.close());const port=(server.address() as AddressInfo).port;
 const call=(path:string,method='GET',headers:Record<string,string>={})=>new Promise<{status:number;text:string;headers:import('node:http').IncomingHttpHeaders}>((resolve,reject)=>{
  const req=request({hostname:'127.0.0.1',port,path,method,headers:{Host:'localhost:8765',...headers}},res=>{let text='';res.on('data',d=>text+=d);res.on('end',()=>resolve({status:res.statusCode!,text,headers:res.headers}));});req.on('error',reject);req.end();
 });
 assert.equal((await call('/','GET',{Host:'evil.example'})).status,403);
 const home=await call('/');const cookie=home.headers['set-cookie']![0].split(';')[0];
 assert.equal((await call('/connect','POST',{cookie,Origin:'https://evil.example'})).status,403);
 assert.equal((await call('/connect','POST',{cookie,Origin:ORIGIN})).status,303);
 assert.equal((await call('/oauth/callback?code=test&state=wrong','GET',{cookie})).status,400);
 assert.equal(exchanges,0);
 assert.equal((await call(`/oauth/callback?code=test&state=${state}`,'GET',{cookie})).status,303);
 assert.equal(exchanges,1);assert.equal(reads,0,'callback never reads the mailbox');
 assert.equal((await call(`/oauth/callback?code=test&state=${state}`,'GET',{cookie})).status,400);
 assert.equal(exchanges,1,'authorization code cannot be replayed');
 const result=await call('/read','POST',{cookie,Origin:ORIGIN});
 assert.equal(result.status,200);assert.equal(reads,2);assert.match(result.text,/Subject matched/);
 assert.doesNotMatch(result.text,/PRIVATE_TOKEN|PRIVATE_BODY|known-id/);
});
