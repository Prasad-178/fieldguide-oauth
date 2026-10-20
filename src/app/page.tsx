import { Suspense } from "react";
import Fieldguide from "@/components/fieldguide";
import { Context, Provider, providers } from "@/lib/guide";

type Query = Promise<Record<string, string | string[] | undefined>>;

async function GuideFromQuery({ searchParams }: { searchParams: Query }) {
  const query = await searchParams;
  const id = query.app;
  const initialContext: Context | undefined = typeof id === "string" && Object.hasOwn(providers, id)
    ? { provider: id as Provider, intent: query.intent === "read" ? "read" : "send", audience: query.audience === "public" ? "public" : "test", managed: query.managed === "1" }
    : undefined;
  return <Fieldguide initialContext={initialContext} sharedGuide={query.shared === "1"} />;
}

export default function Page({ searchParams }: { searchParams: Query }) {
  return <Suspense fallback={<div className="p-10 text-sm text-muted-foreground">Opening your guide…</div>}><GuideFromQuery searchParams={searchParams} /></Suspense>;
}
