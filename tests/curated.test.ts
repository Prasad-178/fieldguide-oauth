import test from 'node:test';
import assert from 'node:assert/strict';
import {getSteps,scope,overview,type Context} from '../src/lib/guide';
const context:Context={provider:'gmail',intent:'send',audience:'test',managed:false};
test('Gmail routes keep provider callbacks and managed consent separate',()=>{
 const own=getSteps(context);const managed=getSteps({...context,managed:true});
 assert.ok(own.some(s=>s.instructions.some(i=>i.includes('https://oauth2.googleapis.com/token'))));
 assert.equal(managed.some(s=>s.instructions.some(i=>i.includes('client_secret')||i.includes('grant_type='))),false);
 assert.ok(managed.some(s=>s.instructions.some(i=>i.includes('This app is blocked'))));
 assert.match(overview({...context,managed:true}).evidence,/blocked/);
});
test('send-only Gmail sample never requires a mailbox-read test or permission',()=>{
 const steps=getSteps(context);const testStep=steps.find(s=>s.short==='Test operation')!;
 assert.equal(scope(context),'gmail.send');
 assert.ok(testStep.instructions.some(i=>i.includes('/messages/send')));
 assert.equal(testStep.instructions.some(i=>i.includes('format=full')),false);
 assert.match(testStep.instructions.join(' '),/approved test recipient/);
 const read=getSteps({...context,intent:'read'}).find(s=>s.short==='Test operation')!;
 assert.ok(read.instructions.some(i=>i.includes('format=full')),'reading content requires retrieval after the ID list');
});
test('public Slack needs an OAuth callback; local installation does not pretend to be distribution',()=>{
 assert.ok(getSteps({...context,provider:'slack',audience:'public'}).some(s=>s.short==='OAuth callback'));
 assert.equal(getSteps({...context,provider:'slack'}).some(s=>s.short==='OAuth callback'),false);
});
test('Notion sample uses OAuth and selected page access rather than an internal static token',()=>{
 const steps=getSteps({...context,provider:'notion'});
 assert.ok(steps.some(s=>s.instructions.some(i=>i.includes('grant_type=authorization_code'))));
 assert.ok(steps.some(s=>s.instructions.some(i=>i.includes('page picker'))));
 assert.ok(steps.some(s=>s.instructions.some(i=>i.includes('https://api.notion.com/v1/search'))));
 assert.match(steps[0].detail,/cannot be changed/);
});
