import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, ExternalLink, SearchCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EVIDENCE, type EvidenceStatus } from "@/lib/evidence";
import { LOOPS } from "@/lib/sim/loops";
import type { LoopId } from "@/lib/sim/types";
import { LoopChip, PageHeader } from "@/components/ll/primitives";
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
    <div className="mx-auto max-w-[1400px]">
      <PageHeader eyebrow="Evidence" title="The numbers behind the problem" description="Every figure below comes from a public report and names its source. The simulation uses these as anchors; everything else on screen is modelled and shown in the Assumptions drawer.">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
          <Button size="sm" variant={status === "all" ? "soft" : "glass"} onClick={() => setStatus("all")}>All {EVIDENCE.length}</Button>
          <Button size="sm" variant={status === "verified" ? "soft" : "glass"} onClick={() => setStatus("verified")}><BadgeCheck /> Verified {counts.verified}</Button>
          <Button size="sm" variant={status === "check" ? "soft" : "glass"} onClick={() => setStatus("check")}><SearchCheck /> Needs checking {counts.check}</Button>
        </div>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by loop">
        <span className="mr-1 text-xs text-muted-foreground">Loop</span>
        <Button size="sm" variant={loop === "all" ? "soft" : "ghost"} onClick={() => setLoop("all")}>All</Button>
        {LOOPS.map((l) => (
          <Button key={l.id} size="sm" variant={loop === l.id ? "soft" : "ghost"} onClick={() => setLoop(l.id)} style={loop === l.id ? { color: l.color } : undefined}><l.icon aria-hidden /> {l.short}</Button>
        ))}
      </div>

      <p className="mb-4 rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <strong className="text-foreground">Verified</strong> means the figure matches what the named source reported. <strong className="text-foreground">Needs checking</strong> means sources differ or applicability is not confirmed. These are reported figures, not measurements from a LoopLocal deployment.
      </p>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">No figures match these filters.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((e, i) => (
            <motion.article key={e.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass glow-border flex flex-col rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-display text-2xl font-semibold tracking-tight text-primary-glow">{e.value}</p>
                <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", e.status === "verified" ? "border-success/30 bg-success/15 text-success" : "border-warning/30 bg-warning/15 text-warning")}>
                  {e.status === "verified" ? <BadgeCheck className="size-3" aria-hidden /> : <SearchCheck className="size-3" aria-hidden />}
                  {e.status === "verified" ? "Verified" : "Needs checking"}
                </span>
              </div>
              <p className="mt-2 text-sm">{e.claim}</p>
              {e.note && <p className="mt-2 rounded-md border border-warning/30 bg-warning/10 px-2 py-1.5 text-xs text-warning">{e.note}</p>}
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><ExternalLink className="size-3" aria-hidden /> Source: <span className="text-foreground">{e.source}</span></p>
              <div className="mt-auto pt-3">
                <p className="mb-1.5 text-[11px] text-muted-foreground">{e.usedFor}</p>
                <div className="flex flex-wrap gap-1">{e.loops.map((l) => <LoopChip key={l} loop={l} />)}</div>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}
