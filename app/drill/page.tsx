import { Suspense } from "react";
import { DrillSearch } from "@/components/DrillSearch";

export const dynamic = "force-dynamic";

export default async function DrillPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (k: string) => {
    const v = sp[k];
    return typeof v === "string" ? v : undefined;
  };
  return (
    <div>
      <h2 style={{ marginTop: 4 }}>Drill a token</h2>
      <Suspense fallback={<p className="mono-sm dim">loading…</p>}>
        <DrillSearch platform={one("platform")} address={one("address")} q={one("q")} />
      </Suspense>
    </div>
  );
}
