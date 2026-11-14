import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import { ArrowRight, Copy, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LOCALITIES } from "@/lib/sim/data";
import { LOOPS, LOOP_BY_ID } from "@/lib/sim/loops";
import type { LoopId } from "@/lib/sim/types";
import { useApp } from "@/store/app";
import { LoopChip, PageHeader, Panel } from "@/components/ll/primitives";

export const Route = createFileRoute("/replicate")({
  head: () => ({
    meta: [
      { title: "Replicate — LoopLocal" },
      { name: "description", content: "Compare Kukatpally, LB Nagar, Uppal, Yousufguda and Ameerpet by loop fingerprint and see the different playbook each locality starts with." },
      { property: "og:title", content: "Replicate — LoopLocal" },
      { property: "og:description", content: "Each locality has its own loop fingerprint, so each starts with a different playbook." },
    ],
  }),
  component: ReplicatePage,
});

const COLORS = ["var(--loop-solar)", "var(--loop-reuse)", "var(--loop-waste)", "var(--loop-rain)", "var(--loop-save)"];

function ReplicatePage() {
  const activeId = useApp((s) => s.localityId);
  const setLocality = useApp((s) => s.setLocality);
  const setRole = useApp((s) => s.setRole);

  const overlay = useMemo(() => LOOPS.map((l) => {
    const row: Record<string, string | number> = { loop: l.short };
    for (const loc of LOCALITIES) row[loc.id] = loc.fingerprint[l.id];
    return row;
  }), []);

  const weakest = (fp: Record<LoopId, number>) => (Object.keys(fp) as LoopId[]).reduce((a, b) => (fp[b] < fp[a] ? b : a));

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        title="Replicate"
        description="Each locality has its own fingerprint: where its loops are strong and where they leak. The Core starts every locality with the loops that close its weakest links first. Fingerprints and playbooks for localities other than Kukatpally are illustrative weights that show how the starting plan changes, not survey results."
      >
        <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">Illustrative weights</span>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Fingerprints" subtitle="Loop strength from 0 to 100. Closer to the edge is stronger. The active locality is drawn thicker." icon={Copy}>
          <div className="h-[360px] w-full" role="img" aria-label="Radar chart comparing the five loop scores of five Hyderabad localities">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={overlay} outerRadius="72%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="loop" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} />
                {LOCALITIES.map((loc, i) => (
                  <Radar key={loc.id} name={loc.name} dataKey={loc.id} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={loc.id === activeId ? 0.25 : 0.04} strokeWidth={loc.id === activeId ? 2.5 : 1.25} />
                ))}
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Where each locality starts" subtitle="The weakest loop sets each locality's first move. Open one to see its three-step playbook." icon={MapPin}>
          <Accordion type="single" collapsible defaultValue={activeId}>
            {LOCALITIES.map((loc, i) => {
              const w = weakest(loc.fingerprint);
              const active = loc.id === activeId;
              return (
                <AccordionItem key={loc.id} value={loc.id}>
                  <AccordionTrigger className="py-3 text-left">
                    <span className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} aria-hidden />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{loc.name}{active && <span className="ml-2 rounded-full bg-brand-yellow px-2 py-0.5 text-[10px] font-medium">Active</span>}</span>
                        <span className="block truncate text-xs font-normal text-muted-foreground">Weakest loop: {LOOP_BY_ID[w].short} ({loc.fingerprint[w]})</span>
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2 text-xs text-muted-foreground">{loc.zone} · {(loc.population / 1000).toFixed(0)}k people · about {(loc.tankerBookingsMonth / 1000).toFixed(1)}k tanker bookings a month</p>
                    <ol className="space-y-2">
                      {loc.playbook.map((p, n) => (
                        <li key={p.title} className="flex gap-2 text-sm">
                          <span className="mt-0.5 font-mono text-[11px] text-primary-glow">0{n + 1}</span>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{p.title}</p>
                            <p className="text-xs text-muted-foreground">{p.why}</p>
                          </div>
                          <LoopChip loop={p.loop} className="self-start" />
                        </li>
                      ))}
                    </ol>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant={active ? "soft" : "glass"} onClick={() => setLocality(loc.id)}>{active ? "Active locality" : "Make active"}</Button>
                      <Button size="sm" variant="ghost" asChild><Link to="/command" onClick={() => { setLocality(loc.id); setRole("officer"); }}>Open Command <ArrowRight /></Link></Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </Panel>
      </div>
    </div>
  );
}
