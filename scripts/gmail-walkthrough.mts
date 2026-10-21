/** Local-only walkthrough tool. Never imported by the deployed Next app. */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { OAuth2Client, CodeChallengeMethod } from 'google-auth-library';

export const ORIGIN='http://localhost:8765';
export const CALLBACK=`${ORIGIN}/oauth/callback`;
const SCOPE='https://www.googleapis.com/auth/gmail.readonly';
const nonce=()=>randomBytes(32).toString('hex');
const same=(a:string,b:string)=>a.length===b.length && timingSafeEqual(Buffer.from(a),Buffer.from(b));
type Client=Pick<OAuth2Client,'generateCodeVerifierAsync'|'generateAuthUrl'|'getToken'|'setCredentials'|'request'>;
type Session={created:number;state?:string;verifier?:string;client?:Client;connected?:boolean};
const escape=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
function page(res:ServerResponse, title:string, body:string, status=200) {
 res.writeHead(status,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'same-origin','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self' https://accounts.google.com; frame-ancestors 'none'; base-uri 'none'"});
 res.end(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escape(title)}</title><style>body{font:17px/1.6 system-ui;max-width:680px;margin:64px auto;padding:0 24px;color:#202020}button{cursor:pointer;background:#171717;color:white;border:0;border-radius:8px;padding:12px 20px;font:inherit}code{overflow-wrap:anywhere}small{color:#666}</style><h1>${escape(title)}</h1>${body}`);
}
function sessionId(req:IncomingMessage) {return /(?:^|;\s*)fg_walkthrough=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie ?? '')?.[1];}
function defaultClient():Client {
 const path=process.env.GMAIL_WALKTHROUGH_CLIENT_FILE || resolve(homedir(),'.config/fieldguide/gmail-client.json');
 const data=JSON.parse(readFileSync(path,'utf8')).web;
 if(!data?.client_id || !data?.client_secret || !data.redirect_uris?.includes(CALLBACK))throw new Error('Invalid local client configuration');
 return new OAuth2Client({clientId:data.client_id,clientSecret:data.client_secret,redirectUri:CALLBACK});
}
export function createWalkthrough(makeClient:()=>Client=defaultClient) {
 const sessions=new Map<string,Session>();
 return createServer(async(req,res)=>{
  // Fixed Host and loopback bind prevent exposing the callback via DNS rebinding.
  if(req.headers.host!=='localhost:8765'){res.writeHead(403);res.end('Use the local walkthrough address.');return;}
  res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','same-origin');
  for(const [id,s] of sessions)if(Date.now()-s.created>15*60_000)sessions.delete(id);
  let id=sessionId(req);let s=id?sessions.get(id):undefined;
  const url=new URL(req.url ?? '/',ORIGIN);
  const redirect=(target:string)=>{res.writeHead(303,{Location:target});res.end();};
  try {
   if(req.method==='GET' && url.pathname==='/') {
    if(!s){if(sessions.size>=20)sessions.clear();id=nonce();s={created:Date.now()};sessions.set(id,s);const expiryId=id;setTimeout(()=>sessions.delete(expiryId),15*60_000).unref();res.setHeader('Set-Cookie',`fg_walkthrough=${id}; HttpOnly; SameSite=Lax; Path=/; Max-Age=900`);}
    page(res,'Gmail walkthrough',`<p>This local tool checks your own OAuth app. It is separate from the deployed Fieldguide site.</p><p>Callback: <code>${CALLBACK}</code></p>${s.connected?'<p>Consent and token exchange completed. No mailbox read has run yet.</p><p>The next action reads at most one message with subject <code>fieldguide-test</code>. It reports only whether the subject and body are present; it never sends mail.</p><form method="post" action="/read"><button>Read the prepared test message</button></form>':'<p>Save the Google web-client JSON privately at <code>~/.config/fieldguide/gmail-client.json</code>, or set GMAIL_WALKTHROUGH_CLIENT_FILE to its path. Do not paste it into chat.</p><p>Connecting requests read-only Gmail access. Review and approve that permission on Google yourself.</p><form method="post" action="/connect"><button>Open Google consent</button></form>'}<p><small>Tokens stay in this process memory for up to 15 minutes. No refresh token is requested. Stopping the process clears local tokens; it does not revoke the Google grant.</small></p>`);return;
   }
   if(req.method==='GET' && url.pathname==='/oauth/callback') {
    const state=url.searchParams.get('state') ?? '';
    if(!s?.state || !same(state,s.state)){page(res,'Callback rejected','<p>The session or state did not match. Restart from the local walkthrough.</p>',400);return;}
    delete s.state;
    if(url.searchParams.has('error')){delete s.verifier;page(res,'Consent not completed','<p>No token exchange or mailbox read was attempted. Restart only when ready.</p>',400);return;}
    const code=url.searchParams.get('code');
    if(!code || !s.client || !s.verifier){page(res,'Callback incomplete','<p>Restart the local walkthrough.</p>',400);return;}
    const verifier=s.verifier;delete s.verifier;
    const {tokens}=await s.client.getToken({code,codeVerifier:verifier,redirect_uri:CALLBACK});
    if(!tokens.access_token || !tokens.scope?.split(' ').includes(SCOPE)){page(res,'Permission not granted','<p>The read-only Gmail permission was not returned. No mailbox read was attempted.</p>',400);return;}
    s.client.setCredentials(tokens);s.connected=true;redirect('/');return;
   }
   if(req.method!=='POST' || !s || req.headers.origin!==ORIGIN){page(res,'Request rejected','<p>Start from the local walkthrough page.</p>',403);return;}
   if(url.pathname==='/connect') {
    s.client=makeClient();s.connected=false;s.state=nonce();
    const pkce=await s.client.generateCodeVerifierAsync();s.verifier=pkce.codeVerifier;
    redirect(s.client.generateAuthUrl({scope:[SCOPE],access_type:'online',state:s.state,code_challenge:pkce.codeChallenge,code_challenge_method:CodeChallengeMethod.S256}));return;
   }
   if(url.pathname==='/read' && s.connected && s.client) {
    const list=await s.client.request<{messages?:{id:string}[]}>({url:'https://gmail.googleapis.com/gmail/v1/users/me/messages',params:{maxResults:1,q:'subject:fieldguide-test'},timeout:15_000});
    const message=list.data.messages?.[0];
    if(!message){page(res,'No test message found','<p>Put a known message with subject fieldguide-test in this account, then return to the walkthrough. An empty result is not a completed read test.</p>');return;}
    const read=await s.client.request<{payload?:{headers?:{name:string;value:string}[];body?:{data?:string};parts?:unknown[]}}>({url:`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(message.id)}`,params:{format:'full'},timeout:15_000});
    const p=read.data.payload;const subject=p?.headers?.find(h=>h.name.toLowerCase()==='subject')?.value;
    const matches=!!subject?.includes('fieldguide-test');const content=!!(p?.body?.data || p?.parts?.length);
    page(res,'Read test result',`<p>Subject matched: <strong>${matches?'yes':'no'}</strong><br>Message content returned: <strong>${content?'yes':'no'}</strong></p><p>Message text, addresses, IDs and tokens are not displayed or logged. No email was sent.</p>`);return;
   }
   page(res,'Not found','<p>Open the local walkthrough home page.</p>',404);
  } catch {
   // Google errors can include request headers, tokens or client secrets.
   page(res,'Walkthrough could not continue','<p>Check the private client JSON and registered callback. For a consent or API failure, inspect Google configuration and granted permissions. No raw provider details are logged.</p>',502);
  }
 });
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
 createWalkthrough().listen(8765,'127.0.0.1',()=>console.log(`Local Gmail walkthrough: ${ORIGIN} (no account connected)`));
}
