"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, CircleAlert, Check, CheckCheck, CircleHelp, Copy, KeyRound, Link2, Play, Search, Settings2, ShieldCheck, Waypoints } from "lucide-react";
import { Icon } from "@iconify/react";
import brandIcons from "@/lib/brand-icons.json";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Context, Provider, gate, getSteps, operation, providers, reviewSource, scope } from "@/lib/guide";
import { cn } from "@/lib/utils";

const initial: Context = { provider: "gmail", intent: "send", audience: "test", managed: false };
function ProviderIcon({ id, className }: { id: Provider; className?: string }) {
  return <span className={cn("provider-symbol", id, className)}><Icon icon={brandIcons[id]} width={20} height={20} aria-hidden="true" /></span>;
}

function Diagram({ labels, identity }: { labels: [string, string, string]; identity: string }) {
  const reduce = useReducedMotion();
  const [replay, setReplay] = useState(0);
  return <div className="diagram">
    <div className="diagram-caption"><span>How it works</span><Button variant="ghost" size="sm" onClick={() => setReplay(v => v + 1)} aria-label="Replay step animation"><Play className="size-3" /> Replay</Button></div>
    <div key={`${identity}-${replay}`} className="diagram-nodes" aria-label={labels.join(" → ")}>
      {labels.map((label, i) => {
        const Icon = i === 0 ? Settings2 : i === 1 ? KeyRound : ShieldCheck;
        return <div key={i} className="diagram-unit">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12, scale: .92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", bounce: .16, duration: .6, delay: reduce ? 0 : i * .85 }}
            className={cn("diagram-node", i === 2 && "diagram-node-final")}
          >
            <motion.span className="diagram-halo" aria-hidden="true"
              initial={{ opacity: 0, scale: 1 }}
              animate={reduce ? { opacity: 0 } : { opacity: [0, .6, 0], scale: [1, 1.08, 1.3] }}
              transition={{ duration: .9, delay: i * .85 + .25 }} />
            <motion.span className="diagram-icon" aria-hidden="true"
              animate={reduce ? {} : i === 1 ? { rotate: [0, -20, 12, 0] } : { scale: [1, 1.16, 1] }}
              transition={{ duration: .65, delay: i * .85 + .2 }}><Icon className="size-6" strokeWidth={1.6} /></motion.span>
            <motion.span className="diagram-tick" aria-hidden="true"
              initial={reduce ? false : { opacity: 0, scale: .3 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", bounce: .3, duration: .45, delay: reduce ? 0 : i * .85 + .65 }}><Check size={10} strokeWidth={3} /></motion.span>
          </motion.div>
          <motion.span initial={reduce ? false : { opacity: .35 }} animate={{ opacity: 1 }} transition={{ duration: .35, delay: reduce ? 0 : i * .85 }} className="diagram-label">{label}</motion.span>
          {i < 2 && <svg className="connector" viewBox="0 0 100 20" aria-hidden="true">
            <path d="M0 10 H100" stroke="currentColor" strokeOpacity=".13" strokeDasharray="3 4" fill="none" />
            <motion.path d="M0 10 H100" stroke="currentColor" strokeWidth="1.6" fill="none" initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: .65, delay: reduce ? 0 : i * .85 + .4 }} />
            <motion.circle r="3" cy="10" fill="currentColor" initial={{ opacity: 0 }} animate={reduce ? { opacity: 0 } : { cx: [0, 100], opacity: [0, 1, 1, 0] }} transition={{ duration: .65, delay: i * .85 + .4 }} />
          </svg>}
        </div>;
      })}
    </div>
    <p className="diagram-footnote">Illustration · no account action performed</p>
  </div>;
}

export default function Fieldguide({ initialContext, sharedGuide = false }: { initialContext?: Context; sharedGuide?: boolean }) {
  const router = useRouter();
  const [page, setPage] = useState<"home" | "intent" | "guide" | "done">(initialContext ? "guide" : "home");
  const [context, setContext] = useState<Context>(initialContext ?? initial);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<number[]>([]);
  const [panel, setPanel] = useState<"source" | "settings" | "launch" | null>(null);
  const [share, setShare] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [shared, setShared] = useState(sharedGuide);
  const searchRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();
  const allSteps = getSteps(context);
  const current = allSteps[step];
  function openPanel(value: "source" | "settings" | "launch") {
    openerRef.current = document.activeElement as HTMLElement;
    setPanel(value);
  }

  function select(id: Provider) { setContext({ ...initial, provider: id }); setDone([]); setStep(0); setShared(false); setPage("intent"); setError(""); }
  function search() {
    const value = query.trim().toLowerCase();
    if (!value) { setError("Add an app name or website to find its guide."); searchRef.current?.focus(); return; }
    let host = value;
    try { host = new URL(value.includes("://") ? value : `https://${value}`).hostname.replace(/^www\./, ""); } catch {}
    const id = (Object.keys(providers) as Provider[]).find(id => value === id || host === providers[id].domain || id === "gmail" && host === "mail.google.com");
    if (id) select(id); else { router.push(`/research?app=${encodeURIComponent(query.trim())}`); }
  }
  function goHome() { window.history.replaceState(null, "", "/"); setPage("home"); setQuery(""); setShared(false); setError(""); }
  function finish() { setDone(previous => [...new Set([...previous, step])]); if (step < allSteps.length - 1) setStep(step + 1); else setPage("done"); }
  function openShare() {
    openerRef.current = document.activeElement as HTMLElement;
    const url = new URL(window.location.origin);
    url.search = new URLSearchParams({ app: context.provider, intent: context.intent, audience: context.audience, managed: context.managed ? "1" : "0", shared: "1" }).toString();
    setShareUrl(url.href); setCopyStatus(""); setShare(true);
  }
  async function copy() { try { await navigator.clipboard.writeText(shareUrl); setCopyStatus("Link copied"); } catch { setCopyStatus("Select the link and copy it manually."); } }
  function update(patch: Partial<Context>) { setContext({ ...context, ...patch }); setDone([]); setStep(0); }

  return <MotionConfig reducedMotion="user"><div className="app-shell">
    <header className="site-header"><Button variant="ghost" className="brand" onClick={goHome}><Waypoints className="size-5" /> fieldguide<span className="brand-dot">.</span></Button><div className="flex items-center gap-2"><Badge variant="secondary" className="font-normal">OAuth setup guides</Badge><Button variant="ghost" size="icon" aria-label="About these guides" onClick={() => openPanel("source")}><CircleHelp /></Button></div></header>
    <main><AnimatePresence mode="wait"><motion.div key={page} initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : -8 }} transition={{ duration: .24 }} onAnimationComplete={() => { if (page !== "home") headingRef.current?.focus({ preventScroll: true }); }}>
      {page === "home" && <section className="lookup-page">
        <Badge variant="outline" className="mb-5 gap-2 text-muted-foreground"><span className="size-1.5 rounded-full bg-emerald-600" /> OAuth, without the guesswork</Badge>
        <h1>Connect an app.<br /><span className="text-muted-foreground">Know the next step.</span></h1>
        <p className="lede">A short setup guide, with approval blockers upfront.</p>
        <div className="lookup-box"><form onSubmit={e => { e.preventDefault(); search(); }} className="space-y-2">
          <Label htmlFor="app-query" className="sr-only">App name or website</Label>
          <InputGroup className="h-12 shadow-xs"><InputGroupInput ref={searchRef} id="app-query" placeholder="App name or website" value={query} onChange={e => { setQuery(e.target.value); setError(""); }} aria-invalid={!!error} aria-describedby={error ? "search-error" : undefined} autoComplete="off" /><InputGroupAddon><Search className="size-4" /></InputGroupAddon><InputGroupAddon align="inline-end"><Button type="submit" className="h-9 px-4">Find guide <ArrowRight /></Button></InputGroupAddon></InputGroup>
          {error && <p id="search-error" role="alert" className="field-error"><CircleAlert aria-hidden="true" /><span>{error}</span></p>}
        </form><div className="sample-apps"><span>Try</span>{(Object.keys(providers) as Provider[]).map(id => <Button key={id} variant="outline" className="h-9 gap-2 rounded-full px-3 font-normal" onClick={() => select(id)}><ProviderIcon id={id} className="mini" />{providers[id].name}</Button>)}</div></div>
        <div className="home-diagram"><Diagram labels={["Create app", "Set permissions", "Test connection"]} identity="home" /></div>
        <p className="preview-note">Start with a sample, or research another app.</p>
      </section>}

      {page === "intent" && <section className="intent-page">
        <Button variant="ghost" className="-ml-3 mb-8" onClick={goHome}><ArrowLeft /> All apps</Button><ProviderIcon id={context.provider} />
        <h1 ref={headingRef} tabIndex={-1} className="mt-5">What are you building?</h1><p className="lede">We’ll show the permissions that fit.</p>
        <RadioGroup value={context.intent} onValueChange={value => update({ intent: value as Context["intent"] })} className="mt-8 grid gap-3">
          {(context.provider === "gmail" ? [["send", "Send email", "Send messages on a user’s behalf"], ["read", "Read email", "Read mailbox content"]] : [["send", context.provider === "slack" ? "Post messages" : "Read a profile", providers[context.provider].hint]]).map(([value, title, desc]) => <Label key={value} htmlFor={`intent-${value}`} className={cn("option-row", context.intent === value && "selected")}><RadioGroupItem id={`intent-${value}`} value={value} /><span><span className="block text-sm font-medium">{title}</span><span className="mt-1 block text-xs font-normal text-muted-foreground">{desc}</span></span></Label>)}
        </RadioGroup>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><span className="text-sm">Who is it for?</span><RadioGroup className="flex gap-4" value={context.audience} onValueChange={value => update({ audience: value as Context["audience"] })}>{[["test", "Testing"], ["public", "External users"]].map(([value, label]) => <Label key={value} className="flex cursor-pointer items-center gap-2 text-xs" htmlFor={`audience-${value}`}><RadioGroupItem value={value} id={`audience-${value}`} />{label}</Label>)}</RadioGroup></div>
        <AnimatePresence mode="wait"><motion.div key={context.intent} initial={{ opacity: 0, y: reduce ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="scope-note"><KeyRound className="size-4 shrink-0" /><code>{scope(context)}</code><span>{context.provider === "gmail" ? context.intent === "read" ? "Restricted" : "Sensitive" : "Task permission"}</span></motion.div></AnimatePresence>
        <Button className="mt-6 h-11 w-full" onClick={() => { setPage("guide"); setStep(0); }}>Show my steps <ArrowRight /></Button><Button variant="link" className="mx-auto mt-2 flex text-xs text-muted-foreground" onClick={() => openPanel("settings")}>{context.managed ? "Using managed auth" : "Using my own OAuth app"} <Settings2 className="size-3" /></Button>
      </section>}

      {page === "guide" && <section className="guide-page">
        <div className="guide-header"><div><Button variant="ghost" className="-ml-3 mb-3 text-muted-foreground" onClick={goHome}><ArrowLeft /> All apps</Button><div className="flex items-center gap-3"><ProviderIcon id={context.provider} /><div><h1 ref={headingRef} tabIndex={-1}>{providers[context.provider].name} setup</h1><p className="mt-1 text-xs text-muted-foreground">{operation(context)} · {context.audience === "test" ? "Testing" : "External users"} · {context.managed ? "Managed auth" : "Own OAuth app"}</p></div></div></div><div className="flex gap-1"><Button variant="ghost" size="icon" aria-label="Edit guide settings" onClick={() => openPanel("settings")}><Settings2 /></Button><Button variant="ghost" asChild><a href={`/research?app=${context.provider}&task=${encodeURIComponent(operation(context))}&audience=${context.audience}&auth=${context.managed?"managed":"own"}`}>Refresh research</a></Button><Button variant="outline" onClick={openShare}><Link2 /> Share</Button></div></div>
        <div className="launch-strip"><ShieldCheck className="size-4 shrink-0" /><span>{gate(context)}</span><Button variant="link" size="sm" onClick={() => openPanel("launch")}>Details <ArrowUpRight className="size-3" /></Button></div>
        {shared && <p className="mb-4 text-xs text-muted-foreground">Shared guide · personal progress excluded</p>}
        <div className="guide-grid"><nav className="step-nav" aria-label="Setup steps"><p className="eyebrow">YOUR PATH</p>{allSteps.map((s, i) => <Button key={s.short} variant="ghost" onClick={() => setStep(i)} aria-label={`Step ${i + 1}: ${s.short}`} aria-current={step === i ? "step" : undefined} className={cn("step-nav-button", step === i && "active")}>{step === i && <motion.span layoutId="active-step" className="active-step-bg" transition={{ type: "spring", bounce: 0, duration: .4 }} />}<span className={cn("step-count", done.includes(i) && !shared && "complete")}>{done.includes(i) && !shared ? <motion.span initial={{ scale: .25, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}><Check className="size-3.5" /></motion.span> : i + 1}</span><span className="relative">{s.short}</span></Button>)}<div className="nav-footer"><span>{shared ? "Follow at your pace" : `${done.length} of ${allSteps.length} checked`}</span><div className="progress-track"><motion.div animate={{ width: shared ? "0%" : `${done.length / allSteps.length * 100}%` }} transition={{ duration: .45 }} /></div><p>Self-reported · this session</p></div></nav>
          <Card className="task-card"><CardContent className="p-0"><AnimatePresence mode="wait"><motion.article key={`${step}-${context.managed}-${context.intent}`} initial={{ opacity: 0, x: reduce ? 0 : 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reduce ? 0 : -16 }} transition={{ duration: .25 }}>
            <div className="task-heading"><div className="flex items-center justify-between"><span className="eyebrow">STEP {step + 1} OF {allSteps.length}</span><Badge variant="secondary" className="gap-1 font-normal"><span className="size-1 rounded-full bg-current" /> Your action</Badge></div><h2>{current.title}</h2><p>{current.action}</p></div>
            <Diagram labels={current.visual} identity={`step-${step}`} />
            <div className="task-controls"><Button asChild variant="link" className="h-auto px-0"><a href={current.link} target="_blank" rel="noopener noreferrer">{current.destination}<ArrowUpRight /></a></Button>
              <Accordion type="single" collapsible className="mt-4"><AccordionItem value="detail"><AccordionTrigger>Instructions & success check</AccordionTrigger><AccordionContent><p>{current.detail}</p><p className="mt-3"><strong>Check:</strong> {current.check}</p><p className="mt-3"><strong>If blocked:</strong> {current.recovery}</p></AccordionContent></AccordionItem></Accordion>
              <div className="task-bottom"><Button variant="ghost" className="text-muted-foreground" onClick={() => openPanel("source")}><BookOpen /> Source</Button>{shared ? <Button onClick={() => step < allSteps.length - 1 ? setStep(step + 1) : openPanel("launch")}>{step < allSteps.length - 1 ? "Next step" : "Review launch"}<ArrowRight /></Button> : <Button className="h-10 px-4" onClick={finish}>{done.includes(step) ? "Continue" : "Mark done & continue"} <ArrowRight /></Button>}</div>
              {done.includes(step) && !shared && <Button variant="link" className="text-xs" onClick={() => setDone(done.filter(i => i !== step))}>Undo completion</Button>}
            </div>
          </motion.article></AnimatePresence></CardContent></Card>
        </div><p className="guide-footnote">{context.provider === "github" && !context.managed ? "Documentation and registration form checked · no app created" : "Documentation checked · setup not attempted · no approval claimed"}</p>
      </section>}

      {page === "done" && <section className="intent-page text-center"><motion.div initial={{ scale: reduce ? 1 : .5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0, duration: .5 }} className="completion-icon"><CheckCheck /></motion.div><h1 ref={headingRef} tabIndex={-1} className="mt-6">Your checklist is complete.</h1><p className="lede">These are your checks. Provider approval is separate.</p><Button className="mt-7 h-11" onClick={() => openPanel("launch")}>Review launch requirements <ArrowRight /></Button><Button variant="link" className="mx-auto mt-3 flex" onClick={() => { setStep(0); setPage("guide"); }}>Back to steps</Button></section>}

    </motion.div></AnimatePresence></main>
    <footer className="site-footer"><span>Built for the first successful connection.</span><span>Sourced guidance · verify before launch</span></footer>
  </div>

  <Sheet open={panel !== null} onOpenChange={open => { if (!open) setPanel(null); }}><SheetContent onCloseAutoFocus={event => { event.preventDefault(); openerRef.current?.focus(); }} className="overflow-y-auto sm:max-w-md"><SheetHeader><SheetTitle>{panel === "settings" ? "Guide settings" : panel === "launch" ? "Before you launch" : "Evidence & sources"}</SheetTitle><SheetDescription>{panel === "settings" ? "Changes update your steps and clear this session’s checklist." : panel === "launch" ? "A working test and provider approval are separate." : "Official documentation, checked 20 October 2026."}</SheetDescription></SheetHeader>
    <div className="space-y-6 px-6 pb-8 text-sm">{panel === "settings" ? <>
      <fieldset><legend className="mb-3 font-medium">Authentication</legend><RadioGroup value={context.managed ? "managed" : "custom"} onValueChange={v => update({ managed: v === "managed" })}>{[["custom", "My own OAuth app"], ["managed", "Composio managed auth"]].map(([v, text]) => <Label key={v} className="flex items-center gap-3 py-2" htmlFor={v}><RadioGroupItem id={v} value={v} />{text}</Label>)}</RadioGroup></fieldset>
      {context.provider === "gmail" && <fieldset><legend className="mb-3 font-medium">Operation</legend><RadioGroup value={context.intent} onValueChange={v => update({ intent: v as Context["intent"] })}>{[["send", "Send email"], ["read", "Read email"]].map(([v, text]) => <Label key={v} className="flex items-center gap-3 py-2" htmlFor={`settings-${v}`}><RadioGroupItem id={`settings-${v}`} value={v} />{text}</Label>)}</RadioGroup></fieldset>}
      <p className="text-xs text-muted-foreground">Reading restricted mailbox data on a server may require a security assessment. Confirm your actual data flow and any exception.</p><Button onClick={() => setPanel(null)}>Done <Check /></Button>
    </> : panel === "launch" ? <><div className="rounded-lg bg-muted p-4"><ShieldCheck className="mb-3 size-5" /><p className="font-medium">{gate(context)}</p></div><p className="text-muted-foreground">{allSteps[4].detail}</p><Button variant="outline" asChild><a href={reviewSource(context)} target="_blank" rel="noopener noreferrer">Read official requirements <ArrowUpRight /></a></Button><Separator /><p className="text-xs text-muted-foreground">Setup effort has not been measured. Review times are conditional provider estimates, not a launch promise.</p></> : <><Badge variant="secondary">Documentation evidence</Badge><p className="text-muted-foreground">{page === "guide" ? current.detail : "Sample guidance is based on official Google, Slack, GitHub and Composio documentation. No provider registration, connection or approval was completed."}</p><Button variant="outline" asChild><a href={page === "guide" ? current.source : reviewSource(context)} target="_blank" rel="noopener noreferrer">Open official source <ArrowUpRight /></a></Button><Separator /><div className="space-y-2 text-xs text-muted-foreground"><p>✓ Official documentation reviewed</p><p>○ Provider setup not attempted</p><p>✓ Live research available for other apps</p><p>○ Checklist is self-reported</p></div></>}</div>
  </SheetContent></Sheet>
  <Dialog open={share} onOpenChange={setShare}><DialogContent onCloseAutoFocus={event => { event.preventDefault(); openerRef.current?.focus(); }}><DialogHeader><DialogTitle>Share this guide</DialogTitle><DialogDescription>Includes your use case. Excludes personal progress.</DialogDescription></DialogHeader><Label htmlFor="share-link" className="sr-only">Guide link</Label><InputGroup><InputGroupInput id="share-link" value={shareUrl} readOnly onFocus={e => e.target.select()} /><InputGroupAddon align="inline-end"><Button size="icon" variant="ghost" aria-label="Copy guide link" onClick={copy}><Copy /></Button></InputGroupAddon></InputGroup><p role="status" className="text-xs text-muted-foreground">{copyStatus || "Local preview link · works on this computer only"}</p></DialogContent></Dialog>
  </MotionConfig>;
}
