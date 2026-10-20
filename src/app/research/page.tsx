import { Suspense } from "react";
import ResearchWorkbench from "@/components/research-workbench";
import PageSkeleton from "@/components/page-skeleton";
async function ResearchPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
 const params=await searchParams;
 return <ResearchWorkbench audience={params.audience === "public" ? "public" : "test"} auth={params.auth === "managed" ? "managed" : "own"} query={typeof params.app==="string"?params.app.slice(0,160):""} useCase={typeof params.task==="string"?params.task.slice(0,300):""}/>;
}
export default function Page(props:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
 return <Suspense fallback={<PageSkeleton variant="research" />}><ResearchPage {...props}/></Suspense>;
}
