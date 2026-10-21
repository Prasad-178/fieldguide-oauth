import test from 'node:test';
import assert from 'node:assert/strict';
import { extractDocument, focusDocument, publicIPv4, retrieveDocument } from '../src/lib/research/documents';

test('documentation reader excludes private, metadata, reserved and non-IPv4 addresses',()=>{
 for(const address of ['0.1.2.3','10.0.0.1','100.64.0.1','100.127.255.254','127.0.0.1','169.254.169.254','172.16.0.1','172.31.255.254','192.168.1.1','192.0.0.8','192.0.2.1','192.88.99.1','198.18.0.1','198.19.255.254','198.51.100.1','203.0.113.1','224.0.0.1','255.255.255.255','999.1.1.1','::1','::ffff:127.0.0.1','127.1'])assert.equal(publicIPv4(address),false,address);
 for(const address of ['1.1.1.1','8.8.8.8','104.18.32.7'])assert.equal(publicIPv4(address),true,address);
});

test('page extraction keeps ordered instructions and resolves documentation links without running scripts',()=>{
 const result=extractDocument('<html><nav>Navigation noise</nav><main><h1>Create app</h1><p>Open <a href="/console">the console</a>.</p><ol><li>Name your app.</li><li>Save.</li></ol><pre>grant_type=authorization_code</pre><script>stealTokens()</script></main></html>','https://docs.provider.org/setup');
 assert.match(result,/Create app/);assert.match(result,/https:\/\/docs.provider.org\/console/);assert.match(result,/Name your app\.\nSave\./);assert.match(result,/grant_type=authorization_code/);assert.doesNotMatch(result,/stealTokens|Navigation noise/);
});

test('unsafe input URLs are rejected before any page request',async()=>{
 for(const url of ['https://127.0.0.1','https://2130706433','http://docs.provider.org','https://user:pass@docs.provider.org','https://docs.provider.org:8443','https://metadata.internal'])await assert.rejects(retrieveDocument(url,AbortSignal.timeout(500)),/public HTTPS/);
});


test('long documentation retains a requested operation beyond the first page excerpt',()=>{
 const text='Introduction. '.repeat(1000)+'Unrelated settings. '.repeat(3000)+'\nTODOIST_GET_ACTIVE_TASKS: list active tasks with required user_id.\n'+'Other settings. '.repeat(2000);
 const focused=focusDocument(text,'Read active tasks');
 assert.ok(focused.length<=30000);assert.match(focused,/TODOIST_GET_ACTIVE_TASKS/);assert.match(focused,/intervening text omitted/);
});
