import test from "node:test";
import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { createHmac } from "node:crypto";
import { researchInput, safePublicUrl, validateEvidence, validateManagedEvidence, type GuideBody, type SavedGuide } from "../src/lib/research/schema";
import { signGuide, verifyGuide } from "../src/lib/research/share";
import { readLimitedText, RequestTooLarge } from "../src/lib/research/request";

const body: GuideBody = {
 appName:"Example provider",officialWebsite:"https://linear.app",status:"documented",summary:"Fixture for integrity checks.",
 effort:{handsOn:"Not estimated",waiting:"Not confirmed",basis:"Fixture",sourceIds:[1]},prerequisites:[],permissions:[],blockers:[],unknowns:["Approval not checked"],agentBrief:"Prepare a test. Ask before changing accounts.",
 steps:["test","launch"].map(kind=>({kind:kind as "test"|"launch",title:kind,action:"Check",detail:"Fixture",actor:"you",evidence:"documented",destination:"Docs",url:"https://linear.app/developers",successCheck:"Observe result",recovery:"Read error",sourceIds:[1]})),
};
const fixture: SavedGuide={...body,version:1,request:{query:"Linear",useCase:"Read issues",audience:"test",auth:"own"},generatedAt:"2026-10-20T00:00:00.000Z",sources:[{id:1,title:"Linear",url:"https://linear.app/developers",evidence:"search-excerpt"}],run:{model:"test",searches:1,toolCalls:2,costUsd:null,durationMs:1}};
process.env.GUIDE_SIGNING_SECRET="test-only-signing-key-not-a-real-secret-12345";
test("reject unsafe destinations and accept official https docs",()=>{
 for(const url of ["javascript:alert(1)","http://example.org","https://127.0.0.1","https://2130706433","https://[::1]","https://user:pass@linear.app","https://docs.local","https://example.com"])assert.equal(safePublicUrl(url),false,url);
 assert.equal(safePublicUrl("https://linear.app/developers/oauth-2-0-authentication"),true);
});
test("input bounds reject empty, excessive and unknown request properties",()=>{
 assert.equal(researchInput.safeParse({...fixture.request,query:" "}).success,false);
 assert.equal(researchInput.safeParse({...fixture.request,useCase:"a".repeat(301)}).success,false);
 assert.equal(researchInput.safeParse({...fixture.request,apiKey:"untrusted"}).success,false);
});
test("citations and completion requirements fail closed",()=>{
 assert.throws(()=>validateEvidence(structuredClone(body),[2]));
 assert.throws(()=>validateEvidence({...structuredClone(body),steps:body.steps.slice(0,1)},[1]));
 assert.throws(()=>validateEvidence({...structuredClone(body),permissions:[{name:"admin",reason:"test",sourceIds:[]}]},[1]));
 assert.equal(validateEvidence(structuredClone(body),[1]).steps.length,2);
});
test("API endpoints do not become misleading navigation buttons",()=>{
 const copy=structuredClone(body);copy.steps[0].url="https://api.linear.app/oauth/token";
 assert.equal(validateEvidence(copy,[1]).steps[0].url,"");
});
test("signed snapshot round-trips without personal checklist state",()=>{
 const decoded=verifyGuide(signGuide(fixture));assert.deepEqual(decoded,fixture);assert.equal("done" in decoded,false);
});
test("tampering, wrong signing key and excessive payloads are rejected",()=>{
 const token=signGuide(fixture);const [payload,sig]=token.split(".");
 assert.throws(()=>verifyGuide(`${payload.slice(0,-1)}X.${sig}`));
 assert.throws(()=>verifyGuide("x".repeat(25000)));
 const original=process.env.GUIDE_SIGNING_SECRET;process.env.GUIDE_SIGNING_SECRET="another-key-with-more-than-thirty-two-characters";
 assert.throws(()=>verifyGuide(token));process.env.GUIDE_SIGNING_SECRET=original;
});
test("compressed payload cannot expand beyond the bounded snapshot limit",()=>{
 const payload=gzipSync(' '.repeat(100000)).toString("base64url");
 const sig=createHmac("sha256",process.env.GUIDE_SIGNING_SECRET!).update(payload).digest("base64url");
 assert.throws(()=>verifyGuide(`${payload}.${sig}`));
});
test("request limit counts bytes and rejects bodies without a declared length",async()=>{
 assert.equal(await readLimitedText(new Request("https://app.test",{method:"POST",body:"hello"}),5),"hello");
 await assert.rejects(readLimitedText(new Request("https://app.test",{method:"POST",body:"💡💡"}),7),RequestTooLarge);
 await assert.rejects(readLimitedText(new Request("https://app.test",{method:"POST",body:"x",headers:{"content-length":"99999"}}),10),RequestTooLarge);
});

test('provider-specific OAuth endpoints are removed while Slack app settings remain usable',()=>{
 for(const url of ['https://app.asana.com/-/oauth_authorize','https://app.asana.com/-/oauth_token','https://accounts.google.com/o/oauth2/v2/auth/authorize','https://discord.com/api/oauth2/token','https://slack.com/api/oauth.v2.access','https://api.linear.app/graphql']){
  const copy=structuredClone(body);copy.steps[0].url=url;
  assert.equal(validateEvidence(copy,[1]).steps[0].url,'',url);
 }
 const copy=structuredClone(body);copy.steps[0].url='https://api.slack.com/apps/';
 assert.equal(validateEvidence(copy,[1]).steps[0].url,'https://api.slack.com/apps/');
 copy.steps[0].url='https://developers.notion.com/guides/get-started/authorization';
 assert.equal(validateEvidence(copy,[1]).steps[0].url,'https://developers.notion.com/guides/get-started/authorization');
});


test("managed auth cannot be claimed from only the provider's own OAuth docs",()=>{
 const managed={...fixture.request,auth:"managed" as const};
 assert.throws(()=>validateManagedEvidence(structuredClone(body),managed,fixture.sources));
 const guide=structuredClone(body);
 guide.steps.unshift({...guide.steps[0],kind:"connect",title:"Connect with Composio",sourceIds:[2]});
 assert.doesNotThrow(()=>validateManagedEvidence(guide,managed,[...fixture.sources,{id:2,url:"https://docs.composio.dev/toolkits/slack"}]));
 assert.throws(()=>validateManagedEvidence(guide,managed,[...fixture.sources,{id:2,url:"https://composio.dev.evil.org/toolkits/slack"}]));
});
