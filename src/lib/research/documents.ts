import { resolve4 } from "node:dns/promises";
import { request } from "node:https";
import { load } from "cheerio";
import { safePublicUrl } from "./schema";

export function publicIPv4(address: string): boolean {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(address)) return false;
  const [a,b,c,...rest] = address.split(".").map(Number);
  if ([a,b,c,...rest].some(n => n > 255)) return false;
  return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 168 || (b === 0 && (c === 0 || c === 2)) || (b === 88 && c === 99))) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113));
}

export function extractDocument(html: string, url: string): string {
  const $ = load(html);
  // API reference sites put endpoint URLs/scopes in article headers and
  // parameter documentation inside forms. Keep their text; discard controls
  // and executable content. Prefer the article so navigation is not evidence.
  $("script,style,noscript,svg,nav,footer,[role=navigation],body > header,[role=banner],input,textarea,select,button").remove();
  $("a[href]").each((_,element) => {
    const a = $(element);
    try {
      const href = new URL(a.attr("href")!,url).href;
      if (safePublicUrl(href)) a.replaceWith(`${a.text()} (${href})`);
    } catch { /* Keep visible text from malformed links. */ }
  });
  $("br").replaceWith("\n");
  $("p,li,h1,h2,h3,h4,pre,tr,section").each((_,element) => { $(element).append("\n"); });
  const article = $("article").first();
  const main = $("main").first();
  const text = (article.text().trim().length>=200 ? article.text() : main.length ? main.text() : $("body").text()).replace(/[ \t]+/g," ").replace(/\n\s*\n/g,"\n\n").trim();
  return text.slice(0,120000);
}

// Documentation servers often return Markdown after content negotiation.
// Resolve its real links too, otherwise the follow-up reader misses relative
// OAuth, operation and distribution references that HTML extraction preserves.
export function resolveMarkdownLinks(text: string, base: string): string {
  return text.replace(/\]\(([^\s)]+)([^)]*)\)/g,(match,path:string,suffix:string)=>{
    try {
      const url=new URL(path,base);
      return safePublicUrl(url.href) ? `](${url.href}${suffix})` : match;
    } catch { return match; }
  });
}

// Long toolkit pages often put the requested operation after dozens of tools.
// Keep the introduction plus task-relevant sections instead of chopping the tail.
export function focusDocument(text: string, task: string, limit=30000): string {
  if(text.length<=limit)return text;
  const words=[...new Set(task.toLowerCase().match(/[a-z]{3,}/g) ?? [])]
    .filter(word=>!["the","for","from","with","user","users","current","integration","workspace","account","read","list","get"].includes(word));
  const chunks=[];
  for(let start=8000;start<text.length;start+=2200) {
    const value=text.slice(start,start+2600);
    const lower=value.toLowerCase();
    const score=words.reduce((total,word)=>total+(lower.includes(word)?3:0),0);
    chunks.push({start,value,score});
  }
  const selected=chunks.sort((a,b)=>b.score-a.score||a.start-b.start).slice(0,7).sort((a,b)=>a.start-b.start);
  return `${text.slice(0,8000)}\n\n[Task-relevant excerpts; intervening text omitted]\n\n${selected.map(s=>s.value).join("\n\n[Excerpt break]\n\n")}`.slice(0,limit);
}

type PageResponse = { status: number; location?: string; type: string; text: string };
// Resolve once and pin the TCP connection to a checked public IPv4 address.
// Re-check every redirect; never forward cookies, credentials or auth headers.
// IPv6-only hosts are deliberately unsupported in this bounded demo reader.
async function readPage(url: URL, signal: AbortSignal): Promise<PageResponse> {
  if (!safePublicUrl(url.href)) throw new Error("Only public HTTPS documentation is supported.");
  const addresses = await resolve4(url.hostname);
  signal.throwIfAborted();
  if (!addresses.length || addresses.some(address => !publicIPv4(address))) throw new Error("Documentation host did not resolve to public addresses.");
  return new Promise((resolve,reject) => {
    const req = request(url, {
      signal, agent:false, family:4,
      lookup: (_hostname,_options,callback) => callback(null,addresses[0],4),
      headers:{Accept:"text/html, text/plain, text/markdown", "User-Agent":"FieldguideDocumentationReader/1.0"},
    }, res => {
      const status = res.statusCode ?? 0;
      if (status >= 300 && status < 400) { res.resume();resolve({status,location:res.headers.location,type:"",text:""});return; }
      const type = res.headers["content-type"] ?? "";
      if (status !== 200 || !/text\/(?:html|plain|markdown)|application\/(?:xhtml\+xml|json)/i.test(type)) {
        res.resume();reject(new Error(`Documentation unavailable (HTTP ${status} or unsupported format).`));return;
      }
      const chunks:Buffer[]=[];let size=0;
      res.on("data",(chunk:Buffer) => {
        size+=chunk.length;
        if(size>1_500_000){req.destroy(new Error("Documentation page exceeds the reader limit."));return;}
        chunks.push(chunk);
      });
      res.on("error",reject);
      res.on("end",()=>resolve({status,type,text:Buffer.concat(chunks).toString("utf8")}));
    });
    req.setTimeout(8000,()=>req.destroy(new Error("Documentation page timed out.")));
    req.on("error",reject);req.end();
  });
}

export async function retrieveDocument(value: string, parentSignal: AbortSignal): Promise<{url:string;content:string}> {
  const signal = AbortSignal.any([parentSignal,AbortSignal.timeout(12000)]);
  let url = new URL(value);
  for(let redirects=0;redirects<=3;redirects++) {
    signal.throwIfAborted();
    const page = await readPage(url,signal);
    if(page.status>=300&&page.status<400) {
      if(!page.location)throw new Error("Documentation redirect has no destination.");
      url=new URL(page.location,url);continue;
    }
    const content = /html/i.test(page.type) ? extractDocument(page.text,url.href) : resolveMarkdownLinks(page.text.slice(0,120000),url.href);
    if(content.length<200)throw new Error("The page did not expose readable documentation.");
    return {url:url.href,content};
  }
  throw new Error("Documentation redirected too many times.");
}
