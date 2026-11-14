import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BadgeCheck, SearchCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EVIDENCE, type EvidenceStatus } from "@/lib/evidence";
import { LOOPS } from "@/lib/sim/loops";
import type { LoopId } from "@/lib/sim/types";
import { InfoTip, LoopChip, PageHeader } from "@/components/ll/primitives";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/evidence")({
  head: () => ({
    meta: [
      { title: "Evidence — LoopLocal" },
      { name: "description", content: "The public figures behind LoopLocal, each with its source and a verification tag: tanker bookings, recharge pits, STP registrations, tariffs and more." },
      { property: "og:title", content: "Evidence — LoopLocal" },
      { property: "og:description", content: "Real figures from Hyderabad reports, with named sources." },
    ],
  }),
  component: EvidencePage,
});

function EvidencePage() {
  const [status, setStatus] = useState<EvidenceStatus | "all">("all");
  const [loop, setLoop] = useState<LoopId | "all">("all");

  const items = useMemo(() => EVIDENCE.filter((e) => (status === "all" || e.status === status) && (loop === "all" || e.loops.includes(loop))), [status, loop]);
  const counts = { verified: EVIDENCE.filter((e) => e.status === "verified").length, check: EVIDENCE.filter((e) => e.status === "check").length };

  return (
    <div className="mx-auto max-w-[1000px]">
      <PageHeader
        title="Evidence"
        description="Every figure comes from a public report and names its source. The simulation uses these as anchors; everything else on screen is modelled. Verified means the figure matches what the named source reported. Needs checking means sources differ or applicability is not confirmed."
      >
        <Select value={status} onValueChange={(v) => setStatus(v as EvidenceStatus | "all")}>
          <SelectTrigger aria-label="Filter by status" className="h-9 w-44 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({EVIDENCE.length})</SelectItem>
            <SelectItem value="verified">Verified ({counts.verified})</SelectItem>
            <SelectItem value="check">Needs checking ({counts.check})</SelectItem>
          </SelectContent>
        </Select>
        <Select value={loop} onValueChange={(v) => setLoop(v as LoopId | "all")}>
          <SelectTrigger aria-label="Filter by loop" className="h-9 w-44 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All loops</SelectItem>
            {LOOPS.map((l) => <SelectItem key={l.id} value={l.id}>{l.short}</SelectItem>)}
          </SelectContent>
        </Select>
      </PageHeader>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">No figures match these filters.</div>
      ) : (
        <ul className="space-y-2">
          {items.map((e) => (
            <li key={e.id} className="glass flex flex-col gap-2 rounded-xl p-4 sm:flex-row sm:items-center sm:gap-4">
              <p className="font-display text-xl font-semibold tracking-tight text-primary-glow sm:w-32 sm:shrink-0">{e.value}</p>
              <div className="min-w-0 flex-1">
                <p className="text-sm">{e.claim}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Source: {e.source}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", e.status === "verified" ? "border-success/30 bg-success/10 text-success" : "border-warning/30 bg-brand-yellow/60 text-warning")}>
                  {e.status === "verified" ? <BadgeCheck className="size-3" aria-hidden /> : <SearchCheck className="size-3" aria-hidden />}
                  {e.status === "verified" ? "Verified" : "Needs checking"}
                </span>
                <InfoTip label={`Details for ${e.value}`}>
                  {e.note && <p className="mb-2 rounded-md bg-brand-yellow/60 px-2 py-1.5 text-foreground">{e.note}</p>}
                  <p className="mb-2">{e.usedFor}</p>
                  <div className="flex flex-wrap gap-1">{e.loops.map((l) => <LoopChip key={l} loop={l} />)}</div>
                </InfoTip>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
