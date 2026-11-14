import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Battery, Building2, Copy, Network, Share2, Sparkles, Target, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/ll/primitives";

export const Route = createFileRoute("/innovation")({
  head: () => ({
    meta: [
      { title: "Innovation — LoopLocal" },
      { name: "description", content: "What is new in LoopLocal: a neighbourhood-scale loop controller that joins water, power, waste and drains, and feeds the city platforms already being built." },
      { property: "og:title", content: "Innovation — LoopLocal" },
      { property: "og:description", content: "A neighbourhood layer for resilient, resource-smart infrastructure." },
    ],
  }),
  component: InnovationPage,
});

const IDEAS = [
  { icon: Workflow, title: "One engine across four systems", body: "Water, power, waste and drains are managed by different departments. LoopLocal ranks actions across all of them at once, so clearing a drain, filling a tank and routing waste are planned together." },
  { icon: Battery, title: "A tank is a battery", body: "Pumps are the biggest common load. Filling the tank with sunlight or before a planned cut stores water the way a battery stores power, and carries a hub through an outage." },
  { icon: Building2, title: "The Loop Hub as a unit", body: "One apartment complex or colony block can start with one or two parts and add more. The municipal view is simply every hub added together." },
  { icon: Share2, title: "Treated water as a resource", body: "On-site use first, recharge if quality passes, then surplus to nearby construction sites through a Green Water Tanker booking. Used water becomes a fifth loop." },
  { icon: Network, title: "Hubs share surplus", body: "One hub's extra biogas or treated water can serve a neighbour, which turns a set of buildings into a small local grid for water and energy." },
  { icon: Copy, title: "Playbooks that travel", body: "Every locality has a different fingerprint, so each starts with a different set of loops. The engine is the same; the first move changes." },
];

const SDGS = [
  { n: 6, color: "#26bde2", title: "Clean water and sanitation", body: "Recharge pits, treated-water reuse and fewer tanker trips." },
  { n: 7, color: "#fcc30b", title: "Affordable and clean energy", body: "Pumps and STP blowers scheduled into solar hours; biogas for backup." },
  { n: 9, color: "#fd6925", title: "Industry, innovation and infrastructure", body: "A software layer that makes existing buildings and utilities more resilient." },
  { n: 11, color: "#fd9d24", title: "Sustainable cities and communities", body: "Fewer flooded streets, fewer outages, wet waste kept out of drains." },
];

const LANDSCAPE = [
  { what: "City command centres", scale: "City", covers: "Departmental data in one place", gap: "Show data; actions stay with each department" },
  { what: "Flood alert systems (Chennai, Bengaluru)", scale: "City or ward", covers: "One problem: flooding", gap: "No link to water supply, power or waste" },
  { what: "Energy platforms such as demand response", scale: "Grid", covers: "One problem: electricity demand", gap: "Does not see water, drains or waste" },
  { what: "HMWSSB treated-water platform (in development)", scale: "City", covers: "Connecting STPs with buyers", gap: "Needs hub-side data and scheduling to feed it" },
];

function InnovationPage() {
  return (
    <div className="mx-auto max-w-[1300px]">
      <PageHeader eyebrow="Innovation in infrastructure" title="A neighbourhood layer that joins the loops" description="Cities already have command centres, flood alerts and energy platforms. They work at city scale or on one problem. LoopLocal works at neighbourhood scale, joins all the loops and turns data into dispatched actions.">
        <Button asChild variant="hero"><Link to="/storm">See it in a storm <ArrowRight /></Link></Button>
      </PageHeader>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {IDEAS.map((i, n) => (
          <motion.article key={i.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: n * 0.04 }} className="glass glow-border rounded-xl p-4">
            <span className="grid size-9 place-items-center rounded-lg bg-primary/15 text-primary-glow"><i.icon className="size-4" aria-hidden /></span>
            <h3 className="mt-3 text-sm font-semibold">{i.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{i.body}</p>
          </motion.article>
        ))}
      </div>

      <Panel title="Where LoopLocal sits" subtitle="The hub-side engine that feeds city platforms" icon={Sparkles} className="mt-4">
        <svg viewBox="0 0 900 190" className="h-auto w-full" role="img" aria-label="Loop Hubs feed the LoopLocal Core, which feeds city platforms">
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(20 ${20 + i * 52})`}>
              <rect width="170" height="42" rx="10" fill="var(--surface)" stroke="var(--loop-waste)" strokeOpacity={0.6} />
              <text x="85" y="26" textAnchor="middle" fontSize="12" fill="var(--foreground)">Loop Hub {String.fromCharCode(65 + i)}</text>
              <path d={`M170 21 C 240 21, 240 ${75 - i * 52}, 310 ${75 - i * 52}`} fill="none" stroke="var(--loop-waste)" strokeWidth="2" strokeDasharray="5 8" className="animate-flow" />
            </g>
          ))}
          <g transform="translate(330 55)">
            <rect width="220" height="80" rx="16" fill="var(--surface)" stroke="var(--primary-glow)" strokeWidth="2" />
            <text x="110" y="34" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--primary-glow)" style={{ fontFamily: "var(--font-display)" }}>LoopLocal Core</text>
            <text x="110" y="56" textAnchor="middle" fontSize="11" fill="var(--muted-foreground)">decide · dispatch · Loop Score</text>
          </g>
          {["Water board platform", "Discom demand response", "City command centre"].map((t, i) => (
            <g key={t} transform={`translate(710 ${20 + i * 52})`}>
              <rect width="170" height="42" rx="10" fill="var(--surface)" stroke="var(--loop-reuse)" strokeOpacity={0.6} />
              <text x="85" y="26" textAnchor="middle" fontSize="11.5" fill="var(--foreground)">{t}</text>
              <path d={`M-160 ${75 - i * 52} C -90 ${75 - i * 52}, -90 21, 0 21`} fill="none" stroke="var(--loop-reuse)" strokeWidth="2" strokeDasharray="5 8" className="animate-flow" />
            </g>
          ))}
        </svg>
        <p className="mt-2 text-xs text-muted-foreground">LoopLocal does not replace these systems. It is the neighbourhood-side layer that gives them hub-level data and turns their alerts into scheduled local actions.</p>
      </Panel>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Panel title="How it differs from what exists" subtitle="No product we found does exactly this, though we cannot prove none exists" icon={Target}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead><tr className="text-[11px] uppercase tracking-wider text-muted-foreground"><th className="pb-2 pr-3 font-medium">Existing approach</th><th className="pb-2 pr-3 font-medium">Scale</th><th className="pb-2 pr-3 font-medium">Covers</th><th className="pb-2 font-medium">Gap LoopLocal fills</th></tr></thead>
              <tbody className="divide-y">
                {LANDSCAPE.map((l) => (<tr key={l.what}><td className="py-2 pr-3 font-medium">{l.what}</td><td className="py-2 pr-3">{l.scale}</td><td className="py-2 pr-3 text-muted-foreground">{l.covers}</td><td className="py-2 text-muted-foreground">{l.gap}</td></tr>))}
                <tr className="bg-primary/10"><td className="py-2 pl-2 pr-3 font-semibold text-primary-glow">LoopLocal</td><td className="py-2 pr-3">Neighbourhood</td><td className="py-2 pr-3">Water, power, waste and drains together</td><td className="py-2 pr-2">Turns data into dispatched actions</td></tr>
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="The universal goals it serves" icon={Sparkles}>
          <ul className="space-y-3">
            {SDGS.map((g) => (
              <li key={g.n} className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg font-display text-lg font-bold text-black/80" style={{ background: g.color }} aria-hidden>{g.n}</span>
                <div><p className="text-sm font-medium">SDG {g.n} · {g.title}</p><p className="text-xs text-muted-foreground">{g.body}</p></div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
