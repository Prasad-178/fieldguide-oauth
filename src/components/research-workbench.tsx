"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Check, CircleAlert, Clock3, Copy, Download, Globe2, Link2, LoaderCircle, RotateCcw, Search, ShieldCheck, Sparkles, Waypoints, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { savedGuide, type SavedGuide, type ResearchInput } from "@/lib/research/schema";
import { GuideSkeleton } from "@/components/page-skeleton";
import { cn } from "@/lib/utils";

function Sources({ids,guide}:{ids:number[];guide:SavedGuide}){return <span className="source-refs">{ids.map(id=>{const s=guide?.sources.find(s=>s.id===id);return s ? <a key={id} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={`Source ${id}: ${s.title}`}>[{id}]</a>:null;})}</span>;}

type Phase = "form" | "research" | "evidence" | "review" | "result" | "loading";
export default function ResearchWorkbench({ query = "", useCase = "", audience = "test", auth = "own", shared = false }: { query?: string; useCase?: string; audience?: ResearchInput["audience"]; auth?: ResearchInput["auth"]; shared?: boolean }) {
  const [input,setInput] = useState<ResearchInput>({query,useCase,audience,auth});
  const [phase,setPhase] = useState<Phase>(shared ? "loading" : "form");
  const [guide,setGuide] = useState<SavedGuide|null>(null);
  const [token,setToken] = useState("");
  const [error,setError] = useState("");
  const [detail,setDetail] = useState("");
  const [step,setStep] = useState(0);
  const [done,setDone] = useState<number[]>([]);
  const [panel,setPanel] = useState<"sources"|"launch"|"agent"|"overview"|null>(null);
  const [shareOpen,setShareOpen] = useState(false);
  const [shareUrl,setShareUrl] = useState("");
  const [copyStatus,setCopyStatus] = useState("");
  const [elapsed,setElapsed] = useState(0);
  const [hasStarted,setHasStarted] = useState(false);
  const abortRef = useRef<AbortController|null>(null);
  const opener = useRef<HTMLElement|null>(null);
  const resultHeading = useRef<HTMLHeadingElement|null>(null);
  const queryRef = useRef<HTMLInputElement|null>(null);
  const useCaseRef = useRef<HTMLInputElement|null>(null);
  const reduce = useReducedMotion();
  const busy = phase === "research" || phase === "evidence" || phase === "review";

  useEffect(() => {
    if (!shared) return;
    let controller: AbortController | null = null;
    async function load() {
      controller?.abort();
      const pending = new AbortController();controller=pending;
      const value = new URLSearchParams(window.location.hash.slice(1)).get("guide");
      setGuide(null);setToken("");setDone([]);setStep(0);setError("");setPhase("loading");
      if (!value) { setError("The guide link is missing its saved content. Ask the sender to copy the full link."); setPhase("form"); return; }
      try {
        const res = await fetch("/api/guides/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:value}),signal:pending.signal});
        const data = await res.json();
        if(!res.ok) throw new Error(data.error);
        const checked = savedGuide.parse(data.guide);
        if(!pending.signal.aborted){setGuide(checked);setInput(checked.request);setToken(value);setPhase("result");}
      } catch(e) { if(!pending.signal.aborted){setError(e instanceof Error ? e.message : "This guide could not be opened.");setPhase("form");} }
    }
    const reload = () => { void load(); };
    reload();window.addEventListener("hashchange",reload);
    return ()=>{controller?.abort();window.removeEventListener("hashchange",reload);};
  },[shared]);
  useEffect(() => {
    if(!busy)return;
    const start=Date.now();
    const timer=setInterval(()=>setElapsed(Math.floor((Date.now()-start)/1000)),1000);
    return ()=>clearInterval(timer);
  },[busy]);
  useEffect(()=>()=>abortRef.current?.abort(),[]);
  useEffect(()=>{ if(phase === "result") resultHeading.current?.focus({preventScroll:true}); },[phase]);

  async function startResearch(e?: React.FormEvent) {
    e?.preventDefault();
    if(!input.query.trim()){setError("Add the app’s name or official website.");queryRef.current?.focus();return;}
    if(input.useCase.trim().length<3){setError("Describe one thing your integration should do.");useCaseRef.current?.focus();return;}
    setError("");setGuide(null);setDone([]);setStep(0);setElapsed(0);setHasStarted(true);setPhase("research");setDetail("Finding official documentation and checking requirements");
    const controller = new AbortController();abortRef.current=controller;
    let completed=false;
    try {
      const res = await fetch("/api/research",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input),signal:controller.signal});
      if(!res.ok){const data=await res.json();throw new Error(data.error || "Research could not start.");}
      if(!res.body)throw new Error("The research connection closed. Try again.");
      const reader=res.body.getReader();const decoder=new TextDecoder();let buffer="";
      function receive(line:string){
        if(!line.trim())return;
        const event=JSON.parse(line);
        if(event.type === "progress"){setPhase(event.stage === "review" ? "review" : event.stage === "evidence" ? "evidence" : "research");setDetail(event.detail);}
        if(event.type === "error")throw new Error(event.message);
        if(event.type === "complete"){
          const checked=savedGuide.parse(event.guide);setGuide(checked);setToken(event.token);setPhase("result");completed=true;
        }
      }
      while(true){const {value,done}=await reader.read();buffer+=decoder.decode(value,{stream:!done});const lines=buffer.split("\n");buffer=lines.pop()||"";for(const line of lines)receive(line);if(done)break;}
      if(buffer.trim())receive(buffer);
      if(!completed)throw new Error("Research ended before a guide was ready. Your input is preserved.");
    } catch(e){if(!controller.signal.aborted){setError(e instanceof TypeError ? "Connection lost. Check your internet connection and try again; your input is saved." : e instanceof SyntaxError ? "The research service returned an unreadable response. Your input is saved; try again." : e instanceof Error ? e.message : "Research could not finish. Try again.");setPhase("form");}}
    finally{if(abortRef.current===controller)abortRef.current=null;}
  }
  function cancel(){abortRef.current?.abort();setPhase("form");setError("Research stopped. You can edit your task and try again.");}
  function openPanel(value:typeof panel){opener.current=document.activeElement as HTMLElement;setCopyStatus("");setPanel(value);}
  async function copy(text:string){try{await navigator.clipboard.writeText(text);setCopyStatus("Copied");}catch{setCopyStatus("Copy was blocked by your browser. Select the text to copy it.");}}
  function shareGuide(){opener.current=document.activeElement as HTMLElement;setCopyStatus("");setShareUrl(`${window.location.origin}/shared#guide=${token}`);setShareOpen(true);}
  function download(){if(!guide)return;const blob=new Blob([JSON.stringify(guide,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`${guide.appName.toLowerCase().replace(/[^a-z0-9]+/g,"-")}-oauth-guide.json`;a.click();URL.revokeObjectURL(url);}
  const current=guide?.steps[step];


  return <div className="app-shell">
    <header className="site-header"><Button asChild variant="ghost" className="brand"><Link href="/"><Waypoints className="size-5"/>fieldguide<span className="brand-dot">.</span></Link></Button><Badge variant="outline" className="gap-2 font-normal"><span className="size-1.5 rounded-full bg-emerald-600"/>{shared ? "Shared guide" : "Live research"}</Badge></header>
    <main className={phase === "result" || phase === "loading" ? "guide-main" : undefined}>
      {phase === "loading" && <GuideSkeleton />}
      {phase === "form" && <section className="research-form-page">
        <Button asChild variant="ghost" className="-ml-3 mb-7"><Link href="/"><ArrowLeft/>All apps</Link></Button>
        <div className="mb-5 flex size-12 items-center justify-center rounded-xl border bg-muted"><Search className="size-5"/></div>
        <h1>{hasStarted ? "Let’s try that again." : "A guide for your use case."}</h1>
        <p className="lede">We’ll check current docs, permissions and approval requirements.</p>
        <form onSubmit={startResearch} className="mt-8 space-y-5">
          <div className="space-y-2"><Label htmlFor="research-app">App name or website</Label><Input ref={queryRef} id="research-app" value={input.query} maxLength={160} placeholder="e.g. Linear or linear.app" onChange={e=>{setInput({...input,query:e.target.value});setError("");}} required/></div>
          <div className="space-y-2"><Label htmlFor="research-task">What should your integration do?</Label><Input ref={useCaseRef} id="research-task" value={input.useCase} maxLength={300} placeholder="e.g. Read issues from a user’s workspace" onChange={e=>{setInput({...input,useCase:e.target.value});setError("");}} required/><p className="text-xs text-muted-foreground">One concrete task helps us find the right permissions.</p></div>
          <fieldset><legend className="mb-3 text-sm font-medium">Who will connect?</legend><RadioGroup value={input.audience} onValueChange={v=>setInput({...input,audience:v as ResearchInput["audience"]})} className="flex flex-wrap gap-5">{[["test","My test account"],["public","External users"]].map(([v,label])=><Label key={v} className="flex gap-2 text-sm" htmlFor={`research-${v}`}><RadioGroupItem id={`research-${v}`} value={v}/>{label}</Label>)}</RadioGroup></fieldset>
          <fieldset><legend className="mb-3 text-sm font-medium">Authentication</legend><RadioGroup value={input.auth} onValueChange={v=>setInput({...input,auth:v as ResearchInput["auth"]})} className="flex flex-wrap gap-5">{[["own","My own OAuth app"],["managed","Composio managed"]].map(([v,label])=><Label key={v} className="flex gap-2 text-sm" htmlFor={`research-${v}`}><RadioGroupItem id={`research-${v}`} value={v}/>{label}</Label>)}</RadioGroup></fieldset>
          {error && <p role="alert" className="field-error"><CircleAlert aria-hidden="true"/><span>{error}</span></p>}
          <Button type="submit" className="h-11 w-full">{hasStarted ? "Try research again" : "Build my guide"}<ArrowRight/></Button>
          <p className="research-disclosure">Reads public documentation. Your app name and task are sent to our research provider. Don’t include secrets.</p>
        </form>
      </section>}
      {busy && <section className="research-form-page" aria-busy="true">
        <div className="research-orbit" aria-hidden="true"><motion.div animate={reduce ? {} : {rotate:360}} transition={{duration:12,repeat:Infinity,ease:"linear"}} className="orbit-ring"/><Globe2 className="size-7"/></div>
        <h1 className="mt-6">Investigating {input.query}</h1><p className="lede" role="status" aria-live="polite">{detail}</p>
        <div className="research-list">{["Search and read official docs","Build a guide from the evidence","Check sources and save a snapshot"].map((label,i)=>{
          const index=phase === "research" ? 0 : phase === "evidence" ? 1 : 2;return <div key={label} className={cn("research-row",i===index&&"research-active")}><span className={cn("step-count",i<index&&"complete")}>{i<index ? <Check className="size-3.5"/> : i===index ? <LoaderCircle className="size-3.5 animate-spin"/> : i+1}</span><span>{label}</span></div>;
        })}</div>
        <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{elapsed}s elapsed · no account actions</span><Button variant="ghost" onClick={cancel}><X/>Stop research</Button></div>
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">{elapsed>40 ? "Still working. Some documentation takes longer to retrieve; you can stop and narrow the task." : "We’ll show what we found and what still needs confirmation."}</p>
      </section>}
      {phase === "result" && guide && current && <section className="guide-page">
        <div className="guide-header"><div><Button variant="ghost" className="guide-back -ml-3" onClick={()=>{setPhase("form");setError("");}}><ArrowLeft/>Refine research</Button><div className="flex items-center gap-3"><span className="provider-symbol"><Globe2 className="size-5"/></span><div><h1 ref={resultHeading} tabIndex={-1}>{guide.appName} setup</h1><p className="mt-1 text-xs text-muted-foreground">{guide.request.audience === "test" ? "Testing" : "External users"} · {guide.request.auth === "managed" ? "Managed auth" : "Own OAuth app"}</p></div></div></div><Button variant="outline" onClick={shareGuide}><Link2/>Share</Button></div>
        <p className="research-summary">{guide.summary}</p>
        {guide.status!=="documented"&&<div className="launch-strip"><CircleAlert className="size-4 shrink-0"/><span>{guide.status==="needs-clarification" ? "Some details need clarification. Review the open questions before following these steps." : "OAuth setup is not confirmed. This guide explains what to investigate next."}</span></div>}
        <div className="effort-row"><div><Clock3 className="size-4"/><span><span className="metric-label">Hands-on estimate</span>{guide.effort.handsOn}</span></div><div><ShieldCheck className="size-4"/><span><span className="metric-label">External waiting</span>{guide.effort.waiting}</span></div><Button variant="ghost" size="sm" onClick={()=>openPanel("overview")}>Before you start<ArrowUpRight/></Button></div>
        <div className="guide-grid"><nav className="step-nav research-nav" aria-label="Research guide steps"><p className="eyebrow">YOUR PATH</p>{guide.steps.map((s,i)=><Button key={i} variant="ghost" className={cn("step-nav-button",step===i&&"active")} aria-label={`Step ${i+1}: ${s.title}`} aria-current={step===i?"step":undefined} onClick={()=>setStep(i)}>{step===i&&<motion.span layoutId="research-step" className="active-step-bg"/>}<span className={cn("step-count",done.includes(i)&&"complete")}>{done.includes(i)?<Check className="size-3.5"/>:i+1}</span><span className="relative research-step-label">{s.title}</span></Button>)}<div className="nav-footer">{done.length} of {guide.steps.length} checked<div className="progress-track"><motion.div animate={{width:`${done.length/guide.steps.length*100}%`}}/></div><p>Your checks · this session</p></div></nav>
        <div className="research-task-stack">
          <div className="research-task-card"><AnimatePresence mode="wait"><motion.article className="task-article" key={step} initial={{opacity:0,y:reduce?0:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.18}}>
            <div className="task-scroll" role="region" aria-label="Step instructions" tabIndex={0}>

            <div className="task-heading"><div className="flex items-center justify-between gap-3"><span className="eyebrow">STEP {step+1} OF {guide.steps.length}</span><Badge variant="secondary" className="font-normal">{current.actor==="agent"?"Agent can prepare":current.actor==="both"?"Agent + you":"Your action"}</Badge></div><h2>{current.title}</h2><p>{current.action}</p><p className="step-evidence">{current.evidence==="documented" ? "From documentation" : current.evidence==="recommendation" ? "Suggested approach" : "Needs confirmation"}<Sources guide={guide} ids={current.sourceIds}/></p></div>
            <div className="task-controls pt-0">
              {current.url&&<Button variant="outline" asChild><a href={current.url} target="_blank" rel="noopener noreferrer">{current.destination && !/^https?:\/\//i.test(current.destination) ? current.destination : "Open setup instructions"}<ArrowUpRight/></a></Button>}
              <ol className="walkthrough-actions">{(current.instructions ?? [current.detail]).map((instruction,i)=><li key={i}><span className="walkthrough-number" aria-hidden="true">{i+1}</span><p>{instruction}</p></li>)}</ol>
              <div className="success-check"><Check className="size-4 shrink-0"/><p><strong className="block font-medium">You’re ready when</strong>{current.successCheck}</p></div>
              <Accordion type="single" collapsible className="mt-3"><AccordionItem value="recovery"><AccordionTrigger>Stuck on this step?</AccordionTrigger><AccordionContent><p>{current.recovery}</p></AccordionContent></AccordionItem>{current.instructions&&<AccordionItem value="context"><AccordionTrigger>Why this matters</AccordionTrigger><AccordionContent><p>{current.detail}</p></AccordionContent></AccordionItem>}</Accordion>
            </div></div>
          </motion.article></AnimatePresence><div className="task-actions">
            <div className="task-bottom"><Button variant="ghost" onClick={()=>openPanel("sources")}><BookOpen/>Sources</Button><Button onClick={()=>{setDone(v=>[...new Set([...v,step])]);if(step<guide.steps.length-1)setStep(step+1);else openPanel("launch");}}>{step===guide.steps.length-1 ? "Check launch readiness" : done.includes(step) ? "Continue" : "Mark done & continue"}<ArrowRight/></Button></div>
              {done.includes(step)&&<Button variant="link" className="mt-2 text-xs" onClick={()=>setDone(v=>v.filter(i=>i!==step))}>Undo completion</Button>}
          </div></div>
          <div className="research-secondary"><Button variant="ghost" onClick={()=>openPanel("agent")}><Sparkles/>Agent handoff</Button><Button variant="ghost" onClick={()=>openPanel("launch")}><ShieldCheck/>{guide.blockers.length+guide.unknowns.length ? "Blockers & open questions" : "Launch checks"}</Button></div>
        </div></div>
        <p className="guide-footnote">Researched {new Date(guide.generatedAt).toLocaleDateString()} · {guide.sources.length} sources · setup not performed</p>
      </section>}
    </main>
    <footer className="site-footer"><span>Know what to do next.</span><span>Sources first. Uncertainty visible.</span></footer>
    <Sheet open={panel!==null} onOpenChange={v=>{if(!v)setPanel(null);}}><SheetContent className="overflow-y-auto sm:max-w-lg" onCloseAutoFocus={e=>{e.preventDefault();opener.current?.focus();}}><SheetHeader><SheetTitle>{panel==="sources"?"Research evidence":panel==="agent"?"Hand this to your agent":panel==="overview"?"Before you start":"Before you launch"}</SheetTitle><SheetDescription>{panel==="sources"?"Sources returned by live web research. Model synthesis can still be wrong.":panel==="agent"?"Preparation is separate from account changes and consent.":panel==="overview"?"The work, waiting and decisions ahead.":"A working test does not mean public launch is approved."}</SheetDescription></SheetHeader>
      {guide&&<div className="panel-body">{panel==="sources"?<>
        <div className="evidence-note"><ShieldCheck className="size-4"/><p>The snapshot is signed by this app. That confirms its origin—not provider approval or factual correctness.</p></div>
        {guide.sources.map(s=><a key={s.id} className="source-card" href={s.url} target="_blank" rel="noopener noreferrer"><span className="source-number">{s.id}</span><span><strong>{s.title}</strong><small>{new URL(s.url).hostname} · {s.evidence === "retrieved" ? "page read" : "search excerpt"}</small></span><ArrowUpRight className="size-4 shrink-0"/></a>)}
        <Accordion type="single" collapsible><AccordionItem value="run"><AccordionTrigger>Run details</AccordionTrigger><AccordionContent><p>Model: {guide.run.model}</p><p>{guide.run.searches} {guide.run.searches === 1 ? "search" : "searches"} · {guide.run.toolCalls} tool {guide.run.toolCalls === 1 ? "call" : "calls"} · {Math.round(guide.run.durationMs/1000)} seconds{guide.run.pageReads!==undefined&&` · ${guide.run.pageReads} pages read`}</p><p>Generated: {guide.generatedAt}</p><p>Retrieved source excerpts informed the guide. No account login, app registration or test API call was performed. Source support is assigned by the model, not independently proven.</p></AccordionContent></AccordionItem></Accordion><Button variant="outline" onClick={download}><Download/>Download guide JSON</Button>
      </>:panel==="agent"?<><textarea readOnly value={guide.agentBrief} className="agent-brief" aria-label="Agent handoff instructions"/><Button onClick={()=>copy(guide.agentBrief)}><Copy/>{copyStatus==="Copied"?"Copied":"Copy instructions"}</Button><p role="status" className="text-xs text-muted-foreground">{copyStatus||"Do not paste keys or tokens into an agent chat."}</p></>:<>
        {guide.overview&&<><div className="panel-section"><Badge variant="secondary">{guide.overview.difficulty}</Badge><p className="mt-3">{guide.overview.reason}</p></div><div className="panel-section"><h3>Your agent can prepare</h3><p>{guide.overview.agentCan}</p></div><div className="panel-section"><h3>You take over for</h3><p>{guide.overview.youHandle}</p></div></>}
        {panel==="overview"&&guide.prerequisites.length>0&&<div className="panel-section"><h3>Have these ready</h3>{guide.prerequisites.map((p,i)=><p key={i}><strong>{p.title}</strong><br/>{p.detail}<Sources guide={guide} ids={p.sourceIds}/></p>)}</div>}
        <div className="panel-section"><h3>Effort & waiting</h3><p>{guide.effort.handsOn}</p><p>{guide.effort.waiting}</p><small>{guide.effort.basis}<Sources guide={guide} ids={guide.effort.sourceIds}/></small></div>
        {guide.permissions.length>0&&<div className="panel-section"><h3>Requested permissions</h3>{guide.permissions.map((p,i)=><p key={i}><code>{p.name}</code><br/>{p.reason}<Sources guide={guide} ids={p.sourceIds}/></p>)}</div>}
        {guide.blockers.map((b,i)=><div className="panel-section" key={i}><h3>{b.title}</h3><p>{b.detail}<Sources guide={guide} ids={b.sourceIds}/></p></div>)}
        <div className="panel-section"><h3>Still to confirm</h3>{guide.unknowns.length?guide.unknowns.map((u,i)=><p key={i}>{u}</p>):<p>No further gaps were identified by this research run. Confirm requirements with the provider before launch.</p>}</div>
        <p className="text-xs text-muted-foreground">Your {done.length} checked steps are self-reported. This app has not verified a connection or approval.</p><Button variant="outline" onClick={()=>{setPanel(null);setPhase("form");}}><RotateCcw/>Refine & research again</Button>
      </>}</div>}
    </SheetContent></Sheet>
    <Dialog open={shareOpen} onOpenChange={setShareOpen}><DialogContent onCloseAutoFocus={e=>{e.preventDefault();opener.current?.focus();}}><DialogHeader><DialogTitle>Share this guide</DialogTitle><DialogDescription>Anyone with the link can read this saved guide, its task and sources. Personal checklist progress is excluded.</DialogDescription></DialogHeader><Input aria-label="Shareable guide link" readOnly value={shareUrl} onFocus={e=>e.target.select()}/><Button onClick={()=>copy(shareUrl)}><Copy/>{copyStatus==="Copied"?"Link copied":"Copy link"}</Button><p role="status" className="text-xs text-muted-foreground">{copyStatus||"A saved snapshot—not a new research run."}</p></DialogContent></Dialog>
  </div>;
}
