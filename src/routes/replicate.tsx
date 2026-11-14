import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import { ArrowRight, Copy, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="mx-auto max-w-[1500px]">
      <PageHeader eyebrow="Replicate" title="Same engine, a different playbook for every locality" description="Each locality has its own fingerprint: where its loops are strong and where they leak. The Core starts every locality with the loops that close its weakest links first.">
        <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">Illustrative weights</span>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel title="Fingerprint comparison" subtitle="Loop strength, 0 to 100. Closer to the edge is stronger." icon={Copy}>
          <div className="h-[380px] w-full" role="img" aria-label="Radar chart comparing the five loop scores of five Hyderabad localities">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={overlay} outerRadius="72%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="loop" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} />
                {LOCALITIES.map((loc, i) => (
                  <Radar key={loc.id} name={loc.name} dataKey={loc.id} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={loc.id === activeId ? 0.28 : 0.06} strokeWidth={loc.id === activeId ? 2.5 : 1.25} />
                ))}
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Who starts where" subtitle="The weakest loop sets each locality's first move" icon={MapPin}>
          <div className="divide-y rounded-lg border text-sm">
            {LOCALITIES.map((loc, i) => {
              const w = weakest(loc.fingerprint);
              const first = loc.playbook[0];
              return (
                <div key={loc.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2.5">
                  <span className="size-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} aria-hidden />
                  <div className="min-w-0">
                    <p className="font-medium">{loc.name} <span className="text-xs font-normal text-muted-foreground">· {loc.zone}</span></p>
                    <p className="truncate text-xs text-muted-foreground">Weakest: {LOOP_BY_ID[w].short} ({loc.fingerprint[w]}) → start with “{first.title}”</p>
                  </div>
                  <LoopChip loop={first.loop} />
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {LOCALITIES.map((loc, i) => {
          const data = LOOPS.map((l) => ({ loop: l.short, v: loc.fingerprint[l.id] }));
          const active = loc.id === activeId;
          return (
            <motion.article key={loc.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass glow-border rounded-xl p-4">
              <header className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold">{loc.name}</h3>
                  <p className="text-xs text-muted-foreground">{loc.zone} · {(loc.population / 1000).toFixed(0)}k people · ~{(loc.tankerBookingsMonth / 1000).toFixed(1)}k tanker bookings / month</p>
                </div>
                {active && <span className="rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary-glow">Active</span>}
              </header>
              <div className="h-44 w-full" role="img" aria-label={`${loc.name} loop fingerprint`}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={data} outerRadius="70%">
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="loop" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar dataKey="v" stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.3} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <h4 className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Starting playbook</h4>
              <ol className="mt-2 space-y-2">
                {loc.playbook.map((p, n) => (
                  <li key={p.title} className="flex gap-2 text-xs">
                    <span className="mt-0.5 font-mono text-[10px] text-primary-glow">0{n + 1}</span>
                    <div><p className="font-medium">{p.title} <LoopChip loop={p.loop} className="ml-1 align-middle" /></p><p className="text-muted-foreground">{p.why}</p></div>
                  </li>
                ))}
              </ol>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant={active ? "soft" : "glass"} onClick={() => setLocality(loc.id)}>{active ? "Active locality" : "Make active"}</Button>
                <Button size="sm" variant="ghost" asChild><Link to="/command" onClick={() => { setLocality(loc.id); setRole("officer"); }}>Open Command <ArrowRight /></Link></Button>
              </div>
            </motion.article>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Fingerprints and playbooks for localities other than Kukatpally are illustrative weights meant to show how the starting plan changes, not survey results.</p>
    </div>
  );
}
