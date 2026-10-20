import { Waypoints } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function GuideSkeleton() {
  return <section className="guide-page loading-guide" aria-busy="true" aria-label="Loading guide">
    <span className="sr-only" role="status">Opening your guide</span>
    <div aria-hidden="true" className="skeleton-guide-heading"><Skeleton className="h-7 w-20" /><div className="flex items-center gap-3"><Skeleton className="size-10 rounded-xl" /><div className="space-y-2"><Skeleton className="h-7 w-48" /><Skeleton className="h-3 w-64 max-w-full" /></div></div></div>
    <Skeleton aria-hidden="true" className="loading-strip h-12 w-full" />
    <div className="guide-grid" aria-hidden="true"><div className="skeleton-nav space-y-3">{Array.from({length:5},(_,i)=><Skeleton key={i} className="h-11 w-full" />)}</div><div className="skeleton-task"><div className="flex justify-between"><Skeleton className="h-3 w-20" /><Skeleton className="h-5 w-24" /></div><Skeleton className="mt-7 h-7 w-2/3" /><Skeleton className="mt-4 h-3 w-full" /><Skeleton className="mt-2 h-3 w-4/5" /><Skeleton className="my-6 min-h-20 flex-1 w-full" /><div className="flex justify-between"><Skeleton className="h-9 w-20" /><Skeleton className="h-10 w-40" /></div></div></div>
  </section>;
}

export default function PageSkeleton({ variant="home" }: { variant?: "home"|"research"|"guide" }) {
  return <div className="app-shell loading-shell"><header className="site-header"><span className="brand inline-flex items-center"><Waypoints className="size-5" />fieldguide<span className="brand-dot">.</span></span><Skeleton aria-hidden="true" className="h-6 w-28 rounded-full" /></header><main className={variant==="guide"?"guide-main":undefined}>
    {variant==="guide" ? <GuideSkeleton /> : <section className={variant==="home"?"lookup-page skeleton-home":"research-form-page"} aria-busy="true" aria-label={variant==="home"?"Loading Fieldguide":"Loading research form"}><span className="sr-only" role="status">{variant==="home"?"Opening Fieldguide":"Opening research"}</span><div aria-hidden="true"><Skeleton className="mb-5 h-5 w-36" /><Skeleton className="h-10 w-4/5" /><Skeleton className="mt-3 h-10 w-full" /><Skeleton className="mt-6 h-4 w-3/4" /><Skeleton className="mt-8 h-12 w-full" />{variant==="home"?<><div className="my-4 flex justify-center gap-3">{[0,1,2].map(i=><Skeleton key={i} className="h-9 w-24 rounded-full" />)}</div><Skeleton className="mx-auto mt-8 h-44 w-4/5 rounded-xl" /></>:<><Skeleton className="mt-7 h-4 w-40" /><Skeleton className="mt-3 h-12 w-full" /><Skeleton className="mt-7 h-20 w-full" /><Skeleton className="mt-7 h-11 w-full" /></>}</div></section>}
  </main><footer className="site-footer"><span>Know what to do next.</span></footer></div>;
}
