import { Battery, Building2, Copy, Network, Share2, Sparkles, Target, Workflow } from "lucide-react";
import { Panel } from "@/components/ll/primitives";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const IDEAS = [
  { icon: Workflow, title: "One engine across four systems", body: "Water, power, waste and drains are managed by different departments. LoopLocal ranks actions across all of them at once, so clearing a drain, filling a tank and routing waste are planned together." },
  { icon: Battery, title: "A tank is a battery", body: "Pumps are the biggest common load. Filling the tank with sunlight or before a planned cut stores water the way a battery stores power, and carries a hub through an outage." },
  { icon: Building2, title: "The Loop Hub as a unit", body: "One apartment complex or colony block can start with one or two parts and add more. The municipal view is simply every hub added together." },
  { icon: Share2, title: "Treated water as a resource", body: "On-site use first, recharge if quality passes, then surplus to nearby construction sites through a Green Water Tanker booking. Used water becomes a fifth loop." },
  { icon: Network, title: "Hubs share surplus", body: "One hub's extra biogas or treated water can serve a neighbour, which turns a set of buildings into a small local grid for water and energy." },
  { icon: Copy, title: "Playbooks that travel", body: "Every locality has a different fingerprint, so each starts with a different set of loops. The engine is the same; the first move changes." },
];

const LANDSCAPE = [
  { what: "City command centres", scale: "City", covers: "Departmental data in one place", gap: "Show data; actions stay with each department" },
  { what: "Flood alert systems", scale: "City or ward", covers: "One problem: flooding", gap: "No link to water supply, power or waste" },
  { what: "Demand-response energy platforms", scale: "Grid", covers: "One problem: electricity demand", gap: "Do not see water, drains or waste" },
  { what: "Utility treated-water booking", scale: "City", covers: "Connecting treatment plants with buyers", gap: "Needs hub-side data and scheduling to feed it" },
];

const TARGETS = [
  { id: "9.1", body: "Quality, reliable, sustainable and resilient infrastructure. A hub that keeps water on through a power cut is resilient infrastructure at building scale." },
  { id: "9.4", body: "Upgrade infrastructure to be sustainable, with more efficient use of resources. LoopLocal retrofits what already exists: pumps, tanks, plants and drains, with software and a few sensors." },
];

/** The SDG 9 story: what is new here, where it sits among existing systems, and how it differs. */
export function Sdg9() {
  return (
    <div>
      <p className="mb-3 max-w-3xl text-sm text-muted-foreground">
        Cities already have command centres, flood alerts and energy platforms. They work at city scale or on one problem. LoopLocal works at neighbourhood scale, joins all the loops and turns data into dispatched actions.
      </p>
      <ul className="mb-4 grid gap-3 md:grid-cols-2">
        {TARGETS.map((t) => (
          <li key={t.id} className="glass flex items-start gap-3 rounded-xl p-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg font-mono text-sm font-semibold" style={{ background: "var(--brand-burgundy)", color: "#ffffff" }}>{t.id}</span>
            <p className="text-sm leading-relaxed text-muted-foreground"><span className="font-medium text-foreground">SDG target {t.id}. </span>{t.body}</p>
          </li>
        ))}
      </ul>

      <Tabs defaultValue="ideas">
        <TabsList>
          <TabsTrigger value="ideas">Ideas</TabsTrigger>
          <TabsTrigger value="sits">Where it sits</TabsTrigger>
          <TabsTrigger value="differs">How it differs</TabsTrigger>
        </TabsList>

        <TabsContent value="ideas" className="mt-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {IDEAS.map((i) => (
              <article key={i.title} className="glass rounded-xl p-4">
                <span className="grid size-9 place-items-center rounded-lg bg-primary/15 text-primary-glow"><i.icon className="size-4" aria-hidden /></span>
                <h3 className="mt-3 text-sm font-semibold">{i.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{i.body}</p>
              </article>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sits" className="mt-3">
          <Panel title="Where LoopLocal sits" subtitle="The hub-side engine that feeds city platforms. It does not replace them: it gives them hub-level data and turns their alerts into scheduled actions." icon={Sparkles}>
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
          </Panel>
        </TabsContent>

        <TabsContent value="differs" className="mt-3">
          <Panel title="How it differs from what exists" subtitle="Categories of existing approach, described in general terms. We have not found a product that joins all four systems, though we cannot prove none exists." icon={Target}>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
